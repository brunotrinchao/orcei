import { ProfileService } from '../../services/ProfileService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile || !profile.stripeCustomerId) return []

  const stripe = useStripe()
  
  try {
    const invoices = await stripe.invoices.list({
      customer: profile.stripeCustomerId,
      limit: 20
    })

    return invoices.data.map(inv => ({
      id: inv.id,
      date: new Date(inv.created * 1000).toISOString(),
      amount: (inv.total / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      status: inv.status,
      method: (inv as any).payment_intent ? 'Cartão' : 'Outro',
      pdf: inv.invoice_pdf
    }))
  } catch (error) {
    console.error('Stripe Invoice Error:', error)
    return []
  }
})
