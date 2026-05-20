import { Proposal } from '../../../../models/Proposal'
import { ProposalMessage } from '../../../../models/ProposalMessage'
import { ProposalService } from '../../../../services/ProposalService'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const { t: token } = getQuery(event)
  const body = await readBody(event)

  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing Slug' })
  if (!body.text) throw createError({ statusCode: 400, statusMessage: 'Missing Message Text' })

  const proposal = await Proposal.findOne({ slug })
  if (!proposal) throw createError({ statusCode: 404, statusMessage: 'Proposal not found' })

  // Security check
  if (proposal.token && proposal.token !== token) {
    throw createError({ statusCode: 403, statusMessage: 'Token inválido' })
  }

  const message = await ProposalMessage.create({
    proposalId: proposal._id,
    profileId: proposal.profileId,
    sender: 'client',
    text: body.text
  })

  // Update proposal status to PENDING (viewed/changes requested) if it's not accepted/expired
  if (!['accepted', 'expired'].includes(proposal.status)) {
    await ProposalService.updateStatus(slug, 'pending')
    await ProposalService.logHistory(proposal._id, 'pending', 'system', { notes: body.text })
  }

  return message
})
