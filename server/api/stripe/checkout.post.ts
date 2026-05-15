import { ProfileService } from '../../services/ProfileService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404 })

  const body = await readBody(event)
  const { tier, type = 'subscription' } = body

  if (!tier) throw createError({ statusCode: 400, statusMessage: 'Tier is required' })

  const config = useRuntimeConfig()
  let priceId = null
  let mode: 'subscription' | 'payment' = 'subscription'

  if (type === 'subscription') {
    priceId = tier === 'premium_monthly' ? 'price_1TX8H8AlVNLVmnhmZ853tG6W'
            : tier === 'premium_annual' ? 'price_1TX8H8AlVNLVmnhmhSOVeFZO'
            : tier === 'starter' ? (config.stripeStarterPriceId as string)
            : tier === 'premium' ? (config.stripePremiumPriceId as string) : null
    mode = 'subscription'
  } else {
    priceId = tier === 'single_credit' ? 'price_1TX8H9AlVNLVmnhmKAwN6rgY'
            : tier === 'credits_5' ? 'price_1TWiwPAlVNLVmnhmP6JeWysB'
            : tier === 'credits_10' ? 'price_1TWixSAlVNLVmnhmvunY9vyK' : null
    mode = 'payment'
  }

  if (!priceId) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: `Invalid tier or Price ID not configured for: ${tier}` 
    })
  }

  const stripe = useStripe()
  
  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: profile.stripeCustomerId || undefined,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: mode,
      success_url: `${process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/billing?canceled=true`,
      metadata: {
        userId: (session.user as any).id,
        profileId: profile._id.toString(),
        type: type,
        tier: tier
      }
    })

    return { url: checkoutSession.url }
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal Server Error'
    })
  }
})
