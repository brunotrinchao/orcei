import { Proposal } from '../models/Proposal'
import { nanoid } from 'nanoid'

export const ProposalService = {
  async listByProfile(profileId: string) {
    return await Proposal.find({ profileId }).sort({ createdAt: -1 })
  },

  async getBySlug(slug: string) {
    // Populamos o profileId para que o cliente veja o nome/marca do freelancer
    return await Proposal.findOne({ slug }).populate('profileId')
  },

  async create(data: any) {
    const slug = nanoid(10)
    const totals = this.calculateTotals(data.items, data.upsellItems || [])
    
    return await Proposal.create({
      ...data,
      slug,
      totals
    })
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
