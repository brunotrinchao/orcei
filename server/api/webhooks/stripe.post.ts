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
      console.log('Retrieved subscription for checkout', { 
        subscriptionId, 
        priceId,
        configStarter: config.stripeStarterPriceId,
        configPremium: config.stripePremiumPriceId
      })
      
      let plan: 'free' | 'starter' | 'premium' | null = null
      let credits = 0

      if (priceId === config.stripeStarterPriceId) {
        plan = 'starter'
        credits = 5
      } else if (priceId === config.stripePremiumPriceId) {
        plan = 'premium'
        credits = 25
      }

      if (plan) {
        const query = profileId ? { _id: profileId } : { stripeCustomerId: customerId }
        const updatedProfile = await Profile.findOneAndUpdate(
          query,
          { 
            subscriptionPlan: plan, 
            creditsBalance: credits,
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: customerId
          },
          { new: true }
        )
        console.log('Profile updated after checkout (subscription)', { plan, profileId: updatedProfile?._id })
      }
    } else if (type === 'credits' && session.mode === 'payment') {
      // Compra de créditos avulsos
      let creditsToAdd = 0
      if (tier === 'credits_5') creditsToAdd = 5
      else if (tier === 'credits_10') creditsToAdd = 10

      if (creditsToAdd > 0) {
        const query = profileId ? { _id: profileId } : { stripeCustomerId: customerId }
        const updatedProfile = await Profile.findOneAndUpdate(
          query,
          { 
            $inc: { creditsBalance: creditsToAdd },
            stripeCustomerId: customerId
          },
          { new: true }
        )
        console.log('Profile updated after checkout (credits)', { creditsAdded: creditsToAdd, profileId: updatedProfile?._id })
      }
    }
  }

  if (stripeEvent.type === 'invoice.payment_succeeded' || stripeEvent.type === 'customer.subscription.updated') {
    const customerId = session.customer
    const subscriptionId = session.subscription
    console.log(`Processing ${stripeEvent.type}`, { customerId, subscriptionId })
    
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId as string)
      const priceId = subscription.items.data?.[0]?.price?.id
      if (!priceId) return { received: true }
      console.log('Retrieved subscription for update', { 
        subscriptionId, 
        priceId,
        configStarter: config.stripeStarterPriceId,
        configPremium: config.stripePremiumPriceId
      })
      
      let plan: 'free' | 'starter' | 'premium' | null = null
      let credits = 0

      if (priceId === config.stripeStarterPriceId) {
        plan = 'starter'
        credits = 5
      } else if (priceId === config.stripePremiumPriceId) {
        plan = 'premium'
        credits = 25
      }

      if (plan) {
        const updatedProfile = await Profile.findOneAndUpdate(
          { stripeCustomerId: customerId },
          { 
            subscriptionPlan: plan, 
            creditsBalance: credits,
            stripeSubscriptionId: subscriptionId 
          },
          { new: true }
        )
        console.log('Profile updated after invoice/update', { plan, profileId: updatedProfile?._id })
      } else {
        console.warn('Webhook Received with unknown Price ID. No plan update performed.', { priceId })
      }
    }
  }

  if (stripeEvent.type === 'customer.subscription.deleted') {
    const customerId = session.customer
    console.log('Processing customer.subscription.deleted', { customerId })
    
    await Profile.findOneAndUpdate(
      { stripeCustomerId: customerId },
      { 
        subscriptionPlan: 'free',
        stripeSubscriptionId: null 
      }
    )
    console.log('Profile reset to free plan')
  }

  return { received: true }
})
