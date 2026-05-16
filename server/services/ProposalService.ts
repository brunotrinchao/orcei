import { Proposal } from '../models/Proposal'
import { Profile } from '../models/Profile'
import { Counter } from '../models/Counter'
import { nanoid } from 'nanoid'
import { sendProposalEmail } from '../utils/email'

export const ProposalService = {
  async listByProfile(profileId: string) {
    return await Proposal.find({ profileId }).sort({ createdAt: -1 })
  },

  async getById(id: string, profileId: string) {
    return await Proposal.findOne({ _id: id, profileId })
  },

  async getBySlug(slug: string) {
    // Populamos o profileId para que o cliente veja o nome/marca do freelancer
    return await Proposal.findOne({ slug }).populate('profileId')
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

    // Se criar já como 'created' e sendMethod for 'auto', consome crédito e envia
    let lastEmailId = undefined
    if (data.status === 'created') {
      await this.consumeCredit(data.profileId)

      if (data.sendMethod !== 'manual') {
        if (profile && data.client?.email) {
          const proposalUrl = `${process.env.PUBLIC_URL || 'https://orcei.com.br'}/p/${slug}?t=${token}`
          const emailRes = await sendProposalEmail(
            data.client.email,
            data.client.name,
            proposalUrl,
            profile.name
          )
          if (emailRes) lastEmailId = emailRes.id
        }
      }
    }

    return await Proposal.create({
      ...data,
      title: data.title?.trim() || code,
      slug,
      token,
      sequenceNumber,
      code,
      totals,
      expiresAt,
      lastEmailId
    })
  },

  async update(id: string, profileId: string, data: any) {
    const oldProposal = await Proposal.findOne({ _id: id, profileId })
    if (!oldProposal) return null
    if (oldProposal.status === 'accepted') return null

    let lastEmailId = oldProposal.lastEmailId
    // Consome crédito se mudar de draft para created/pending/etc
    if (oldProposal.status === 'draft' && data.status !== 'draft') {
      await this.consumeCredit(profileId)

      // Se mudou para 'created' e não for manual, envia e-mail
      if (data.status === 'created' && data.sendMethod !== 'manual') {
        const profile = await Profile.findById(profileId)
        if (profile && data.client?.email) {
          const proposalUrl = `${process.env.PUBLIC_URL || 'https://orcei.com.br'}/p/${oldProposal.slug}?t=${oldProposal.token}`
          const emailRes = await sendProposalEmail(
            data.client.email,
            data.client.name,
            proposalUrl,
            profile.name
          )
          if (emailRes) lastEmailId = emailRes.id
        }
      }
    }

    const totals = this.calculateTotals(data.items, data.totals?.additional || 0, data.totals?.discount || 0, data.paymentConfig)
    return await Proposal.findOneAndUpdate(
      { _id: id, profileId },
      { ...data, totals, lastEmailId },
      { returnDocument: 'after' }
    )
  },

  async consumeCredit(profileId: string) {
    const profile = await Profile.findById(profileId)
    if (!profile) return

    const hasActiveSubscription =
      profile.subscriptionPlan !== 'free' &&
      (profile.subscriptionStatus === 'active' || profile.subscriptionStatus === 'trialing')

    if (!hasActiveSubscription && profile.creditsUsed >= profile.creditsBalance) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Créditos insuficientes. Faça um upgrade do seu plano.'
      })
    }

    await Profile.findByIdAndUpdate(profileId, { $inc: { creditsUsed: 1 } })
  },

  async updateStatus(slug: string, status: 'draft' | 'pending' | 'accepted' | 'expired' | 'created') {
    return await Proposal.findOneAndUpdate({ slug }, { status }, { returnDocument: 'after' })
  },

  async acceptProposal(slug: string, paymentMethod: 'cash' | 'credit_card') {
    const proposal = await Proposal.findOne({ slug })
    if (!proposal) return null
    
    // Calculate final totals based on client choice
    const totals = this.calculateTotals(proposal.items, proposal.totals?.additional || 0, proposal.totals?.discount || 0, {
      ...(proposal.paymentConfig || {}),
      method: paymentMethod
    })

    return await Proposal.findOneAndUpdate(
      { slug }, 
      { 
        status: 'accepted',
        'paymentConfig.method': paymentMethod,
        totals
      }, 
      { returnDocument: 'after' }
    )
  },

  async declineProposal(slug: string) {
    return await Proposal.findOneAndUpdate({ slug }, { status: 'expired' }, { returnDocument: 'after' })
  },

  async requestChanges(slug: string, notes?: string) {
    // Optionally log notes to a history field if we had one
    return await Proposal.findOneAndUpdate({ slug }, { status: 'pending' }, { returnDocument: 'after' })
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

    if (paymentConfig.method === 'cash' && paymentConfig.cashDiscount > 0) {
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
