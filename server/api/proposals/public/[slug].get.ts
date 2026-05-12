import { ProposalService } from '../../../services/ProposalService'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing Slug' })

  const proposal = await ProposalService.getBySlug(slug)
  if (!proposal) throw createError({ statusCode: 404, statusMessage: 'Proposal not found' })

  return proposal
})
