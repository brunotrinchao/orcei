import { ProposalService } from '../../../services/ProposalService'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { slug, action, notes } = body

  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing Slug' })

  if (action === 'decline') {
    return await ProposalService.declineProposal(slug)
  }

  if (action === 'request_changes') {
    return await ProposalService.requestChanges(slug, notes)
  }

  throw createError({ statusCode: 400, statusMessage: 'Invalid Action' })
})
