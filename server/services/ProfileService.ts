import { Profile } from '../models/Profile'

export const ProfileService = {
  async createForUser(user: any) {
    const existing = await Profile.findOne({ userId: user.id })
    if (existing) return existing

    return await Profile.create({
      userId: user.id,
      name: user.name,
      email: user.email,
      creditsBalance: 1, // Default inicial
    })
  }
}
