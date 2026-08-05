import { ProfileService } from '../../services/ProfileService'
import { Proposal } from '../../models/Proposal'
import { ProposalMessage } from '../../models/ProposalMessage'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404 })

  const queryParams = getQuery(event)
  const page = Number(queryParams.page || 1)
  const limit = Number(queryParams.limit || 10)
  const search = String(queryParams.search || '')
  const status = String(queryParams.status || '')
  const startDate = String(queryParams.startDate || '')
  const endDate = String(queryParams.endDate || '')
  const pendingChat = queryParams.pendingChat === 'true'

  const escapeRegex = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const query: any = { profileId: profile._id }

  if (search) {
    const safeSearch = escapeRegex(search)
    query.$or = [
      { title: { $regex: safeSearch, $options: 'i' } },
      { 'client.name': { $regex: safeSearch, $options: 'i' } },
      { 'client.email': { $regex: safeSearch, $options: 'i' } },
      { code: { $regex: safeSearch, $options: 'i' } }
    ]
  }

  if (status && status !== '__EMPTY__') {
    query.status = status
  }

  const dateQuery: any = {}
  if (startDate) {
    const d = new Date(startDate)
    if (!isNaN(d.getTime())) dateQuery.$gte = d
  }
  if (endDate) {
    const d = new Date(endDate)
    if (!isNaN(d.getTime())) dateQuery.$lte = d
  }
  if (Object.keys(dateQuery).length > 0) {
    query.createdAt = dateQuery
  }

  if (pendingChat) {
    const unreadProposalIds = await ProposalMessage.distinct('proposalId', {
      profileId: profile._id,
      sender: 'client',
      read: false
    })
    query._id = { $in: unreadProposalIds }
  }

  const [items, total] = await Promise.all([
    Proposal.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Proposal.countDocuments(query)
  ])

  // Injetar status de mensagens de forma eficiente
  const proposalsWithMessages = await Promise.all(items.map(async (p: any) => {
    const [hasMessages, unreadCount] = await Promise.all([
      ProposalMessage.exists({ proposalId: p._id }),
      ProposalMessage.countDocuments({ proposalId: p._id, sender: 'client', read: false })
    ])
    return { ...p, hasMessages: !!hasMessages, unreadMessages: unreadCount }
  }))

  return {
    items: proposalsWithMessages,
    total,
    page,
    limit
  }
})
