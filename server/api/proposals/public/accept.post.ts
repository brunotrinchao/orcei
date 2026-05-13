import { ProposalService } from '../../../services/ProposalService'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { slug } = body

  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing Slug' })

  const proposal = await ProposalService.updateStatus(slug, 'accepted')
  if (!proposal) throw createError({ statusCode: 404, statusMessage: 'Proposal not found' })

  return { success: true, proposal }
})
