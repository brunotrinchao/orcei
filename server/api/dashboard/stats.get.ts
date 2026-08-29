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

  // Catálogo NÃO é escopado por período: é um acervo acumulado, não um fluxo temporal como propostas.
  // Escopar por período causava adoção de IA falseada (ex: 100% quando só o item do dia entra no filtro).
  const catalogQuery: any = { profileId: profile._id }

  const [proposals, itemsCount, reportCount] = await Promise.all([
    Proposal.find(query),
    CatalogItem.countDocuments(catalogQuery),
    Report.countDocuments({ profileId: profile._id, date: { $gte: startOfToday } })
  ])

  const proposalsCount = proposals.length
  const acceptedProposals = proposals.filter(p => p.status === 'accepted')
  const acceptedCount = acceptedProposals.length
  
  const activeStatuses = new Set(['pending', 'created', 'sent', 'delivered', 'viewed', 'opened', 'clicked', 'changes_requested'])
  const pendingCount = proposals.filter(p => activeStatuses.has(p.status)).length
  const expiredCount = proposals.filter(p => ['expired', 'declined'].includes(p.status)).length
  const otherCount = proposalsCount - acceptedCount - pendingCount - expiredCount

  const totalRevenue = Math.max(0, acceptedProposals.reduce((acc, p) => acc + Math.max(0, p.totals?.final || 0), 0))
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
  const aiCatalogCount = await CatalogItem.countDocuments({ ...catalogQuery, aiAssisted: true })

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

  // Buscar todas as propostas do usuário para capturar trackingViews e follow-ups de qualquer período
  const allUserProposals = await Proposal.find({ profileId: profile._id })

  const trackingViews = allUserProposals.reduce((acc: any[], p: any) => {
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
  // Propostas ativas que aguardam resposta do cliente (criadas, enviadas, visualizadas ou em revisão)
  const followUpAlerts = allUserProposals
    .filter(p => activeStatuses.has(p.status))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .slice(0, 3)
    .map(p => {
      const daysAgo = Math.floor((Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      return {
        id: p._id,
        code: p.code,
        title: p.title,
        clientName: p.client?.name,
        clientPhone: p.client?.phone,
        daysAgo,
        slug: p.slug,
        token: p.token,
      }
    })

  // 6. Revenue History com agrupamento por granularidade:
  // - 7D ou 30D: por dia (ex: 29/08)
  // - 90D ou ano: por mês (ex: Ago/26)
  // - total (all): por ano (ex: 2026)
  const periodParam = ((getQuery(event).period as string) || 'last_30_days')
  const isByDay = periodParam === 'last_7_days' || periodParam === 'last_30_days'
  const isByMonth = periodParam === 'last_90_days' || periodParam === 'year'
  const isByYear = periodParam === 'all'

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  let revenueHistory: { date: string; amount: number }[] = []

  if (isByDay) {
    const map: Record<string, number> = {}
    const startDate = start ? new Date(start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const endDate = end ? new Date(end as string) : new Date()

    const current = new Date(startDate)
    current.setHours(0, 0, 0, 0)
    const endMidnight = new Date(endDate)
    endMidnight.setHours(23, 59, 59, 999)

    while (current <= endMidnight) {
      const dayKey = `${String(current.getDate()).padStart(2, '0')}/${String(current.getMonth() + 1).padStart(2, '0')}`
      map[dayKey] = 0
      current.setDate(current.getDate() + 1)
    }

    acceptedProposals.forEach(p => {
      const d = new Date(p.createdAt)
      const dayKey = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
      const val = Math.max(0, p.totals?.final || 0)
      if (map[dayKey] !== undefined) {
        map[dayKey] += val
      } else {
        map[dayKey] = val
      }
    })

    revenueHistory = Object.entries(map).map(([date, amount]) => ({ date, amount: Math.max(0, amount) }))
  } else if (isByMonth) {
    const map: Record<string, { label: string; amount: number; sortKey: string }> = {}

    if (periodParam === 'last_90_days') {
      const now = new Date()
      for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const label = `${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`
        map[sortKey] = { label, amount: 0, sortKey }
      }
    } else if (periodParam === 'year') {
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth()
      for (let m = 0; m <= currentMonth; m++) {
        const sortKey = `${currentYear}-${String(m + 1).padStart(2, '0')}`
        const label = `${monthNames[m]}/${String(currentYear).slice(2)}`
        map[sortKey] = { label, amount: 0, sortKey }
      }
    }

    acceptedProposals.forEach(p => {
      const d = new Date(p.createdAt)
      const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = `${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`
      const val = Math.max(0, p.totals?.final || 0)
      if (!map[sortKey]) {
        map[sortKey] = { label, amount: 0, sortKey }
      }
      map[sortKey].amount += val
    })

    revenueHistory = Object.values(map)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(item => ({ date: item.label, amount: Math.max(0, item.amount) }))
  } else if (isByYear) {
    const map: Record<string, number> = {}

    acceptedProposals.forEach(p => {
      const year = String(new Date(p.createdAt).getFullYear())
      const val = Math.max(0, p.totals?.final || 0)
      map[year] = (map[year] || 0) + val
    })

    revenueHistory = Object.entries(map)
      .sort(([yearA], [yearB]) => yearA.localeCompare(yearB))
      .map(([date, amount]) => ({ date, amount: Math.max(0, amount) }))
  } else {
    const map: Record<string, number> = {}
    acceptedProposals.forEach(p => {
      const date = new Date(p.createdAt).toLocaleDateString('pt-BR')
      const val = Math.max(0, p.totals?.final || 0)
      map[date] = (map[date] || 0) + val
    })
    revenueHistory = Object.entries(map).map(([date, amount]) => ({ date, amount: Math.max(0, amount) }))
  }

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
    draftCount: 0,
    expiredCount,
    otherCount,
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
