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
    return await Proposal.findOne({ slug }).populate('profileId', 'name avatar brandConfig address company contact email')
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
    const counter = await Counter.findOneAndUpdate(
      { profileId: data.profileId, year: currentYear },
      { $inc: { lastSequence: 1 } },
      { upsert: true, returnDocument: 'after' }
    )

    const sequenceNumber = counter.lastSequence
    const code = `#ORC-${currentYear}-${String(sequenceNumber).padStart(3, '0')}`

    const profile = await Profile.findById(data.profileId)
    const validityDays = profile?.defaultValidityDays || 7
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + validityDays)

    // Se criar já como 'created' e sendMethod for 'auto', consome crédito e agenda envio
    let emailQueued = false
    if (data.status === ProposalStatus.CREATED) {
      await this.consumeCredit(data.profileId)

      if (data.sendMethod !== SendMethod.MANUAL) {
        if (profile && data.client?.email) {
          const proposalUrl = `${process.env.PUBLIC_URL || 'https://orcei.com.br'}/p/${slug}?t=${token}`
          await QueueService.publish('SEND_EMAIL_PROPOSAL', {
            clientEmail: data.client.email,
            clientName: data.client.name,
            url: proposalUrl,
            profileName: profile.name
          })
          emailQueued = true
        }
      }
    }

    const proposal = await Proposal.create({
      ...data,
      title: data.title?.trim() || code,
      slug,
      token,
      sequenceNumber,
      code,
      totals,
      expiresAt
    })

    await this.logHistory(proposal._id, ProposalStatus.CREATED)
    if (emailQueued) {
      await this.logHistory(proposal._id, ProposalStatus.SENT, 'email', { status: 'queued' })
    }

    return proposal
  },

  async update(id: string, profileId: string, data: any) {
    const oldProposal = await Proposal.findOne({ _id: id, profileId })
    if (!oldProposal) return null
    if (oldProposal.status === ProposalStatus.ACCEPTED) return null

    let emailQueued = false

    // Consome crédito se mudar de draft para created/pending/etc
    if (oldProposal.status === ProposalStatus.DRAFT && data.status !== ProposalStatus.DRAFT) {
      await this.consumeCredit(profileId)

      // Se mudou para 'created' e não for manual, agenda e-mail
      if (data.status === ProposalStatus.CREATED && data.sendMethod !== SendMethod.MANUAL) {
        const profile = await Profile.findById(profileId)
        if (profile && data.client?.email) {
          const proposalUrl = `${process.env.PUBLIC_URL || 'https://orcei.com.br'}/p/${oldProposal.slug}?t=${oldProposal.token}`
          await QueueService.publish('SEND_EMAIL_PROPOSAL', {
            clientEmail: data.client.email,
            clientName: data.client.name,
            url: proposalUrl,
            profileName: profile.name
          })
          emailQueued = true
        }
      }
    }

    const totals = this.calculateTotals(data.items, data.totals?.additional || 0, data.totals?.discount || 0, data.paymentConfig)
    const updated = await Proposal.findOneAndUpdate(
      { _id: id, profileId },
      { ...data, totals },
      { returnDocument: 'after' }
    )

    if (updated && emailQueued) {
      await this.logHistory(updated._id, ProposalStatus.SENT, 'email', { status: 'queued' })
    }

    return updated
  },

  async consumeCredit(profileId: string) {
    const profile = await Profile.findById(profileId)
    if (!profile) return

    const hasActiveSubscription =
      profile.subscriptionPlan !== 'free' &&
      (profile.subscriptionStatus === SubscriptionStatus.ACTIVE || profile.subscriptionStatus === SubscriptionStatus.TRIALING)

    if (!hasActiveSubscription && profile.creditsUsed >= profile.creditsBalance) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Créditos insuficientes. Faça um upgrade do seu plano.'
      })
    }

    await Profile.findByIdAndUpdate(profileId, { $inc: { creditsUsed: 1 } })
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

  async acceptProposal(slug: string, paymentMethod: PaymentMethod) {
    const proposal = await Proposal.findOne({ slug }).populate('profileId')
    if (!proposal) return null
    
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

