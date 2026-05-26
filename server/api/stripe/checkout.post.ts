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
    priceId = tier === 'premium_monthly' ? config.public.stripePriceMonthly
            : tier === 'premium_annual' ? config.public.stripePriceAnnual
            : tier === 'starter' ? config.public.stripeStarterPriceId
            : tier === 'premium' ? config.public.stripePremiumPriceId : null
    
    // If not found in config, check if tier looks like a Stripe Price ID
    if (!priceId && tier.startsWith('price_')) {
      priceId = tier
    }
    mode = 'subscription'
  } else {
    priceId = tier === 'single_credit' ? config.public.stripePriceSingle
            : tier === 'starter_pack' ? config.public.stripeCredits10PriceId
            : tier === 'pro_pack' ? (config.public.stripePremiumPriceId || 'price_mock_pro_pack')
            : tier === 'agency_pack' ? (config.public.stripePriceAnnual || 'price_mock_agency_pack')
            : tier === 'credits_5' ? config.public.stripeCredits5PriceId
            : tier === 'credits_10' ? config.public.stripeCredits10PriceId : null

    // If not found in config, check if tier looks like a Stripe Price ID
    if (!priceId && tier.startsWith('price_')) {
      priceId = tier
    }
    mode = 'payment'
  }

  if (!priceId) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: `Configuração de preço ausente para o nível: ${tier}. Verifique o arquivo .env` 
    })
  }

  const stripe = useStripe()
  
  try {
    const sessionParams: any = {
      customer: profile.stripeCustomerId || undefined,
      customer_email: profile.stripeCustomerId ? undefined : profile.email,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: mode,
      billing_address_collection: 'auto',
      success_url: `${process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/planos?success=true`,
      cancel_url: `${process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/planos?canceled=true`,
      metadata: {
        userId: (session.user as any).id,
        profileId: profile._id.toString(),
        type: type,
        tier: tier
      }
    }

    // Para pagamentos avulsos de créditos, reduzimos a validade da sessão para 1 hora
    // Isso acelera o disparo de checkout.session.expired para recuperar o carrinho rapidamente
    if (mode === 'payment') {
      sessionParams.expires_at = Math.floor(Date.now() / 1000) + 3600
    }

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams)

    return { url: checkoutSession.url }
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal Server Error'
    })
  }
})
