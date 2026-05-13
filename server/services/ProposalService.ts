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
    const totals = this.calculateTotals(data.items, data.upsellItems || [])
    
    // Se criar já como 'created', consome crédito
    if (data.status === 'created') {
      await this.consumeCredit(data.profileId)
    }

    return await Proposal.create({
      ...data,
      slug,
      totals
    })
  },

  async update(id: string, profileId: string, data: any) {
    const oldProposal = await Proposal.findOne({ _id: id, profileId })
    if (!oldProposal) return null
    if (oldProposal.status === 'accepted') return null

    // Consome crédito se mudar de draft para created/pending/etc
    if (oldProposal.status === 'draft' && data.status !== 'draft') {
      await this.consumeCredit(profileId)
    }

    const totals = this.calculateTotals(data.items, data.upsellItems || [])
    return await Proposal.findOneAndUpdate(
      { _id: id, profileId },
      { ...data, totals },
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

  calculateTotals(items: any[], upsellItems: any[] = []) {
    const subtotal = items.reduce((acc, item) => {
      const price = item.price || 0
      const qty = item.quantity || 1
      return acc + (price * qty)
    }, 0)

    // Logica de desconto simplificada para o MVP
    return {
      subtotal,
      discount: 0,
      final: subtotal
    }
  }
}
