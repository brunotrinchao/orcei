import { Profile } from '../../models/Profile'
import { Proposal } from '../../models/Proposal'
import { useStripe } from '../../utils/stripe'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user || (session.user as any).role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado' })
  }

  const stripe = useStripe()
  const config = useRuntimeConfig()

  try {
    // 1. Métricas do Stripe
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60)
    const [invoices, activeSubscriptions] = await Promise.all([
      stripe.invoices.list({ created: { gte: thirtyDaysAgo }, limit: 100 }),
      stripe.subscriptions.list({ status: 'active', limit: 100 })
    ])

    const revenueBreakdown = {
      annual: 0,
      monthly: 0,
      credits: 0
    }

    invoices.data.forEach(inv => {
      if (!inv.paid) return
      const amount = inv.total / 100
      
      const lineItem = inv.lines.data[0]
      const priceId = lineItem?.price?.id
      const p = config.public

      if (priceId === p.stripePriceAnnual) {
        revenueBreakdown.annual += amount
      } else if (priceId === p.stripePriceMonthly || priceId === p.stripeStarterPriceId || priceId === p.stripePremiumPriceId) {
        revenueBreakdown.monthly += amount
      } else {
        revenueBreakdown.credits += amount
      }
    })

    const totalRevenueCents = invoices.data.reduce((acc, inv) => acc + (inv.paid ? inv.total : 0), 0)

    // Forecast: Current MRR (Monthly Recurring Revenue)
    let mrr = 0
    activeSubscriptions.data.forEach(sub => {
      const item = sub.items.data[0]
      const amount = (item.plan.amount || 0) / 100
      if (item.plan.interval === 'year') {
        mrr += amount / 12
      } else {
        mrr += amount
      }
    })

    const forecast = Array.from({ length: 6 }).map((_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() + i + 1)
      return {
        month: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        projected: Math.round(mrr * (1 + (i * 0.03))) // 3% projected growth
      }
    })
    
    // 2. Métricas do MongoDB
    const [totalUsers, newUsersMonth, totalProposals, acceptedProposals] = await Promise.all([
      Profile.countDocuments({ isDeleted: { $ne: true } }),
      Profile.countDocuments({ 
        isDeleted: { $ne: true },
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
      }),
      Proposal.countDocuments({}),
      Proposal.countDocuments({ status: 'accepted' })
    ])

    return {
      revenue: {
        total: totalRevenueCents / 100,
        breakdown: revenueBreakdown,
        mrr: Math.round(mrr),
        forecast,
        currency: 'BRL',
        period: 'Last 30 days'
      },
      users: {
        total: totalUsers,
        newMonth: newUsersMonth
      },
      proposals: {
        total: totalProposals,
        accepted: acceptedProposals,
        conversionRate: totalProposals > 0 ? (acceptedProposals / totalProposals) * 100 : 0
      },
      stripe: {
        activeSubs: activeSubscriptions.data.length
      }
    }
  } catch (e: any) {
    console.error('Admin Stats Error:', e)
    throw createError({ statusCode: 500, statusMessage: 'Erro ao buscar estatísticas' })
  }
})
