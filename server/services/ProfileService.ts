import { Profile } from '../models/Profile'
import type { UserDTO } from '../../types/user'
import { sendWelcomeEmail } from '../utils/email'

export const ProfileService = {
  async createForUser(user: UserDTO) {
    const existing = await Profile.findOne({ userId: user.id })
    
    if (existing) {
      if (existing.isDeleted) {
        // Reativar conta deletada sem dar novos créditos grátis
        return await Profile.findByIdAndUpdate(existing._id, {
          isDeleted: false,
          deletedAt: null,
          name: user.name,
          avatar: user.avatar,
          email: user.email,
          creditsBalance: existing.creditsBalance // Mantém o que tinha (0 se foi zerado na exclusão)
        }, { returnDocument: 'after' })
      }
      return existing
    }

    // Verificar se existe perfil deletado com o mesmo e-mail (outra conta social etc)
    const existingEmail = await Profile.findOne({ email: user.email, isDeleted: true })
    const initialCredits = existingEmail ? 0 : 1

    const stripe = useStripe()
    let stripeCustomerId: string | undefined

    try {
      // Criar Customer no Stripe
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id }
      })
      stripeCustomerId = customer.id
    } catch (e: any) {
      console.error('Stripe Customer Creation failed:', e)
      throw createError({ statusCode: 500, statusMessage: 'Erro ao configurar conta de pagamentos (Stripe)' })
    }

    try {
      const profile = await Profile.create({
        userId: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        creditsBalance: initialCredits, // 0 se e-mail já existiu deletado
        stripeCustomerId: stripeCustomerId,
        subscriptionPlan: 'free'
      })

      // Send Welcome Email
      if (profile.email) {
        await sendWelcomeEmail(profile.email, profile.name)
      }

      return profile
    } catch (dbErr: any) {
      // Rollback Stripe customer if DB fails
      if (stripeCustomerId) {
        try { await stripe.customers.del(stripeCustomerId) } catch {}
      }
      throw dbErr
    }
  },

  async getByUserId(userId: string) {
    return await Profile.findOne({ userId, isDeleted: { $ne: true } })
  }
}
