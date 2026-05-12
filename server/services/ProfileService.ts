import { Profile } from '../models/Profile'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27' as any
})

export const ProfileService = {
  async createForUser(user: any) {
    const existing = await Profile.findOne({ userId: user.id })
    if (existing) return existing

    // Criar Customer no Stripe
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id }
    })

    return await Profile.create({
      userId: user.id,
      name: user.name,
      email: user.email,
      creditsBalance: 1, // Default inicial
      stripeCustomerId: customer.id,
      subscriptionPlan: 'free'
    })
  },

  async getByUserId(userId: string) {
    return await Profile.findOne({ userId })
  }
}
