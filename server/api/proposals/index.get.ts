import { ProfileService } from '../../services/ProfileService'
import { ProposalService } from '../../services/ProposalService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'Profile not found' })

  return await ProposalService.listByProfile(profile._id as any)
})
