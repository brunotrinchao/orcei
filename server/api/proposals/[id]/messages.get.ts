import { ProposalMessage } from '../../../models/ProposalMessage'
import { Proposal } from '../../../models/Proposal'
import { ProfileService } from '../../../services/ProfileService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'Profile not found' })

  const id = getRouterParam(event, 'id')
  const profileId = profile._id

  // Verify ownership
  const proposal = await Proposal.findOne({ _id: id, profileId })
  if (!proposal) throw createError({ statusCode: 404, statusMessage: 'Proposal not found' })

  const messages = await ProposalMessage.find({ proposalId: id }).sort({ createdAt: 1 })
  
  // Marcar como lidas mensagens do cliente ao profissional abrir o chat
  await ProposalMessage.updateMany(
    { proposalId: id, sender: 'client', read: false },
    { $set: { read: true } }
  )

  return messages
})
