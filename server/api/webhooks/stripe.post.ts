import Stripe from 'stripe'
import { Profile } from '../../models/Profile'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27' as any
})

export default defineEventHandler(async (event) => {
  const body = await readRawBody(event)
  const signature = getHeader(event, 'stripe-signature')

  let stripeEvent: Stripe.Event

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      body!,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    throw createError({ statusCode: 400, statusMessage: 'Webhook Error' })
  }

  const session = stripeEvent.data.object as any

  if (stripeEvent.type === 'invoice.payment_succeeded' || stripeEvent.type === 'customer.subscription.updated') {
    const customerId = session.customer
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    
    // Logica simples de tier baseada no ID do preco (mock para exemplo)
    let plan: 'free' | 'starter' | 'premium' = 'free'
    let credits = 1

    // Exemplo: map de IDs de preco do Stripe
    const priceId = subscription.items.data[0].price.id
    if (priceId === process.env.STRIPE_STARTER_PRICE_ID) {
      plan = 'starter'
      credits = 5
    } else if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) {
      plan = 'premium'
      credits = 25
    }

    await Profile.findOneAndUpdate(
      { stripeCustomerId: customerId },
      { 
        subscriptionPlan: plan, 
        creditsBalance: credits,
        stripeSubscriptionId: subscription.id 
      }
    )
  }

  return { received: true }
})
