import { ProposalService } from '../../../services/ProposalService'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { slug, paymentMethod } = body

  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing Slug' })

  const proposal = await ProposalService.acceptProposal(slug, paymentMethod || 'cash')
  if (!proposal) throw createError({ statusCode: 404, statusMessage: 'Proposal not found' })

  return { success: true, proposal }
})
