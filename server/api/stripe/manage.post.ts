import { ProfileService } from '../../services/ProfileService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userId = (session.user as any).id
  const profile = await ProfileService.getByUserId(userId)
  
  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Profile not found' })
  }

  if (!profile.stripeSubscriptionId) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'No active subscription found to manage' 
    })
  }

  const body = await readBody(event)
  const { action, tier } = body

  if (!action || !['cancel', 'update'].includes(action)) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'Invalid action. Must be "cancel" or "update"' 
    })
  }

  const stripe = useStripe()

  try {
    if (action === 'cancel') {
      await stripe.subscriptions.cancel(profile.stripeSubscriptionId)
      return { message: 'Subscription canceled successfully' }
    }

    if (action === 'update') {
      if (!tier) {
        throw createError({ statusCode: 400, statusMessage: 'Tier is required for update' })
      }

      const config = useRuntimeConfig()
      const priceId = tier === 'starter' ? config.stripeStarterPriceId : tier === 'premium' ? config.stripePremiumPriceId : null

      if (!priceId) {
        throw createError({ 
          statusCode: 400, 
          statusMessage: `Invalid tier or Price ID not configured for: ${tier}` 
    })
  }

      // Retrieve subscription to get the subscription item ID
      const subscription = await stripe.subscriptions.retrieve(profile.stripeSubscriptionId)
      const subscriptionItemId = subscription.items.data?.[0]?.id
      if (!subscriptionItemId) throw createError({ statusCode: 500, statusMessage: 'Subscription item not found' })

      await stripe.subscriptions.update(profile.stripeSubscriptionId, {
        items: [{
          id: subscriptionItemId,
          price: priceId,
        }],
        proration_behavior: 'create_prorations',
      })

      return { message: 'Subscription updated successfully' }
    }
  } catch (error: any) {
    console.error('Stripe Management Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal Server Error'
    })
  }
})
