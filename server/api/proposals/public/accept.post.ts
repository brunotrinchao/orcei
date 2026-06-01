import { timingSafeEqual } from 'node:crypto'
import { ProposalService } from '../../../services/ProposalService'
import { Proposal } from '../../../models/Proposal'
import { checkRateLimit } from '../../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  await checkRateLimit(event, { max: 10, windowMs: 60 * 1000, keyPrefix: 'public-proposal-accept' })

  const body = await readBody(event)
  const { slug, token, paymentMethod, selectedUpsells } = body

  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing Slug' })
  if (!token) throw createError({ statusCode: 400, statusMessage: 'Missing Token' })

  // Validate token before mutating — timingSafeEqual previne timing attack
  const proposal = await Proposal.findOne({ slug }).lean()
  if (!proposal) throw createError({ statusCode: 404, statusMessage: 'Proposal not found' })
  const proposalToken = (proposal as any).token
  if (!proposalToken || !timingSafeEqual(Buffer.from(String(proposalToken)), Buffer.from(String(token)))) {
    throw createError({ statusCode: 403, statusMessage: 'Token inválido' })
  }

  const updated = await ProposalService.acceptProposal(slug, paymentMethod || 'cash', selectedUpsells)
  if (!updated) throw createError({ statusCode: 404, statusMessage: 'Proposal not found' })

  return { success: true, proposal: updated }
})
