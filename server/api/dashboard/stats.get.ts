import { ProfileService } from '../../services/ProfileService'
import { Proposal } from '../../models/Proposal'
import { Service } from '../../models/Service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404 })

  const [proposalsCount, servicesCount] = await Promise.all([
    Proposal.countDocuments({ profileId: profile._id }),
    Service.countDocuments({ profileId: profile._id })
  ])

  return {
    proposalsCount,
    servicesCount
  }
})
