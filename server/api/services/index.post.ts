import { getServerSession } from '#auth'
import { ProfileService } from '../../services/ProfileService'
import { ServiceService } from '../../services/ServiceService'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'Profile not found' })

  const body = await readBody(event)
  
  return await ServiceService.create({
    ...body,
    profileId: profile._id
  })
})
