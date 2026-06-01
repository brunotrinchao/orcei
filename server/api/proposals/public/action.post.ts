import { timingSafeEqual } from 'node:crypto'
import { ProposalService } from '../../../services/ProposalService'
import { Proposal } from '../../../models/Proposal'
import { checkRateLimit } from '../../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  checkRateLimit(event, { max: 10, windowMs: 60 * 1000, keyPrefix: 'public-proposal-action' })

  const body = await readBody(event)
  const { slug, token, action, notes } = body

  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing Slug' })
  if (!token) throw createError({ statusCode: 400, statusMessage: 'Missing Token' })

  // Validate token before mutating — timingSafeEqual previne timing attack
  const proposal = await Proposal.findOne({ slug }).lean()
  if (!proposal) throw createError({ statusCode: 404, statusMessage: 'Proposal not found' })
  const proposalToken = (proposal as any).token
  if (!proposalToken || !timingSafeEqual(Buffer.from(String(proposalToken)), Buffer.from(String(token)))) {
    throw createError({ statusCode: 403, statusMessage: 'Token inválido' })
  }

  if (action === 'decline') {
    return await ProposalService.declineProposal(slug)
  }

  if (action === 'request_changes') {
    return await ProposalService.requestChanges(slug, notes)
  }

  throw createError({ statusCode: 400, statusMessage: 'Invalid Action' })
})
