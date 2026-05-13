import { ProposalService } from '../../../services/ProposalService'
import { processVariables } from '../../../utils/variables'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing Slug' })

  const proposal = await ProposalService.getBySlug(slug)
  if (!proposal) throw createError({ statusCode: 404, statusMessage: 'Proposal not found' })

  const profile = (proposal as any).profileId
  if (profile) {
    proposal.contractText = processVariables(proposal.contractText || '', proposal as any, profile as any)
    proposal.termsAndConditions = processVariables(proposal.termsAndConditions || '', proposal as any, profile as any)
  }

  return proposal
})
