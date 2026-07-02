import { ProfileService } from '../../../services/ProfileService'
import { Profile } from '../../../models/Profile'
import { useStripe } from '../../../utils/stripe'
import { sanitizeError } from '../../../utils/error-handler'
import { checkRateLimit } from '../../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })
  await checkRateLimit(event, { max: 5, windowMs: 60_000, keyPrefix: 'coupon-redeem' })
  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404 })

  const { code } = await readBody(event)
  if (!code?.trim()) throw createError({ statusCode: 400, statusMessage: 'Informe um código de cupom' })

  if (profile.redeemedCoupons?.includes(code)) {
    throw createError({ statusCode: 409, statusMessage: 'Você já utilizou este cupom' })
  }

  const stripe = useStripe()
  try {
    const promoCodes = await stripe.promotionCodes.list({ code, active: true, limit: 1, expand: ['data.coupon'] })
    const promo = promoCodes.data[0]
    if (!promo || !promo.coupon?.valid) {
      throw createError({ statusCode: 404, statusMessage: 'Cupom inválido ou expirado' })
    }

    const meta = promo.coupon.metadata || {}
    if (meta.type !== 'promotion') {
      throw createError({ statusCode: 422, statusMessage: 'Este cupom não concede créditos' })
    }

    const audience = meta.audience || 'all'
    if (audience === 'new' && profile.subscriptionStatus !== null) {
      throw createError({ statusCode: 422, statusMessage: 'Este cupom é exclusivo para novos usuários' })
    }
    if (audience === 'existing' && profile.subscriptionStatus === null) {
      throw createError({ statusCode: 422, statusMessage: 'Este cupom é exclusivo para quem já assinou algum plano' })
    }

    const creditsToAdd = parseInt(meta.value || '0', 10)
    if (!creditsToAdd || creditsToAdd <= 0) {
      throw createError({ statusCode: 422, statusMessage: 'Este cupom não concede créditos' })
    }

    const updated = await Profile.findOneAndUpdate(
      { _id: profile._id, redeemedCoupons: { $ne: code } },
      { $inc: { creditsBalance: creditsToAdd }, $push: { redeemedCoupons: code } },
      { new: true }
    )
    if (!updated) throw createError({ statusCode: 409, statusMessage: 'Você já utilizou este cupom' })

    return { success: true, creditsAdded: creditsToAdd, newBalance: updated.creditsBalance }
  } catch (e: any) {
    if (e.statusCode) throw e
    throw sanitizeError(e, 'Erro ao validar cupom')
  }
})
