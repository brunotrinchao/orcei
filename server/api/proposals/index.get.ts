import { ProfileService } from '../../services/ProfileService'
import { Proposal } from '../../models/Proposal'
import { ProposalMessage } from '../../models/ProposalMessage'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404 })

  const { page = 1, limit = 10, search = '' } = getQuery(event)

  const query: any = { profileId: profile._id }
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { 'client.name': { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } }
    ]
  }

  const [items, total] = await Promise.all([
    Proposal.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean(),
    Proposal.countDocuments(query)
  ])

  // Injetar status de mensagens de forma eficiente
  const proposalsWithMessages = await Promise.all(items.map(async (p: any) => {
    const hasMessages = await ProposalMessage.exists({ proposalId: p._id })
    return { ...p, hasMessages: !!hasMessages }
  }))

  return {
    items: proposalsWithMessages,
    total,
    page: Number(page),
    limit: Number(limit)
  }
})
