import { Profile } from '../../models/Profile'

export default defineEventHandler(async (event) => {
  console.log('--- Incoming Stripe Webhook Request ---')
  const body = await readRawBody(event)
  const signature = getHeader(event, 'stripe-signature')
  const config = useRuntimeConfig()
  const stripe = useStripe()

  let stripeEvent: any

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      body!,
      signature!,
      config.stripeWebhookSecret!
    )
  } catch (err: any) {
    console.error('Stripe Webhook Signature Verification Failed:', err.message)
    throw createError({ statusCode: 400, statusMessage: 'Webhook Error' })
  }

  const session = stripeEvent.data.object as any
  console.log(`Stripe Webhook Received: ${stripeEvent.type}`, {
    id: stripeEvent.id,
    customer: session.customer,
    subscription: session.subscription
  })

  // Mapeamento de Planos baseado no .env
  const getPlanByPriceId = (priceId: string): 'free' | 'starter' | 'premium' | null => {
    // Compara com os IDs do public runtimeConfig configurados no nuxt.config.ts
    if (priceId === config.public.stripeStarterPriceId) return 'starter'
    if (priceId === config.public.stripePremiumPriceId) return 'premium'
    if (priceId === config.public.stripePriceMonthly) return 'premium'
    if (priceId === config.public.stripePriceAnnual) return 'premium'
    return null
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const customerId = session.customer
    const profileId = session.metadata?.profileId
    const type = session.metadata?.type || 'subscription'
    const tier = session.metadata?.tier
    
    console.log('Processing checkout.session.completed', { customerId, profileId, type, tier })

    if (type === 'subscription' && session.mode === 'subscription') {
      const subscriptionId = session.subscription
      const subscription = await stripe.subscriptions.retrieve(subscriptionId as string)
      const priceId = subscription.items.data?.[0]?.price?.id
      if (!priceId) return { received: true }
      
      const plan = getPlanByPriceId(priceId)
      // Premium ganha créditos ilimitados (ex: 9999) ou valor específico
      const credits = plan === 'premium' ? 9999 : (plan === 'starter' ? 5 : 0)

      if (plan) {
        const query = profileId ? { _id: profileId } : { stripeCustomerId: customerId }
        await Profile.findOneAndUpdate(
          query,
          { 
            subscriptionPlan: plan, 
            creditsBalance: credits,
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: customerId
          }
        )
        console.log('Profile updated after checkout (subscription)', { plan, customerId })
      }
    } else if (type === 'credits' && session.mode === 'payment') {
      let creditsToAdd = tier === 'single_credit' ? 1 : 0
      
      if (creditsToAdd > 0) {
        const query = profileId ? { _id: profileId } : { stripeCustomerId: customerId }
        await Profile.findOneAndUpdate(
          query,
          { 
            $inc: { creditsBalance: creditsToAdd },
            stripeCustomerId: customerId
          }
        )
        console.log('Profile updated after checkout (credits)', { creditsAdded: creditsToAdd, customerId })
      }
    }
  }

  if (stripeEvent.type === 'invoice.payment_succeeded' || stripeEvent.type === 'customer.subscription.updated') {
    const customerId = session.customer
    const subscriptionId = session.subscription
    
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId as string)
      const priceId = subscription.items.data?.[0]?.price?.id
      if (!priceId) return { received: true }
      
      const plan = getPlanByPriceId(priceId)
      const credits = plan === 'premium' ? 9999 : (plan === 'starter' ? 5 : 0)

      if (plan) {
        await Profile.findOneAndUpdate(
          { stripeCustomerId: customerId },
          { 
            subscriptionPlan: plan, 
            creditsBalance: credits,
            stripeSubscriptionId: subscriptionId 
          }
        )
        console.log('Profile updated after invoice/update', { plan, customerId })
      }
    }
  }

  if (stripeEvent.type === 'customer.subscription.deleted') {
    const customerId = session.customer
    await Profile.findOneAndUpdate(
      { stripeCustomerId: customerId },
      { 
        subscriptionPlan: 'free',
        stripeSubscriptionId: null 
      }
    )
    console.log('Profile reset to free plan due to subscription deletion')
  }

  return { received: true }
})
