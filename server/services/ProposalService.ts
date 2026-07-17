import { Proposal } from '../models/Proposal'
import { Profile } from '../models/Profile'
import { Counter } from '../models/Counter'
import { ProposalHistory } from '../models/ProposalHistory'
import { nanoid } from 'nanoid'
import { QueueService } from './QueueService'

import { ProposalStatus, PaymentMethod, SendMethod, SubscriptionStatus } from '../../types/enums'
import { getActionCost, chargeCredit } from '../utils/credits'

export const ProposalService = {
  async listByProfile(profileId: string) {
    return await Proposal.find({ profileId }).sort({ createdAt: -1 })
  },

  async getById(id: string, profileId: string) {
    return await Proposal.findOne({ _id: id, profileId })
  },

  async getBySlug(slug: string) {
    // Populamos o profileId apenas com campos necessários para evitar vazamento de tokens sensíveis
    return await Proposal.findOne({ slug }).populate('profileId', 'name avatar brandConfig address company contact email userId')
  },

  async logHistory(proposalId: any, action: string, type: 'system' | 'email' = 'system', details?: any) {
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

  async create(data: any, isAdmin = false) {
    const slug = nanoid(10)
    const token = nanoid(20)
    const totals = this.calculateTotals(data.items, data.totals?.additional || 0, data.totals?.discount || 0, data.paymentConfig)

    // Numeração Sequencial
    const currentYear = new Date().getFullYear()

    const session = typeof Profile.db?.startSession === 'function' ? await Profile.db.startSession() : null
    if (session) {
      session.startTransaction()
    }

    try {
      const counter = await Counter.findOneAndUpdate(
        { profileId: data.profileId, year: currentYear },
        { $inc: { lastSequence: 1 } },
        { upsert: true, returnDocument: 'after', session: session || undefined }
      )

      if (!counter) throw new Error('Falha ao gerar número de sequência')
      const sequenceNumber = counter.lastSequence
      const code = `#ORC-${currentYear}-${String(sequenceNumber).padStart(3, '0')}`

      const profile = session 
        ? await Profile.findById(data.profileId).session(session) 
        : await Profile.findById(data.profileId)
      const validityDays = profile?.defaultValidityDays || 7
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + validityDays)

      // Verificação de saldo ANTES de persistir o orçamento
      const cost = await getActionCost('proposalSend')
      if (data.status === ProposalStatus.CREATED && !isAdmin && cost > 0 && (!profile || profile.creditsBalance < cost)) {
        throw createError({ statusCode: 402, statusMessage: 'Saldo de créditos insuficiente. Adquira créditos para continuar.' })
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
            const domain = process.env.PUBLIC_PROPOSAL_URL || process.env.PUBLIC_URL || 'https://orceifacil.com.br'
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

  async update(id: string, profileId: string, data: any, isAdmin = false) {
    const oldProposal = await Proposal.findOne({ _id: id, profileId })
    if (!oldProposal) return null
    if (oldProposal.status === ProposalStatus.ACCEPTED) return null

    // Verificação de saldo ANTES de abrir a transação, se a transição for cobrar crédito
    const willCharge = oldProposal.status === ProposalStatus.DRAFT && data.status !== ProposalStatus.DRAFT
    const cost = await getActionCost('proposalSend')
    if (willCharge && !isAdmin && cost > 0) {
      const profileCheck = await Profile.findById(profileId)
      if (!profileCheck || profileCheck.creditsBalance < cost) {
        throw createError({ statusCode: 402, statusMessage: 'Saldo de créditos insuficiente. Adquira créditos para continuar.' })
      }
    }

    let emailQueued = false
    const session = typeof Profile.db?.startSession === 'function' ? await Profile.db.startSession() : null
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
            const domain = process.env.PUBLIC_PROPOSAL_URL || process.env.PUBLIC_URL || 'https://orceifacil.com.br'
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

      // Agendar Automação Google via Fila
      const profile: any = proposal.profileId
      if (profile?.googleIntegration?.refreshToken) {
        try {
          await QueueService.publish('PROPOSAL_ACCEPTED', { proposalId: updated._id })
          console.log(`[ProposalService] Automação Google agendada via fila para: ${updated.code}`)
        } catch (error) {
          console.error(`[ProposalService] Erro ao agendar automação Google para ${updated.code}:`, error)
        }
      }
    }

    return updated
  },

  async declineProposal(slug: string) {
    const updated = await Proposal.findOneAndUpdate({ slug }, { status: ProposalStatus.EXPIRED }, { returnDocument: 'after' })
    if (updated) {
      await this.logHistory(updated._id, 'declined')
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

