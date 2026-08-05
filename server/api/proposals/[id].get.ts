import { ProfileService } from '../../services/ProfileService'
import { ProposalService } from '../../services/ProposalService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404 })

  const id = getRouterParam(event, 'id')
  const proposal = await ProposalService.getById(id!, profile._id as any)
  
  if (!proposal) throw createError({ statusCode: 404 })

  const history = await ProposalService.getHistory(proposal._id as any)

  // Calcula o total de visualizações e a data da última visualização a partir do histórico
  const viewEvents = history.filter((h: any) => ['viewed', 'opened', 'clicked'].includes(h.action))
  const viewsCount = viewEvents.length
  const lastViewedAt = viewEvents.length > 0 ? viewEvents[0].timestamp : null

  return {
    ...proposal.toObject(),
    viewsCount,
    lastViewedAt,
    history
  }
})
