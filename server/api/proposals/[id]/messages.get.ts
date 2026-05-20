import { ProposalMessage } from '../../../models/ProposalMessage'
import { Proposal } from '../../../models/Proposal'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const id = getRouterParam(event, 'id')
  const profileId = (session.user as any).id

  // Verify ownership
  const proposal = await Proposal.findOne({ _id: id, profileId })
  if (!proposal) throw createError({ statusCode: 404, statusMessage: 'Proposal not found' })

  const messages = await ProposalMessage.find({ proposalId: id }).sort({ createdAt: 1 })
  
  return messages
})
