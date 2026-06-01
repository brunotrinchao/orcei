import { timingSafeEqual } from 'node:crypto'
import { Proposal } from '../../../models/Proposal'
import { ProposalMessage } from '../../../models/ProposalMessage'
import { checkRateLimit } from '../../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  checkRateLimit(event, { max: 60, windowMs: 60 * 1000, keyPrefix: 'public-proposal-msgs' })

  const { slug, t: token } = getQuery(event)

  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing Slug' })

  const proposal = await Proposal.findOne({ slug }).lean()
  if (!proposal) throw createError({ statusCode: 404, statusMessage: 'Proposal not found' })

  // Security check: timingSafeEqual previne timing attack
  if (proposal.token) {
    if (!token || !timingSafeEqual(Buffer.from(String(proposal.token)), Buffer.from(String(token)))) {
      throw createError({ statusCode: 403, statusMessage: 'Token inválido' })
    }
  }

  const messages = await ProposalMessage.find({ proposalId: proposal._id }).sort({ createdAt: 1 })

  return messages
})
