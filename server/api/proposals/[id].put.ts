import { ProfileService } from '../../services/ProfileService'
import { ProposalService } from '../../services/ProposalService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404 })

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const proposal = await ProposalService.update(id!, profile._id as any, body)
  if (!proposal) {
    throw createError({ 
      statusCode: 404, 
      statusMessage: 'Proposal not found or already accepted' 
    })
  }

  return proposal
})
