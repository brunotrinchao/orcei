import { ProfileService } from '../../services/ProfileService'
import { Proposal } from '../../models/Proposal'
import { CatalogItem } from '../../models/CatalogItem'
import { Report } from '../../models/Report'

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

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [proposals, itemsCount, reportCount] = await Promise.all([
    Proposal.find(query),
    CatalogItem.countDocuments({ profileId: profile._id }),
    Report.countDocuments({ profileId: profile._id, date: { $gte: startOfToday } })
  ])

  const proposalsCount = proposals.length
  const acceptedProposals = proposals.filter(p => p.status === 'accepted')
  const acceptedCount = acceptedProposals.length
  const pendingCount = proposals.filter(p => ['pending', 'created'].includes(p.status)).length
  const draftCount = proposals.filter(p => p.status === 'draft').length
  const expiredCount = proposals.filter(p => p.status === 'expired').length
  
  const totalRevenue = acceptedProposals.reduce((acc, p) => acc + (p.totals?.final || 0), 0)
  const ticketMedia = acceptedCount > 0 ? totalRevenue / acceptedCount : 0
  const approvalRate = proposalsCount > 0 ? (acceptedCount / proposalsCount) * 100 : 0

  // 1. Cálculo de TMA (Tempo Médio de Fechamento comercial em horas)
  // Utiliza a diferença entre updatedAt (aceite) e createdAt (criação/publicação)
  let totalTimeMs = 0
  let slaUnder48hCount = 0
  
  acceptedProposals.forEach(p => {
    const diffMs = Math.max(0, p.updatedAt.getTime() - p.createdAt.getTime())
    totalTimeMs += diffMs
    // SLA Comercial: Aceito em menos de 48 horas (172800000 ms)
    if (diffMs <= 48 * 60 * 60 * 1000) {
      slaUnder48hCount++
    }
  })
  
  const tmaHours = acceptedCount > 0 ? (totalTimeMs / acceptedCount) / (1000 * 60 * 60) : 0
  const slaRate = acceptedCount > 0 ? (slaUnder48hCount / acceptedCount) * 100 : 100 // Padrão 100% se não há dados

  // 2. Cálculo de FCR (First Contact Resolution comercial)
  // Propostas aceitas que NUNCA passaram pelo status 'pending' (solicitação de revisão)
  const { ProposalHistory } = await import('../../models/ProposalHistory')
  const revisions = await ProposalHistory.find({ 
    proposalId: { $in: acceptedProposals.map(p => p._id) }, 
    action: 'pending' 
  })
  const proposalsWithRevisions = new Set(revisions.map(r => r.proposalId.toString())).size
  const fcrRate = acceptedCount > 0 ? ((acceptedCount - proposalsWithRevisions) / acceptedCount) * 100 : 100

  // 3. ROI de IA (Tempo Economizado em horas)
  const aiProposalsCount = proposals.filter((p: any) => p.aiAssisted).length
  const aiCatalogCount = await CatalogItem.countDocuments({ profileId: profile._id, aiAssisted: true })

  // Cada proposta criada gera em média economia de 12 minutos manual por IA integrada
  // Cada catálogo de serviços cadastrado gera economia de 5 minutos
  const timeSavedMinutes = (aiProposalsCount * 12) + (aiCatalogCount * 5)
  const timeSavedHours = Math.floor(timeSavedMinutes / 60)
  const timeSavedRemainingMins = Math.round(timeSavedMinutes % 60)

  const aiUsage = (profile as any).aiUsage || { reports: 0, proposals: 0, catalog: 0 }

  // 4. Tracking de Abertura de Propostas
  const parseUserAgent = (ua: string) => {
    if (!ua || ua === 'unknown') return 'Dispositivo Desconhecido'
    const browser = ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : ua.includes('Safari') ? 'Safari' : ua.includes('Edge') ? 'Edge' : 'Navegador'
    const os = ua.includes('Windows') ? 'Windows' : ua.includes('Mac OS') ? 'macOS' : ua.includes('Linux') ? 'Linux' : ua.includes('Android') ? 'Android' : ua.includes('iPhone') ? 'iPhone' : 'Sistema'
    return `${browser} no ${os}`
  }

  const trackingViews = proposals.reduce((acc: any[], p: any) => {
    if (p.views && p.views.length > 0) {
      p.views.forEach((v: any) => {
        const minutesAgo = Math.floor((Date.now() - new Date(v.createdAt).getTime()) / 60000)
        acc.push({
          proposalCode: p.code,
          proposalTitle: p.title,
          clientName: p.client?.name,
          location: v.location || 'Desconhecido',
          browser: parseUserAgent(v.browser),
          date: v.createdAt,
          minutesAgo
        })
      })
    }
    return acc
  }, []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  // 5. Alertas de Follow-ups Inteligentes
  const followUpAlerts = proposals
    .filter(p => p.status === 'pending' && (Date.now() - p.createdAt.getTime()) > 3 * 24 * 60 * 60 * 1000)
    .slice(0, 3)
    .map(p => ({
      id: p._id,
      code: p.code,
      title: p.title,
      clientName: p.client?.name,
      clientPhone: p.client?.phone,
      daysAgo: Math.floor((Date.now() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    }))

  // Revenue History (últimos 30 dias ou período)
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
  const statusLabels: any = {
    draft: 'Rascunho',
    created: 'Criado',
    pending: 'Pendente',
    accepted: 'Aceito',
    expired: 'Expirado',
    sent: 'Enviado',
    delivered: 'Entregue',
    opened: 'Aberto',
    clicked: 'Clicado',
    bounced: 'Devolvido',
    viewed: 'Visualizado',
    scheduled: 'Agendado',
    received: 'Recebido',
    delayed: 'Atrasado',
    failed: 'Falha',
    suppressed: 'Suprimido'
  }

  const statusDistribution = proposals.reduce((acc: any, p) => {
    const label = statusLabels[p.status] || p.status
    acc[label] = (acc[label] || 0) + 1
    return acc
  }, {})

  // Client Ranking (Top 5 por Receita)
  const clientRevenueMap = acceptedProposals.reduce((acc: any, p) => {
    const clientName = p.client?.name || 'Cliente Desconhecido'
    acc[clientName] = (acc[clientName] || 0) + (p.totals?.final || 0)
    return acc
  }, {})

  const clientRanking = Object.entries(clientRevenueMap)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 5)

  // 6. Conversão de Opcionais (Upsell)
  // Calcula o montante de receitas gerado por upsells aceitos (flags isUpsell)
  const upsellRevenue = acceptedProposals.reduce((acc, p: any) => {
    const upsellItems = p.items?.filter((item: any) => item.isUpsell) || []
    const upsellSum = upsellItems.reduce((sum: number, item: any) => sum + ((item.price || 0) * (item.quantity || 1)), 0)
    return acc + upsellSum
  }, 0)

  return {
    // KPIs principais legados e novos
    proposalsCount,
    servicesCount: itemsCount,
    acceptedCount,
    pendingCount,
    draftCount,
    expiredCount,
    totalRevenue,
    ticketMedia,
    approvalRate,
    revenueHistory,
    statusDistribution,
    clientRanking,
    hasGeneratedReportToday: reportCount >= 1,
    
    // Novas métricas analíticas calculadas
    tmaHours,
    slaRate,
    fcrRate,
    upsellRevenue,
    
    // Estruturas de dados complexas
    aiRoi: {
      creditsUsed: profile.creditsUsed || 0,
      creditsLimit: profile.creditsBalance + (profile.creditsUsed || 0),
      timeSavedHours,
      timeSavedMinutes: timeSavedRemainingMins,
      usageStats: {
        reports: aiUsage.reports || 0,
        proposals: aiUsage.proposals || 0,
        catalog: aiUsage.catalog || 0
      },
      adoptionRates: {
        proposals: proposalsCount > 0 ? (aiProposalsCount / proposalsCount) * 100 : 0,
        catalog: itemsCount > 0 ? (aiCatalogCount / itemsCount) * 100 : 0
      }
    },
    trackingViews,
    followUpAlerts
  }
})
