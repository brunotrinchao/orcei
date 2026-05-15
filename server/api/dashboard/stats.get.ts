import { ProfileService } from '../../services/ProfileService'
import { Proposal } from '../../models/Proposal'
import { CatalogItem } from '../../models/CatalogItem'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404 })

  const { start, end } = getQuery(event)
  const query: any = { profileId: profile._id }

  if (start && end) {
    query.createdAt = {
      $gte: new Date(start as string),
      $lte: new Date(end as string)
    }
  }

  const [proposals, itemsCount] = await Promise.all([
    Proposal.find(query),
    CatalogItem.countDocuments({ profileId: profile._id })
  ])

  const proposalsCount = proposals.length
  const acceptedProposals = proposals.filter(p => p.status === 'accepted')
  const acceptedCount = acceptedProposals.length
  const pendingCount = proposals.filter(p => ['pending', 'created'].includes(p.status)).length
  
  const totalRevenue = acceptedProposals.reduce((acc, p) => acc + (p.totals?.final || 0), 0)
  const ticketMedia = acceptedCount > 0 ? totalRevenue / acceptedCount : 0
  const approvalRate = proposalsCount > 0 ? (acceptedCount / proposalsCount) * 100 : 0

  // Revenue History (last 30 days or period)
  const revenueHistoryMap = acceptedProposals.reduce((acc: any, p) => {
    const date = new Date(p.createdAt).toLocaleDateString('pt-BR')
    acc[date] = (acc[date] || 0) + (p.totals?.final || 0)
    return acc
  }, {})

  const revenueHistory = Object.entries(revenueHistoryMap)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => {
      const dateA = new Date(a.date.split('/').reverse().join('-')).getTime()
      const dateB = new Date(b.date.split('/').reverse().join('-')).getTime()
      return dateA - dateB
    })

  // Status Distribution
  const statusDistribution = proposals.reduce((acc: any, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {})

  // Client Ranking (Top 5 by Revenue)
  const clientRevenueMap = acceptedProposals.reduce((acc: any, p) => {
    const clientName = p.client?.name || 'Cliente Desconhecido'
    acc[clientName] = (acc[clientName] || 0) + (p.totals?.final || 0)
    return acc
  }, {})

  const clientRanking = Object.entries(clientRevenueMap)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 5)

  return {
    proposalsCount,
    servicesCount: itemsCount,
    acceptedCount,
    pendingCount,
    totalRevenue,
    ticketMedia,
    approvalRate,
    revenueHistory,
    statusDistribution,
    clientRanking
  }
})
