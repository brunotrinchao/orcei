import { Proposal } from '../models/Proposal'
import { Profile } from '../models/Profile'
import { Counter } from '../models/Counter'
import { ProposalHistory } from '../models/ProposalHistory'
import { nanoid } from 'nanoid'
import { QueueService } from './QueueService'

import { ProposalStatus, PaymentMethod, SendMethod, SubscriptionStatus } from '../../types/enums'

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

  async create(data: any) {
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

      const sequenceNumber = counter.lastSequence
      const code = `#ORC-${currentYear}-${String(sequenceNumber).padStart(3, '0')}`

      const profile = session 
        ? await Profile.findById(data.profileId).session(session) 
        : await Profile.findById(data.profileId)
      const validityDays = profile?.defaultValidityDays || 7
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + validityDays)

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
        await this.consumeCredit(data.profileId, session || undefined)

        if (data.sendMethod !== SendMethod.MANUAL) {
          if (profile && data.client?.email) {
            const proposalUrl = `${process.env.PUBLIC_URL || 'https://orcei.com.br'}/p/${slug}?t=${token}`
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

  async update(id: string, profileId: string, data: any) {
    const oldProposal = await Proposal.findOne({ _id: id, profileId })
    if (!oldProposal) return null
    if (oldProposal.status === ProposalStatus.ACCEPTED) return null

    let emailQueued = false
    const session = typeof Profile.db?.startSession === 'function' ? await Profile.db.startSession() : null
    if (session) {
      session.startTransaction()
    }

    try {
      // Consome crédito se mudar de draft para created/pending/etc
      if (oldProposal.status === ProposalStatus.DRAFT && data.status !== ProposalStatus.DRAFT) {
        await this.consumeCredit(profileId, session || undefined)

        // Se mudou para 'created' e não for manual, agenda e-mail
        if (data.status === ProposalStatus.CREATED && data.sendMethod !== SendMethod.MANUAL) {
          const profile = session 
            ? await Profile.findById(profileId).session(session) 
            : await Profile.findById(profileId)
          if (profile && data.client?.email) {
            const proposalUrl = `${process.env.PUBLIC_URL || 'https://orcei.com.br'}/p/${oldProposal.slug}?t=${oldProposal.token}`
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

      const totals = this.calculateTotals(data.items, data.totals?.additional || 0, data.totals?.discount || 0, data.paymentConfig)
      const updated = await Proposal.findOneAndUpdate(
        { _id: id, profileId },
        { ...data, totals },
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

  async consumeCredit(profileId: string, session?: any) {
    if (typeof Profile.findOneAndUpdate === 'function') {
      const updatedProfile = await Profile.findOneAndUpdate(
        {
          _id: profileId,
          creditsBalance: { $gte: 1 }
        },
        { $inc: { creditsBalance: -1, creditsUsed: 1 } },
        { new: true, session }
      )

      if (!updatedProfile) {
        throw createError({
          statusCode: 402,
          statusMessage: 'Saldo de créditos insuficiente. Adquira créditos para continuar.'
        })
      }
    } else {
      // Fallback para ambiente de testes unitários
      const profile = await Profile.findById(profileId)
      if (!profile || profile.creditsBalance < 1) {
        throw createError({
          statusCode: 402,
          statusMessage: 'Saldo de créditos insuficiente. Adquira créditos para continuar.'
        })
      }
      await Profile.findByIdAndUpdate(profileId, { $inc: { creditsBalance: -1, creditsUsed: 1 } })
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
      await this.logHistory(updated._id, ProposalStatus.VIEWED, 'system', { notes })
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

