import { Client } from '../models/Client'
import type { ClientDTO } from '../../types'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const ClientService = {
  async listByProfile(profileId: string) {
    return await Client.find({ profileId }).sort({ name: 1 })
  },

  // Multi-tenant: e-mail duplicado só é bloqueado DENTRO do mesmo profile
  // (mesmo e-mail pode existir em clientes de outros usuários normalmente).
  // Comparação case-insensitive pra "Ana@x.com" e "ana@x.com" contarem como
  // o mesmo e-mail. excludeClientId serve pra edição (não conflitar consigo mesmo).
  async emailExists(profileId: string, email: string, excludeClientId?: string) {
    const trimmed = email.trim()
    if (!trimmed) return false
    const query: any = {
      profileId,
      email: { $regex: `^${escapeRegExp(trimmed)}$`, $options: 'i' }
    }
    if (excludeClientId) query._id = { $ne: excludeClientId }
    const existing = await Client.findOne(query).select('_id')
    return !!existing
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
