import { Profile } from '../../models/Profile'
import { StripeEvent } from '../../models/StripeEvent'
import { QueueService } from '../../services/QueueService'

export default defineEventHandler(async (event) => {
  setResponseStatus(event, 200)

  const runNonBlocking = async (promise: Promise<any>) => {
    if (typeof event?.waitUntil === 'function') {
      event.waitUntil(promise)
    } else {
      await promise
    }
  }

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
                creditsUsed: 0, // Reset on new subscription
                stripeSubscriptionId: subscriptionId,
                stripeCustomerId: customerId,
                stripePriceId: priceId || null
              }
            },
            { returnDocument: 'after' }
          )
          console.log('Profile updated (checkout.session.completed):', { plan, email: updated?.email })

          if (updated?.email) {
            const amount = session.amount_total ? (session.amount_total / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'
            const billingCycle = (priceId === config.public.stripePriceAnnual) ? 'Anual' : 'Mensal'
            await runNonBlocking(QueueService.publish('SEND_EMAIL_PLAN_ACTIVATION', {
              userEmail: updated.email,
              userName: updated.name,
              planName: plan,
              credits,
              planPrice: amount,
              billingCycle
            }))
          }
        }
      } else if (type === 'credits' && session.mode === 'payment') {
        let creditsToAdd = 0
        
        // Resolve credit amount based on logical tier keys
        if (tier === 'single_credit') creditsToAdd = 1
        else if (tier === 'starter_pack' || tier === 'credits_10') creditsToAdd = 10
        else if (tier === 'pro_pack') creditsToAdd = 30
        else if (tier === 'agency_pack') creditsToAdd = 100
        else if (tier === 'credits_5') creditsToAdd = 5
        
        // Resolve based on environment configurations or Price ID match
        if (creditsToAdd === 0 && tier.startsWith('price_')) {
          const config = useRuntimeConfig()
          if (tier === config.public.stripePriceSingle) creditsToAdd = 1
          else if (tier === config.public.stripeCredits10PriceId) creditsToAdd = 10
          else if (tier === config.public.stripePremiumPriceId || tier === 'price_mock_pro_pack') creditsToAdd = 30
          else if (tier === config.public.stripePriceAnnual || tier === 'price_mock_agency_pack') creditsToAdd = 100
          else if (tier === config.public.stripeCredits5PriceId) creditsToAdd = 5
          else {
            // Dynamic fallback: query Stripe Price and expand the product to resolve credits or name
            try {
              const stripe = useStripe()
              const priceObj = await stripe.prices.retrieve(tier, { expand: ['product'] })
              const productObj = priceObj.product as any
              if (productObj && productObj.metadata?.credits) {
                creditsToAdd = parseInt(productObj.metadata.credits)
              } else if (productObj) {
                const productName = (productObj.name || '').toLowerCase()
                if (productName.includes('avulso') || productName.includes('single')) creditsToAdd = 1
                else if (productName.includes('starter')) creditsToAdd = 10
                else if (productName.includes('pro') || productName.includes('profissional') || productName.includes('professional')) creditsToAdd = 30
                else if (productName.includes('agência') || productName.includes('agency')) creditsToAdd = 100
              }
            } catch (err) {
              console.error('[Stripe Webhook] Erro ao buscar preço/produto para inferir créditos:', err)
            }
          }
        }

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

        if (updated?.email) {
          const amount = session.amount_total ? (session.amount_total / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'
          await runNonBlocking(QueueService.publish('SEND_EMAIL_BUY_CREDIT', {
            userEmail: updated.email,
            userName: updated.name,
            creditsAdded: creditsToAdd,
            newBalance: updated.creditsBalance,
            amountPaid: amount
          }))
        }
      }
    }

    // 2. Subscription Updated
    if (stripeEvent.type === 'customer.subscription.updated' ||
        stripeEvent.type === 'customer.subscription.created') {
      const sub = session
      const customerId = sub.customer
      const priceId = sub.items?.data?.[0]?.price?.id
      const plan = getPlanByPriceId(priceId || '')
      
      // Capturar data de término do período atual (importante para cancelamento agendado)
      const periodEnd = sub.current_period_end
        ? new Date(sub.current_period_end * 1000)
        : null

      const isActiveLike = ['active', 'trialing', 'past_due'].includes(sub.status)
      const updateFields: any = {
        subscriptionStatus: sub.status,
        subscriptionEndsAt: periodEnd, // SSSOT para data limite
        cancelAtPeriodEnd: !!sub.cancel_at_period_end,
        stripeSubscriptionId: sub.id,
        stripePriceId: priceId || null
      }
      if (plan && isActiveLike) updateFields.subscriptionPlan = plan

      const updated = await Profile.findOneAndUpdate(
        { stripeCustomerId: customerId },
        { $set: updateFields },
        { returnDocument: 'after' }
      )
      
      console.log('Profile updated (subscription.updated):', {
        email: updated?.email,
        status: sub.status,
        cancelAtPeriodEnd: !!sub.cancel_at_period_end,
        expiresAt: periodEnd?.toLocaleString('pt-BR')
      })

      // Se o usuário cancelou o cancelamento (reativou)
      if (updated && !sub.cancel_at_period_end && sub.status === 'active') {
        console.log('Subscription re-activated for:', updated.email)
      }
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
          const profile = await Profile.findOne({ stripeCustomerId: customerId })
          const periodEnd = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : null

          let novoCreditsBalance = credits

          if (profile) {
            // Calcular a preservação de créditos avulsos (add-ons)
            const oldPlan = profile.subscriptionPlan
            const oldPlanCredits = oldPlan === 'premium' ? 9999 : (oldPlan === 'starter' ? 5 : 1)
            const saldoLiquido = profile.creditsBalance - profile.creditsUsed
            const franquiaExpiravel = Math.max(0, oldPlanCredits - profile.creditsUsed)
            const avulsosRestantes = Math.max(0, saldoLiquido - franquiaExpiravel)
            novoCreditsBalance = credits + avulsosRestantes
          }

          const updated = await Profile.findOneAndUpdate(
            { stripeCustomerId: customerId },
            {
              $set: {
                subscriptionPlan: plan,
                subscriptionStatus: subscription.status,
                subscriptionEndsAt: periodEnd,
                cancelAtPeriodEnd: !!subscription.cancel_at_period_end,
                creditsBalance: novoCreditsBalance,
                creditsUsed: 0, // Reset for new billing cycle
                stripeSubscriptionId: subscriptionId,
                stripePriceId: priceId || null
              }
            },
            { returnDocument: 'after' }
          )
          console.log('Profile renewed (invoice.payment_succeeded):', { plan, email: updated?.email, creditsBalance: updated?.creditsBalance })

          if (updated?.email) {
            const amount = session.amount_paid ? (session.amount_paid / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'
            const billingCycle = (priceId === config.public.stripePriceAnnual) ? 'Anual' : 'Mensal'
            await runNonBlocking(QueueService.publish('SEND_EMAIL_PLAN_ACTIVATION', {
              userEmail: updated.email,
              userName: updated.name,
              planName: plan,
              credits: novoCreditsBalance,
              planPrice: amount,
              billingCycle
            }))
          }
        }
      }
    }

    // 4. Subscription Deleted
    if (stripeEvent.type === 'customer.subscription.deleted') {
      const customerId = session.customer
      const oldProfile = await Profile.findOne({ stripeCustomerId: customerId })
      
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

      if (updated?.email) {
        const cancellationDate = new Date().toLocaleString('pt-BR')
        const effectiveEndDate = oldProfile?.subscriptionEndsAt 
          ? new Date(oldProfile.subscriptionEndsAt).toLocaleDateString('pt-BR')
          : 'Imediato'
          
        await runNonBlocking(QueueService.publish('SEND_EMAIL_PLAN_CANCELLATION', {
          userEmail: updated.email,
          userName: updated.name,
          planName: oldProfile?.subscriptionPlan || 'Premium',
          cancellationDate,
          effectiveEndDate
        }))
      }
    }

    // 5. Checkout Expired (Gatilho de Recuperação de Carrinho - CRO)
    if (stripeEvent.type === 'checkout.session.expired') {
      const userEmail = session.customer_details?.email || session.customer_email
      const userId = session.metadata?.userId
      const tier = session.metadata?.tier
      const checkoutUrl = session.url

      console.log('[Recuperação de Carrinho] Webhook expirado recebido para CRO:', {
        email: userEmail,
        userId,
        tier,
        checkoutUrl
      })

      if (userEmail && checkoutUrl) {
        await runNonBlocking(
          QueueService.publish('SEND_EMAIL_CART_RECOVERY', {
            userEmail,
            checkoutUrl
          })
            .then(() => {
              console.log(`[Recuperação de Carrinho] Email enfileirado para ${userEmail} (Produto: ${tier || 'créditos'})`)
            })
            .catch((emailErr) => {
              console.error('[Recuperação de Carrinho] Falha ao enfileirar email:', emailErr.message)
            })
        )
      }
    }

  } catch (dbErr: any) {
    console.error('Webhook handler error:', {
      eventId: stripeEvent.id,
      eventType: stripeEvent.type,
      message: dbErr.message
    })
    try { await StripeEvent.deleteOne({ eventId: stripeEvent.id }) } catch {}
    throw createError({ statusCode: 500, statusMessage: 'Webhook processing failed' })
  }

  return { received: true }
})
