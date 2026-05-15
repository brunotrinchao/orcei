import { ProfileService } from '../../services/ProfileService'
import { EventService } from '../../services/EventService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'Profile not found' })

  const id = getRouterParam(event, 'id')
  
  return await EventService.delete(id!, profile._id.toString())
})
