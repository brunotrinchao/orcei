import { Proposal } from '../models/Proposal'
import { Profile } from '../models/Profile'
import { Counter } from '../models/Counter'
import { ProposalHistory } from '../models/ProposalHistory'
import { Event } from '../models/Event'
import { nanoid } from 'nanoid'
import { QueueService } from './QueueService'
import { NotificationService } from './NotificationService'
import { generateProposalPdfBuffer } from '../utils/pdf'
import { sendProposalAcceptedEmail } from '../utils/email'

import { ProposalStatus, PaymentMethod, SendMethod, SubscriptionStatus } from '../../types/enums'
import { getActionCost, chargeCredit } from '../utils/credits'

export const ProposalService = {
  async listByProfile(profileId: string) {
    return await Proposal.find({ profileId }).sort({ createdAt: -1 })
  },

  async getById(id: string, profileId: string) {
    const proposal = await Proposal.findOne({ _id: id, profileId })
    if (proposal && (proposal as any).signature?.documentId && (proposal as any).signature?.status !== 'signed') {
      try {
        const { AssinafyService } = await import('./AssinafyService')
        const doc = await AssinafyService.getDocument((proposal as any).signature.documentId)
        if (doc) {
          const docStatus = (doc.status || '').toLowerCase()
          const isSigned = docStatus === 'signed' || docStatus === 'completed' || doc.is_closed === true || (doc.assignment?.signers && doc.assignment.signers.length > 0 && doc.assignment.signers.every((s: any) => s.completed))
          if (isSigned) {
            proposal.signature = proposal.signature || {}
            proposal.signature.status = 'signed'
            proposal.signature.signedAt = proposal.signature.signedAt || new Date()
            proposal.status = 'accepted'
            const downloadUrl = doc.download_url || doc.pdf_url || doc.signed_file_url || (doc.artifacts && doc.artifacts.original)
            if (downloadUrl) {
              proposal.signature.signedFileUrl = downloadUrl
            }
            await proposal.save()
            await this.logHistory(proposal._id, 'signed', 'signature', { provider: 'assinafy', documentId: proposal.signature.documentId, autoSynced: true })
          }
        }
      } catch (err) {
        console.warn('[ProposalService] Erro ao sincronizar status Assinafy em getById:', err)
      }
    }
    return proposal
  },

  async getBySlug(slug: string) {
    // Populamos o profileId apenas com campos necessários para evitar vazamento de tokens sensíveis
    return await Proposal.findOne({ slug }).populate('profileId', 'name avatar brandConfig address company contact email userId')
  },

  async logHistory(proposalId: any, action: string, type: 'system' | 'email' | 'signature' = 'system', details?: any) {
    try {
      await ProposalHistory.create({
        proposalId,
        type,
        action,
        details,
        timestamp: new Date()
      })
    } catch (err) {
      console.error('[ProposalService] Failed to log history:', err)
    }
  },

  async getHistory(proposalId: string) {
    return await ProposalHistory.find({ proposalId }).sort({ timestamp: -1 })
  },

  /**
   * Wrapper público: tenta criar a proposta dentro de uma transação; se o
   * cluster MongoDB não suportar transações nessa topologia (ex: erro
   * "Only servers in a sharded cluster can start a new transaction..." —
   * comum em certas configurações standalone/serverless), repete UMA vez
   * sem sessão em vez de propagar o erro cru do driver pro usuário.
   */
  async create(data: any, isAdmin = false) {
    try {
      return await this._createTxn(data, isAdmin, true)
    } catch (error: any) {
      if (this._isUnsupportedTransactionError(error)) {
        console.warn('[ProposalService] Transações não suportadas nesta topologia MongoDB — repetindo sem sessão.')
        return await this._createTxn(data, isAdmin, false)
      }
      throw error
    }
  },

  _isUnsupportedTransactionError(error: any): boolean {
    const msg = String(error?.message || error?.errmsg || '')
    return error?.code === 20 || /sharded cluster can start a new transaction/i.test(msg)
  },

  async _createTxn(data: any, isAdmin: boolean, useSession: boolean) {
    const slug = nanoid(10)
    const token = nanoid(20)
    const totals = this.calculateTotals(data.items, data.totals?.additional || 0, data.totals?.discount || 0, data.paymentConfig)

    // Numeração Sequencial
    const currentYear = new Date().getFullYear()

    const session = (useSession && typeof Profile.db?.startSession === 'function') ? await Profile.db.startSession() : null
    if (session) {
      session.startTransaction()
    }

    try {
      const costPromise = (data.status === ProposalStatus.CREATED && !isAdmin)
        ? getActionCost('proposalSend')
        : Promise.resolve(0)

      const [counter, profile, cost] = await Promise.all([
        Counter.findOneAndUpdate(
          { profileId: data.profileId, year: currentYear },
          { $inc: { lastSequence: 1 } },
          { upsert: true, returnDocument: 'after', session: session || undefined }
        ),
        session 
          ? Profile.findById(data.profileId).session(session) 
          : Profile.findById(data.profileId),
        costPromise
      ])

      if (!counter) throw new Error('Falha ao gerar número de sequência')
      const sequenceNumber = counter.lastSequence
      const code = `#ORC-${currentYear}-${String(sequenceNumber).padStart(3, '0')}`

      const validityDays = profile?.defaultValidityDays || 7
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + validityDays)

      // Verificação de saldo ANTES de persistir o orçamento
      if (data.status === ProposalStatus.CREATED && !isAdmin && cost > 0) {
        if (!profile || profile.creditsBalance < cost) {
          throw createError({ statusCode: 402, statusMessage: 'Saldo de créditos insuficiente. Adquira créditos para continuar.' })
        }
      }

      let proposal: any
      if (session) {
        const [created] = await Proposal.create([{
          ...data,
          title: data.title?.trim() || code,
          slug,
          token,
          sequenceNumber,
          code,
          totals,
          expiresAt
        }], { session })
        proposal = created
      } else {
        proposal = await Proposal.create({
          ...data,
          title: data.title?.trim() || code,
          slug,
          token,
          sequenceNumber,
          code,
          totals,
          expiresAt
        })
      }

      // Se criar já como 'created' e sendMethod for 'auto', consome crédito e agenda envio
      let emailQueued = false
      if (data.status === ProposalStatus.CREATED) {
        await this.consumeCredit(data.profileId, cost, session || undefined, isAdmin)

        if (data.sendMethod !== SendMethod.MANUAL) {
          if (profile && data.client?.email) {
            const domain = process.env.PUBLIC_PROPOSAL_URL || process.env.PUBLIC_URL || 'https://orcamento.orceifacil.com.br'
            const proposalUrl = `${domain}/p/${slug}?t=${token}`
            await QueueService.publish('SEND_EMAIL_PROPOSAL', {
              clientEmail: data.client.email,
              clientName: data.client.name,
              url: proposalUrl,
              profileName: profile.name,
              proposalId: proposal._id
            })
            emailQueued = true
          }
        }
      }

      await this.logHistory(proposal._id, ProposalStatus.CREATED)
      if (emailQueued) {
        await this.logHistory(proposal._id, ProposalStatus.SENT, 'email', { status: 'queued' })
      }

      if (session) {
        await session.commitTransaction()
      }
      return proposal
    } catch (error) {
      if (session) {
        await session.abortTransaction()
      }
      throw error
    } finally {
      if (session) {
        session.endSession()
      }
    }
  },

  /** Mesmo fallback de `create()`: repete sem sessão se a topologia não suportar transações. */
  async update(id: string, profileId: string, data: any, isAdmin = false) {
    try {
      return await this._updateTxn(id, profileId, data, isAdmin, true)
    } catch (error: any) {
      if (this._isUnsupportedTransactionError(error)) {
        console.warn('[ProposalService] Transações não suportadas nesta topologia MongoDB — repetindo sem sessão.')
        return await this._updateTxn(id, profileId, data, isAdmin, false)
      }
      throw error
    }
  },

  async _updateTxn(id: string, profileId: string, data: any, isAdmin: boolean, useSession: boolean) {
    const oldProposal = await Proposal.findOne({ _id: id, profileId })
    if (!oldProposal) return null
    if (oldProposal.status === ProposalStatus.ACCEPTED) return null

    // Verificação de saldo ANTES de abrir a transação, se a transição for cobrar crédito
    const willCharge = oldProposal.status === ProposalStatus.DRAFT && data.status !== ProposalStatus.DRAFT
    let cost = 0
    if (willCharge && !isAdmin) {
      const [costVal, profileCheck] = await Promise.all([
        getActionCost('proposalSend'),
        Profile.findById(profileId)
      ])
      cost = costVal
      if (cost > 0) {
        if (!profileCheck || profileCheck.creditsBalance < cost) {
          throw createError({ statusCode: 402, statusMessage: 'Saldo de créditos insuficiente. Adquira créditos para continuar.' })
        }
      }
    }

    let emailQueued = false
    const session = (useSession && typeof Profile.db?.startSession === 'function') ? await Profile.db.startSession() : null
    if (session) {
      session.startTransaction()
    }

    try {
      // Consome crédito se mudar de draft para created/pending/etc
      if (willCharge) {
        await this.consumeCredit(profileId, cost, session || undefined, isAdmin)

        // Se mudou para 'created' e não for manual, agenda e-mail
        if (data.status === ProposalStatus.CREATED && data.sendMethod !== SendMethod.MANUAL) {
          const profile = session 
            ? await Profile.findById(profileId).session(session) 
            : await Profile.findById(profileId)
          if (profile && data.client?.email) {
            const domain = process.env.PUBLIC_PROPOSAL_URL || process.env.PUBLIC_URL || 'https://orcamento.orceifacil.com.br'
            const proposalUrl = `${domain}/p/${oldProposal.slug}?t=${oldProposal.token}`
            await QueueService.publish('SEND_EMAIL_PROPOSAL', {
              clientEmail: data.client.email,
              clientName: data.client.name,
              url: proposalUrl,
              profileName: profile.name,
              proposalId: oldProposal._id
            })
            emailQueued = true
          }
        }
      }

      const totals = data.items
        ? this.calculateTotals(data.items, data.totals?.additional || 0, data.totals?.discount || 0, data.paymentConfig)
        : undefined
      const updated = await Proposal.findOneAndUpdate(
        { _id: id, profileId },
        { ...data, ...(totals !== undefined ? { totals } : {}) },
        { returnDocument: 'after', session: session || undefined }
      )

      if (updated && emailQueued) {
        await this.logHistory(updated._id, ProposalStatus.SENT, 'email', { status: 'queued' })
      }

      if (session) {
        await session.commitTransaction()
      }
      return updated
    } catch (error) {
      if (session) {
        await session.abortTransaction()
      }
      throw error
    } finally {
      if (session) {
        session.endSession()
      }
    }
  },

  async updateContractText(id: string, profileId: string, contractText: string) {
    const proposal = await Proposal.findOne({ _id: id, profileId })
    if (!proposal) return null
    if (proposal.status !== ProposalStatus.PENDING) return null
    return await Proposal.findOneAndUpdate(
      { _id: id, profileId },
      { $set: { contractText } },
      { returnDocument: 'after' }
    )
  },

  async delete(id: string, profileId: string) {
    const proposal = await Proposal.findOne({ _id: id, profileId })
    if (!proposal) return null
    if (proposal.status === ProposalStatus.ACCEPTED) {
      throw createError({ statusCode: 409, statusMessage: 'Não é possível excluir um orçamento já aceito.' })
    }
    return await Proposal.findOneAndDelete({ _id: id, profileId })
  },

  async consumeCredit(profileId: string, cost: number, session?: any, isAdmin = false) {
    if (isAdmin) return // admin não paga crédito, mesmo padrão dos endpoints de IA
    if (cost === 0) return

    if (typeof Profile.findOneAndUpdate === 'function') {
      await chargeCredit(profileId, cost, isAdmin, {
        errorMessage: 'Saldo de créditos insuficiente. Adquira créditos para continuar.',
        session
      })
    } else {
      // Fallback para ambiente de testes unitários
      const profile = await Profile.findById(profileId)
      if (!profile || profile.creditsBalance < cost) {
        throw createError({
          statusCode: 402,
          statusMessage: 'Saldo de créditos insuficiente. Adquira créditos para continuar.'
        })
      }
      await Profile.findByIdAndUpdate(profileId, { $inc: { creditsBalance: -cost, creditsUsed: cost } })
    }
  },

  async updateStatus(slug: string, status: string) {
    const updated = await Proposal.findOneAndUpdate({ slug }, { status }, { returnDocument: 'after' })
    if (updated) {
      // Map system status updates to history actions
      const actionMap: Record<string, string> = {
        [ProposalStatus.CREATED]: ProposalStatus.CREATED,
        [ProposalStatus.ACCEPTED]: ProposalStatus.ACCEPTED,
        [ProposalStatus.EXPIRED]: 'declined',
        [ProposalStatus.VIEWED]: ProposalStatus.VIEWED,
        [ProposalStatus.PENDING]: ProposalStatus.PENDING
      }
      await this.logHistory(updated._id, actionMap[status] || status)
    }
    return updated
  },

  async ensureApplicationCalendarEvent(proposal: any, profile: any) {
    if (!proposal?.executionDate) return null
    try {
      const profileId = profile?._id || profile
      const existing = await Event.findOne({ proposalId: proposal._id })
      if (!existing) {
        const start = new Date(proposal.executionDate)
        const end = new Date(start.getTime() + 60 * 60 * 1000)
        const createdEvent = await Event.create({
          profileId,
          proposalId: proposal._id,
          title: `Execução: ${proposal.title || proposal.code}`,
          description: `Orçamento Aceito: ${proposal.code}\nCliente: ${proposal.client?.name || ''}\nValor: R$ ${(proposal.totals?.final || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          start,
          end,
          color: '#3B82F6'
        })
        console.log(`[ProposalService] Evento criado na agenda da aplicação para: ${proposal.code}`)
        return createdEvent
      }
      return existing
    } catch (err) {
      console.error('[ProposalService] Erro ao criar evento na agenda da aplicação:', err)
      return null
    }
  },

  async acceptProposal(slug: string, paymentMethod: PaymentMethod, selectedUpsells?: string[]) {
    const proposal = await Proposal.findOne({ slug }).populate('profileId')
    if (!proposal) return null

    // Se houver upsellItems selecionados pelo cliente, adiciona-os nos itens principais da proposta
    if (selectedUpsells && selectedUpsells.length > 0 && proposal.upsellItems) {
      const activeUpsells = proposal.upsellItems.filter((item: any) => selectedUpsells.includes(item._id.toString()))
      if (activeUpsells.length > 0) {
        const mappedUpsells = activeUpsells.map((u: any) => ({ ...u.toObject(), isUpsell: true }))
        proposal.items.push(...mappedUpsells)
        proposal.upsellItems = proposal.upsellItems.filter((item: any) => !selectedUpsells.includes(item._id.toString()))
        await proposal.save()
      }
    }
    
    // Calculate final totals based on client choice
    const totals = this.calculateTotals(proposal.items, proposal.totals?.additional || 0, proposal.totals?.discount || 0, {
      ...(proposal.paymentConfig || {}),
      method: paymentMethod
    })

    const updated = await Proposal.findOneAndUpdate(
      { slug }, 
      { 
        status: ProposalStatus.ACCEPTED,
        'paymentConfig.method': paymentMethod,
        items: proposal.items,
        upsellItems: proposal.upsellItems,
        totals
      }, 
      { returnDocument: 'after' }
    )

    if (updated) {
      await this.logHistory(updated._id, ProposalStatus.ACCEPTED, 'system', { paymentMethod })

      const profile: any = proposal.profileId

      // Se possuir data de execução, cria evento na agenda da aplicação se ainda não existir
      await this.ensureApplicationCalendarEvent(updated, profile)

      // Agendar Automação Google via Fila
      if (profile?.googleIntegration?.refreshToken) {
        try {
          await QueueService.publish('PROPOSAL_ACCEPTED', { proposalId: updated._id })
          console.log(`[ProposalService] Automação Google agendada via fila para: ${updated.code}`)
        } catch (error) {
          console.error(`[ProposalService] Erro ao agendar automação Google para ${updated.code}:`, error)
        }
      }

      // Notificar prestador de serviço sobre orçamento aceito
      try {
        const profileIdStr = typeof profile === 'object' ? profile._id.toString() : profile.toString()
        const clientName = updated.client?.name || 'Cliente'
        const clientEmail = updated.client?.email || ''
        await NotificationService.createNotification({
          profileId: profileIdStr,
          type: 'proposal_accepted',
          title: 'Orçamento Aceito!',
          summary: `O cliente ${clientName} aceitou a proposta #${updated.code}.`,
          details: {
            proposalId: updated._id.toString(),
            code: updated.code,
            title: updated.title,
            clientName,
            clientEmail,
            finalValue: updated.totals?.final,
            paymentMethod: updated.paymentConfig?.method,
            acceptedAt: new Date().toISOString()
          },
          metadata: {
            proposalId: updated._id.toString(),
            code: updated.code
          }
        })
      } catch (notifErr) {
        console.error(`[ProposalService] Erro ao criar notificação de proposta aceita:`, notifErr)
      }

      // Automação: Enviar documento para assinatura eletrônica de forma automática via fila (Assinafy)
      if (updated.client?.name && updated.client?.email && updated.signature?.status !== 'signed' && updated.signature?.status !== 'pending') {
        try {
          const profileIdStr = typeof profile === 'object' ? profile._id.toString() : profile.toString()
          updated.signature = {
            provider: 'assinafy',
            documentId: updated.signature?.documentId || null,
            status: 'pending',
            signingUrl: updated.signature?.signingUrl || null,
            signedAt: null,
            signedFileUrl: null,
            rejectionReason: null,
            requestedAt: new Date()
          }
          await updated.save()

          await QueueService.publish('REQUEST_DIGITAL_SIGNATURE', {
            proposalId: updated._id.toString(),
            profileId: profileIdStr
          })
          await this.logHistory(updated._id, 'signature_requested', 'system', { status: 'queued', trigger: 'auto_on_acceptance' })
          console.log(`[ProposalService] Envio automático de assinatura agendado via fila para proposta aceita: ${updated.code}`)
        } catch (sigErr) {
          console.error(`[ProposalService] Erro ao agendar envio automático de assinatura para ${updated.code}:`, sigErr)
        }
      }
    }

    return updated
  },

  async declineProposal(slug: string) {
    const proposal = await Proposal.findOne({ slug }).populate('profileId')
    const updated = await Proposal.findOneAndUpdate({ slug }, { status: ProposalStatus.EXPIRED }, { returnDocument: 'after' })
    if (updated && proposal) {
      await this.logHistory(updated._id, 'declined')
      try {
        const profileIdStr = typeof proposal.profileId === 'object' ? (proposal.profileId as any)._id.toString() : proposal.profileId.toString()
        const clientName = updated.client?.name || 'Cliente'
        const clientEmail = updated.client?.email || ''
        await NotificationService.createNotification({
          profileId: profileIdStr,
          type: 'proposal_rejected',
          title: 'Orçamento Rejeitado',
          summary: `O cliente ${clientName} recusou a proposta #${updated.code}.`,
          details: {
            proposalId: updated._id.toString(),
            code: updated.code,
            title: updated.title,
            clientName,
            clientEmail,
            rejectedAt: new Date().toISOString()
          },
          metadata: {
            proposalId: updated._id.toString(),
            code: updated.code
          }
        })
      } catch (notifErr) {
        console.error(`[ProposalService] Erro ao criar notificação de proposta recusada:`, notifErr)
      }
    }
    return updated
  },

  async requestChanges(slug: string, notes?: string) {
    const updated = await Proposal.findOneAndUpdate({ slug }, { status: ProposalStatus.PENDING }, { returnDocument: 'after' })
    if (updated) {
      await this.logHistory(updated._id, ProposalStatus.PENDING, 'system', { notes })
    }
    return updated
  },

  calculateTotals(items: any[], additional: number = 0, discount: number = 0, paymentConfig: any = {}) {
    const subtotal = items.reduce((acc, item) => {
      const price = item.price || 0
      const qty = item.quantity || 1
      return acc + (price * qty)
    }, 0)

    const baseTotal = subtotal + (additional || 0) - (discount || 0)
    let final = baseTotal
    let cashDiscountValue = 0

    if (paymentConfig.method === PaymentMethod.CASH && paymentConfig.cashDiscount > 0) {
      cashDiscountValue = baseTotal * (paymentConfig.cashDiscount / 100)
      final = baseTotal - cashDiscountValue
    }

    return {
      subtotal,
      additional,
      discount,
      final
    }
  }
}

