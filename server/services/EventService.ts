import { Event } from '../models/Event'

export const EventService = {
  async listByProfile(profileId: string) {
    return await Event.find({ profileId }).populate('proposalId')
  },

  async create(data: any) {
    return await Event.create(data)
  },

  async update(id: string, profileId: string, data: any) {
    return await Event.findOneAndUpdate(
      { _id: id, profileId },
      data,
      { new: true }
    )
  },

  async delete(id: string, profileId: string) {
    return await Event.findOneAndDelete({ _id: id, profileId })
  }
}
