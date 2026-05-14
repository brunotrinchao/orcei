import { Proposal } from '../models/Proposal'
import { Profile } from '../models/Profile'
import { nanoid } from 'nanoid'

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
    const totals = this.calculateTotals(data.items, data.upsellItems || [], data.paymentConfig)
    
    // Se criar já como 'created', consome crédito
    let lastEmailId = undefined
    if (data.status === 'created') {
      await this.consumeCredit(data.profileId)
      
      // Enviar e-mail via Resend
      const profile = await Profile.findById(data.profileId)
      if (profile && data.client?.email) {
        const proposalUrl = `${process.env.PUBLIC_URL || 'https://orcei.com.br'}/p/${slug}`
        const emailRes = await sendProposalEmail(
          data.client.email,
          data.client.name,
          proposalUrl,
          profile.name
        )
        if (emailRes) lastEmailId = emailRes.id
      }
    }

    return await Proposal.create({
      ...data,
      slug,
      totals,
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

      // Se mudou para 'created', envia e-mail
      if (data.status === 'created') {
        const profile = await Profile.findById(profileId)
        if (profile && data.client?.email) {
          const proposalUrl = `${process.env.PUBLIC_URL || 'https://orcei.com.br'}/p/${oldProposal.slug}`
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

    const totals = this.calculateTotals(data.items, data.upsellItems || [], data.paymentConfig)
    return await Proposal.findOneAndUpdate(
      { _id: id, profileId },
      { ...data, totals, lastEmailId },
      { new: true }
    )
  },

  async consumeCredit(profileId: string) {
    const profile = await Profile.findById(profileId)
    if (!profile) return

    if (profile.creditsUsed >= profile.creditsBalance) {
      throw createError({ 
        statusCode: 403, 
        statusMessage: 'Créditos insuficientes. Faça um upgrade do seu plano.' 
      })
    }

    await Profile.findByIdAndUpdate(profileId, { $inc: { creditsUsed: 1 } })
  },

  async updateStatus(slug: string, status: 'draft' | 'pending' | 'accepted' | 'expired' | 'created') {
    return await Proposal.findOneAndUpdate({ slug }, { status }, { new: true })
  },

  async acceptProposal(slug: string, paymentMethod: 'cash' | 'credit_card') {
    const proposal = await Proposal.findOne({ slug })
    if (!proposal) return null
    
    // Calculate final totals based on client choice
    const totals = this.calculateTotals(proposal.items, proposal.upsellItems || [], {
      ...proposal.paymentConfig,
      method: paymentMethod
    })

    return await Proposal.findOneAndUpdate(
      { slug }, 
      { 
        status: 'accepted',
        'paymentConfig.method': paymentMethod,
        totals
      }, 
      { new: true }
    )
  },

  calculateTotals(items: any[], upsellItems: any[] = [], paymentConfig: any = {}) {
    const subtotal = items.reduce((acc, item) => {
      const price = item.price || 0
      const qty = item.quantity || 1
      return acc + (price * qty)
    }, 0)

    let final = subtotal
    let discount = 0

    if (paymentConfig.method === 'cash' && paymentConfig.cashDiscount > 0) {
      discount = subtotal * (paymentConfig.cashDiscount / 100)
      final = subtotal - discount
    }

    return {
      subtotal,
      discount,
      final
    }
  }
}
