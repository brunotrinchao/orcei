import { useStripe } from '../../../utils/stripe'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user || (session.user as any).role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado' })
  }

  const stripe = useStripe()
  const promoCodes = await stripe.promotionCodes.list({ limit: 100, expand: ['data.coupon'] })

  return {
    coupons: promoCodes.data.map((p) => ({
      id: p.id,
      code: p.code,
      active: p.active,
      credits: parseInt((p.coupon?.metadata as any)?.value || '0', 10),
      audience: (p.coupon?.metadata as any)?.audience || 'all',
      timesRedeemed: p.times_redeemed,
      maxRedemptions: p.max_redemptions,
      expiresAt: p.expires_at ? p.expires_at * 1000 : null,
      createdAt: p.created * 1000
    }))
  }
})
