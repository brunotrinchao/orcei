import { ProposalService } from '../../../services/ProposalService'
import { Proposal } from '../../../models/Proposal'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { slug, token, action, notes } = body

  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing Slug' })
  if (!token) throw createError({ statusCode: 400, statusMessage: 'Missing Token' })

  // Validate token before mutating
  const proposal = await Proposal.findOne({ slug }).lean()
  if (!proposal) throw createError({ statusCode: 404, statusMessage: 'Proposal not found' })
  if ((proposal as any).token !== token) throw createError({ statusCode: 403, statusMessage: 'Token inválido' })

  if (action === 'decline') {
    return await ProposalService.declineProposal(slug)
  }

  if (action === 'request_changes') {
    return await ProposalService.requestChanges(slug, notes)
  }

  throw createError({ statusCode: 400, statusMessage: 'Invalid Action' })
})
