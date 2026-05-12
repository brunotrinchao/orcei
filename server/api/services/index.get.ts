import { ProfileService } from '../../services/ProfileService'
import { ServiceService } from '../../services/ServiceService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404 })

  return await ServiceService.listByProfile(profile._id as any)
})
