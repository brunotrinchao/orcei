import { ProposalService } from '../../../services/ProposalService'
import { processVariables } from '../../../utils/variables'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const { t: token, preview } = getQuery(event)
  const isPreview = preview === 'true'

  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing Slug' })

  const proposal = await ProposalService.getBySlug(slug)
  if (!proposal) throw createError({ statusCode: 404, statusMessage: 'Proposal not found' })

  // Validar Token (Segurança) — preview interno não exige token
  if (!isPreview && proposal.token && proposal.token !== token) {
    throw createError({ statusCode: 403, statusMessage: 'Acesso Negado: Token Inválido ou Expirado' })
  }

  const profile = (proposal as any).profileId
  if (profile) {
    proposal.contractText = processVariables(proposal.contractText || '', proposal as any, profile as any)
    proposal.termsAndConditions = processVariables(proposal.termsAndConditions || '', proposal as any, profile as any)
  }

  return proposal
})
