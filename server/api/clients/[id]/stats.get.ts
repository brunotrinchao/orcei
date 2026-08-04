import { ProfileService } from '../../../services/ProfileService'
import { Client } from '../../../models/Client'
import { Proposal } from '../../../models/Proposal'
import { ProposalStatus } from '../../../../types/enums'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })

  const clientId = getRouterParam(event, 'id')
  if (!clientId) throw createError({ statusCode: 400, statusMessage: 'ID do cliente inválido' })

  const client = await Client.findOne({ _id: clientId, profileId: profile._id })
  if (!client) throw createError({ statusCode: 404, statusMessage: 'Cliente não encontrado' })

  // Filtro flexível: por email (se existente) ou nome do cliente
  const clientFilter: any[] = []
  if (client.email?.trim()) {
    clientFilter.push({ 'client.email': client.email.trim() })
  }
  if (client.name?.trim()) {
    clientFilter.push({ 'client.name': client.name.trim() })
  }

  const proposalQuery = {
    profileId: profile._id,
    $or: clientFilter.length > 0 ? clientFilter : [{ 'client.name': client.name }]
  }

  const proposals = await Proposal.find(proposalQuery).sort({ createdAt: -1 }).lean()

  let totalProposals = proposals.length
  let acceptedCount = 0
  let acceptedTotalValue = 0
  let expiredCount = 0
  let expiredTotalValue = 0
  let pendingCount = 0
  let pendingTotalValue = 0
  let draftCount = 0

  const pendingStatuses = [
    ProposalStatus.CREATED,
    ProposalStatus.SENT,
    ProposalStatus.VIEWED,
    ProposalStatus.PENDING,
    ProposalStatus.DELIVERED,
    ProposalStatus.OPENED,
    ProposalStatus.CLICKED
  ]

  proposals.forEach((p: any) => {
    const val = p.totals?.final || 0
    if (p.status === ProposalStatus.ACCEPTED) {
      acceptedCount++
      acceptedTotalValue += val
    } else if (p.status === ProposalStatus.EXPIRED) {
      expiredCount++
      expiredTotalValue += val
    } else if (p.status === ProposalStatus.DRAFT) {
      draftCount++
    } else if (pendingStatuses.includes(p.status as ProposalStatus)) {
      pendingCount++
      pendingTotalValue += val
    }
  })

  const conversionRate = totalProposals > 0 ? Math.round((acceptedCount / totalProposals) * 100) : 0
  const avgTicket = acceptedCount > 0 ? acceptedTotalValue / acceptedCount : 0

  return {
    client,
    stats: {
      totalProposals,
      acceptedCount,
      acceptedTotalValue,
      expiredCount,
      expiredTotalValue,
      pendingCount,
      pendingTotalValue,
      draftCount,
      conversionRate,
      avgTicket
    },
    recentProposals: proposals.slice(0, 5).map((p: any) => ({
      _id: p._id,
      title: p.title,
      code: p.code,
      sequenceNumber: p.sequenceNumber,
      status: p.status,
      total: p.totals?.final || 0,
      createdAt: p.createdAt
    }))
  }
})
