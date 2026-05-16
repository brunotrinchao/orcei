import { Profile } from '../../models/Profile'
import { StripeEvent } from '../../models/StripeEvent'

export default defineEventHandler(async (event) => {
  const body = await readRawBody(event)
  const signature = getHeader(event, 'stripe-signature')
  const config = useRuntimeConfig()
  const stripe = useStripe()

  if (!signature) {
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
    throw createError({ statusCode: 400, statusMessage: `Webhook Error: ${err.message}` })
  }

  // Idempotency — skip duplicate events
  try {
    await StripeEvent.create({ eventId: stripeEvent.id, type: stripeEvent.type })
  } catch (e: any) {
    if (e?.code === 11000) {
      console.log('Duplicate Stripe event, skipping:', stripeEvent.id)
      return { received: true, duplicate: true }
    }
    throw createError({ statusCode: 500, statusMessage: 'Dedupe write failed' })
  }

  const session = stripeEvent.data.object as any

  // Helper to map price ID to plan name
  const getPlanByPriceId = (priceId: string): 'free' | 'starter' | 'premium' | null => {
    const p = config.public
    if (priceId === p.stripeStarterPriceId) return 'starter'
    if (priceId === p.stripePremiumPriceId) return 'premium'
    if (priceId === p.stripePriceMonthly) return 'premium'
    if (priceId === p.stripePriceAnnual) return 'premium'
    return null
  }

  try {
    // 1. Checkout Completed
    if (stripeEvent.type === 'checkout.session.completed') {
      const customerId = session.customer
      const profileId = session.metadata?.profileId
      const type = session.metadata?.type || 'subscription'
      const tier = session.metadata?.tier

      if (type === 'subscription' && session.mode === 'subscription') {
        const subscriptionId = session.subscription
        const subscription = await stripe.subscriptions.retrieve(subscriptionId as string)
        const priceId = subscription.items.data?.[0]?.price?.id
        const plan = getPlanByPriceId(priceId || '')
        const credits = plan === 'premium' ? 9999 : (plan === 'starter' ? 5 : 0)

        if (plan) {
          const query = profileId ? { _id: profileId } : { stripeCustomerId: customerId }
          const periodEnd = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : null

          const updated = await Profile.findOneAndUpdate(
            query,
            {
              $set: {
                subscriptionPlan: plan,
                subscriptionStatus: subscription.status,
                subscriptionEndsAt: periodEnd,
                cancelAtPeriodEnd: !!subscription.cancel_at_period_end,
                creditsBalance: credits,
                stripeSubscriptionId: subscriptionId,
                stripeCustomerId: customerId,
                stripePriceId: priceId || null
              }
            },
            { returnDocument: 'after' }
          )
          console.log('Profile updated (checkout.session.completed):', { plan, email: updated?.email })
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
          { returnDocument: 'after' }
        )
        console.log('Profile updated (credits):', { creditsToAdd, email: updated?.email })
      }
    }

    // 2. Subscription Updated (includes cancel_at_period_end from Customer Portal)
    if (stripeEvent.type === 'customer.subscription.updated' ||
        stripeEvent.type === 'customer.subscription.created') {
      const sub = session
      const customerId = sub.customer
      const priceId = sub.items?.data?.[0]?.price?.id
      const plan = getPlanByPriceId(priceId || '')
      const periodEnd = sub.current_period_end
        ? new Date(sub.current_period_end * 1000)
        : null

      const isActiveLike = ['active', 'trialing', 'past_due'].includes(sub.status)
      const updateFields: any = {
        subscriptionStatus: sub.status,
        subscriptionEndsAt: periodEnd,
        cancelAtPeriodEnd: !!sub.cancel_at_period_end,
        stripeSubscriptionId: sub.id,
        stripePriceId: priceId || null
      }
      // Only update plan on active-like statuses — don't downgrade while cancel_at_period_end=true
      if (plan && isActiveLike) updateFields.subscriptionPlan = plan

      const updated = await Profile.findOneAndUpdate(
        { stripeCustomerId: customerId },
        { $set: updateFields },
        { returnDocument: 'after' }
      )
      console.log('Profile updated (subscription.updated):', {
        email: updated?.email,
        status: sub.status,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        endsAt: periodEnd
      })
    }

    // 3. Renewal Payment
    if (stripeEvent.type === 'invoice.payment_succeeded') {
      const customerId = session.customer
      const subscriptionId = session.subscription

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId as string)
        const priceId = subscription.items.data?.[0]?.price?.id
        const plan = getPlanByPriceId(priceId || '')
        const credits = plan === 'premium' ? 9999 : (plan === 'starter' ? 5 : 0)

        if (plan) {
          const periodEnd = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : null

          const updated = await Profile.findOneAndUpdate(
            { stripeCustomerId: customerId },
            {
              $set: {
                subscriptionPlan: plan,
                subscriptionStatus: subscription.status,
                subscriptionEndsAt: periodEnd,
                cancelAtPeriodEnd: !!subscription.cancel_at_period_end,
                creditsBalance: credits,
                stripeSubscriptionId: subscriptionId,
                stripePriceId: priceId || null
              }
            },
            { returnDocument: 'after' }
          )
          console.log('Profile updated (invoice.payment_succeeded):', { plan, email: updated?.email })
        }
      }
    }

    // 4. Subscription Deleted — final cancellation at period end
    if (stripeEvent.type === 'customer.subscription.deleted') {
      const customerId = session.customer
      const updated = await Profile.findOneAndUpdate(
        { stripeCustomerId: customerId },
        {
          $set: {
            subscriptionPlan: 'free',
            subscriptionStatus: 'canceled',
            cancelAtPeriodEnd: false,
            subscriptionEndsAt: null,
            stripeSubscriptionId: null,
            stripePriceId: null
          }
        },
        { returnDocument: 'after' }
      )
      console.log('Profile updated (subscription.deleted):', { email: updated?.email })
    }

  } catch (dbErr: any) {
    console.error('Webhook handler error:', {
      eventId: stripeEvent.id,
      eventType: stripeEvent.type,
      message: dbErr.message
    })
    // Delete idempotency record so Stripe will retry
    try { await StripeEvent.deleteOne({ eventId: stripeEvent.id }) } catch {}
    throw createError({ statusCode: 500, statusMessage: 'Webhook processing failed' })
  }

  return { received: true }
})
