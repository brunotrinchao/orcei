import { ProfileService } from '../../services/ProfileService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile || !profile.stripeCustomerId) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'Nenhum cadastro de faturamento encontrado.' 
    })
  }

  const stripe = useStripe()
  
  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripeCustomerId,
      return_url: `${process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/billing?portal=true`,
    })

    return { url: portalSession.url }
  } catch (error: any) {
    console.error('Stripe Portal Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erro ao abrir portal de faturamento'
    })
  }
})
