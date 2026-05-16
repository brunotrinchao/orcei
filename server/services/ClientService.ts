import { Client } from '../models/Client'
import type { ClientDTO } from '../../types'

export const ClientService = {
  async listByProfile(profileId: string) {
    return await Client.find({ profileId }).sort({ name: 1 })
  },

  async create(data: Partial<ClientDTO>) {
    return await Client.create(data)
  },

  async update(id: string, profileId: string, data: Partial<ClientDTO>) {
    return await Client.findOneAndUpdate(
      { _id: id, profileId },
      { $set: data },
      { returnDocument: 'after' }
    )
  },

  async delete(id: string, profileId: string) {
    return await Client.findOneAndDelete({ _id: id, profileId })
  },

  async getById(id: string, profileId: string) {
    return await Client.findOne({ _id: id, profileId })
  }
}
