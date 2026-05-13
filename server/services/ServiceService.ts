import { Service } from '../models/Service'

export const ServiceService = {
  async listByProfile(profileId: string) {
    return await Service.find({ profileId }).sort({ createdAt: -1 })
  },

  async create(data: { profileId: string; name: string; description?: string; basePrice: number; billingType: 'hour' | 'fixed' }) {
    return await Service.create(data)
  },

  async delete(id: string, profileId: string) {
    return await Service.findOneAndDelete({ _id: id, profileId })
  },

  async update(id: string, data: any) {
    return await Service.findByIdAndUpdate(id, data, { new: true })
  }
}
