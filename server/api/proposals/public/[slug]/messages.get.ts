import { Proposal } from '../../../../models/Proposal'
import { ProposalMessage } from '../../../../models/ProposalMessage'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const { t: token } = getQuery(event)

  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing Slug' })

  const proposal = await Proposal.findOne({ slug }).lean()
  if (!proposal) throw createError({ statusCode: 404, statusMessage: 'Proposal not found' })

  // Security check: token must match if provided in query
  if (proposal.token && proposal.token !== token) {
    throw createError({ statusCode: 403, statusMessage: 'Token inválido' })
  }

  const messages = await ProposalMessage.find({ proposalId: proposal._id }).sort({ createdAt: 1 })
  
  return messages
})
