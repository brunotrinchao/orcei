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
    eventId: stripeEvent.id,
    objectType: session.object,
    customerId: session.customer,
    subscriptionId: session.subscription || session.id // for sub.updated, id is sub id
  })

  // Mapeamento de Planos baseado no .env
  const getPlanByPriceId = (priceId: string): 'free' | 'starter' | 'premium' | null => {
    console.log('Checking Price ID:', priceId)
    if (priceId === config.public.stripeStarterPriceId) return 'starter'
    if (priceId === config.public.stripePremiumPriceId) return 'premium'
    if (priceId === config.public.stripePriceMonthly) return 'premium'
    if (priceId === config.public.stripePriceAnnual) return 'premium'
    return null
  }

  // EVENTO: Sessão de Checkout Finalizada
  if (stripeEvent.type === 'checkout.session.completed') {
    const customerId = session.customer
    const profileId = session.metadata?.profileId
    const type = session.metadata?.type || 'subscription'
    const tier = session.metadata?.tier
    
    console.log('Checkout Metadata:', session.metadata)

    if (type === 'subscription' && session.mode === 'subscription') {
      const subscriptionId = session.subscription
      console.log('Retrieving subscription details for:', subscriptionId)
      
      const subscription = await stripe.subscriptions.retrieve(subscriptionId as string)
      const priceId = subscription.items.data?.[0]?.price?.id
      
      const plan = getPlanByPriceId(priceId || '')
      const credits = plan === 'premium' ? 9999 : (plan === 'starter' ? 5 : 0)

      console.log('Determined Plan:', { plan, credits, priceId })

      if (plan) {
        // Tenta achar por profileId primeiro (mais seguro via metadata)
        // Se não tiver, tenta por email do metadata ou customerId
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
        
        if (updated) {
          console.log('SUCCESS: Profile updated with Subscription ID:', {
            email: updated.email,
            plan: updated.subscriptionPlan,
            subId: updated.stripeSubscriptionId
          })
        } else {
          console.error('ERROR: Profile not found for update!', query)
        }
      }
    } else if (type === 'credits' && session.mode === 'payment') {
      const creditsToAdd = tier === 'single_credit' ? 1 : 0
      console.log('Processing Credit Purchase:', { creditsToAdd, tier })

      if (creditsToAdd > 0) {
        const query = profileId ? { _id: profileId } : { stripeCustomerId: customerId }
        const updated = await Profile.findOneAndUpdate(
          query,
          { 
            $inc: { creditsBalance: creditsToAdd },
            $set: { stripeCustomerId: customerId }
          },
          { new: true }
        )
        console.log('Profile updated after credit purchase', { email: updated?.email, newBalance: updated?.creditsBalance })
      }
    }
  }

  // EVENTO: Pagamento de Fatura (Renovação)
  if (stripeEvent.type === 'invoice.payment_succeeded') {
    const customerId = session.customer
    const subscriptionId = session.subscription
    
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId as string)
      const priceId = subscription.items.data?.[0]?.price?.id
      const plan = getPlanByPriceId(priceId || '')
      const credits = plan === 'premium' ? 9999 : (plan === 'starter' ? 5 : 0)

      if (plan) {
        await Profile.findOneAndUpdate(
          { stripeCustomerId: customerId },
          { 
            $set: {
              subscriptionPlan: plan, 
              creditsBalance: credits,
              stripeSubscriptionId: subscriptionId 
            }
          }
        )
        console.log('Profile updated via invoice.payment_succeeded', { customerId, plan })
      }
    }
  }

  // EVENTO: Assinatura Cancelada/Deletada
  if (stripeEvent.type === 'customer.subscription.deleted') {
    const customerId = session.customer
    await Profile.findOneAndUpdate(
      { stripeCustomerId: customerId },
      { 
        $set: {
          subscriptionPlan: 'free',
          stripeSubscriptionId: null 
        }
      }
    )
    console.log('Profile reset to free due to subscription deletion', { customerId })
  }

  return { received: true }
})
