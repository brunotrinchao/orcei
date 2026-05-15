import { Profile } from '../../models/Profile'

export default defineEventHandler(async (event) => {
  console.log('--- Incoming Stripe Webhook Request ---')
  
  const body = await readRawBody(event)
  const signature = getHeader(event, 'stripe-signature')
  const config = useRuntimeConfig()
  const stripe = useStripe()

  if (!signature) {
    console.error('Webhook Error: No stripe-signature found in headers')
    throw createError({ statusCode: 400, statusMessage: 'No signature' })
  }

  let stripeEvent: any

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      body!,
      signature!,
      config.stripeWebhookSecret!
    )
  } catch (err: any) {
    console.error('Stripe Webhook Signature Verification Failed:', err.message)
    console.log('Secret used:', config.stripeWebhookSecret?.substring(0, 10) + '...')
    throw createError({ statusCode: 400, statusMessage: `Webhook Error: ${err.message}` })
  }

  const session = stripeEvent.data.object as any
  console.log(`Webhook Event: ${stripeEvent.type}`, {
    eventId: stripeEvent.id,
    customerId: session.customer,
    subscriptionId: session.subscription || session.id
  })

  // Helper para mapear Plano
  const getPlanByPriceId = (priceId: string): 'free' | 'starter' | 'premium' | null => {
    const p = config.public
    console.log('Comparing Price ID:', priceId)
    console.log('Available IDs:', { 
      starter: p.stripeStarterPriceId, 
      premium: p.stripePremiumPriceId, 
      monthly: p.stripePriceMonthly, 
      annual: p.stripePriceAnnual 
    })

    if (priceId === p.stripeStarterPriceId) return 'starter'
    if (priceId === p.stripePremiumPriceId) return 'premium'
    if (priceId === p.stripePriceMonthly) return 'premium'
    if (priceId === p.stripePriceAnnual) return 'premium'
    return null
  }

  try {
    // 1. Checkout Completo
    if (stripeEvent.type === 'checkout.session.completed') {
      const customerId = session.customer
      const profileId = session.metadata?.profileId
      const type = session.metadata?.type || 'subscription'
      const tier = session.metadata?.tier
      
      console.log('Checkout Completed. Metadata:', session.metadata)

      if (type === 'subscription' && session.mode === 'subscription') {
        const subscriptionId = session.subscription
        const subscription = await stripe.subscriptions.retrieve(subscriptionId as string)
        const priceId = subscription.items.data?.[0]?.price?.id
        
        const plan = getPlanByPriceId(priceId || '')
        const credits = plan === 'premium' ? 9999 : (plan === 'starter' ? 5 : 0)

        if (plan) {
          const query = profileId ? { _id: profileId } : { stripeCustomerId: customerId }
          const updated = await Profile.findOneAndUpdate(
            query,
            { 
              $set: {
                subscriptionPlan: plan, 
                creditsBalance: credits,
                stripeSubscriptionId: subscriptionId,
                stripeCustomerId: customerId
              }
            },
            { new: true }
          )
          console.log('Database Updated (Subscription):', { plan, email: updated?.email, success: !!updated })
        }
      } else if (type === 'credits' && session.mode === 'payment') {
        const creditsToAdd = tier === 'single_credit' ? 1 : 0
        const query = profileId ? { _id: profileId } : { stripeCustomerId: customerId }
        
        const updated = await Profile.findOneAndUpdate(
          query,
          { 
            $inc: { creditsBalance: creditsToAdd },
            $set: { stripeCustomerId: customerId }
          },
          { new: true }
        )
        console.log('Database Updated (Credits):', { creditsToAdd, email: updated?.email, success: !!updated })
      }
    }

    // 2. Pagamento de Renovação
    if (stripeEvent.type === 'invoice.payment_succeeded') {
      const customerId = session.customer
      const subscriptionId = session.subscription
      
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId as string)
        const priceId = subscription.items.data?.[0]?.price?.id
        const plan = getPlanByPriceId(priceId || '')
        const credits = plan === 'premium' ? 9999 : (plan === 'starter' ? 5 : 0)

        if (plan) {
          const updated = await Profile.findOneAndUpdate(
            { stripeCustomerId: customerId },
            { 
              $set: {
                subscriptionPlan: plan, 
                creditsBalance: credits,
                stripeSubscriptionId: subscriptionId 
              }
            },
            { new: true }
          )
          console.log('Database Updated (Renewal):', { plan, email: updated?.email })
        }
      }
    }

    // 3. Cancelamento Definitivo
    if (stripeEvent.type === 'customer.subscription.deleted') {
      const customerId = session.customer
      const updated = await Profile.findOneAndUpdate(
        { stripeCustomerId: customerId },
        { 
          $set: {
            subscriptionPlan: 'free',
            stripeSubscriptionId: null 
          }
        },
        { new: true }
      )
      console.log('Database Updated (Canceled):', { email: updated?.email })
    }

  } catch (dbErr: any) {
    console.error('DATABASE UPDATE ERROR IN WEBHOOK:', dbErr.message)
  }

  return { received: true }
})
