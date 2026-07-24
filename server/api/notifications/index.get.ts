import { ProfileService } from '../../services/ProfileService'
import { NotificationService } from '../../services/NotificationService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })

  const query = getQuery(event)
  const unreadOnly = query.unread === 'true' || query.unread === true
  const limit = query.limit ? parseInt(query.limit as string) : 50
  const skip = query.skip ? parseInt(query.skip as string) : 0

  const result = await NotificationService.getNotifications(profile._id.toString(), {
    unreadOnly,
    limit,
    skip
  })

  return result
})
