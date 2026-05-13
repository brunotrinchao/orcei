import { Profile } from '../../models/Profile'

export default defineEventHandler(async (event) => {
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
    throw createError({ statusCode: 400, statusMessage: 'Webhook Error' })
  }

  const session = stripeEvent.data.object as any

  if (stripeEvent.type === 'checkout.session.completed') {
    const customerId = session.customer
    const profileId = session.metadata?.profileId

    if (session.mode === 'subscription') {
      const subscriptionId = session.subscription
      const subscription = await stripe.subscriptions.retrieve(subscriptionId as string)
      const priceId = subscription.items.data[0].price.id
      
      let plan: 'free' | 'starter' | 'premium' = 'free'
      let credits = 1

      if (priceId === config.stripeStarterPriceId) {
        plan = 'starter'
        credits = 5
      } else if (priceId === config.stripePremiumPriceId) {
        plan = 'premium'
        credits = 25
      }

      await Profile.findOneAndUpdate(
        { stripeCustomerId: customerId },
        { 
          subscriptionPlan: plan, 
          creditsBalance: credits,
          stripeSubscriptionId: subscriptionId 
        }
      )
    }
  }

  if (stripeEvent.type === 'invoice.payment_succeeded' || stripeEvent.type === 'customer.subscription.updated') {
    const customerId = session.customer
    const subscriptionId = session.subscription
    
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId as string)
      const priceId = subscription.items.data[0].price.id
      
      let plan: 'free' | 'starter' | 'premium' = 'free'
      let credits = 1

      if (priceId === config.stripeStarterPriceId) {
        plan = 'starter'
        credits = 5
      } else if (priceId === config.stripePremiumPriceId) {
        plan = 'premium'
        credits = 25
      }

      await Profile.findOneAndUpdate(
        { stripeCustomerId: customerId },
        { 
          subscriptionPlan: plan, 
          creditsBalance: credits,
          stripeSubscriptionId: subscriptionId 
        }
      )
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
  }

  return { received: true }
})
