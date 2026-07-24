import { ProfileService } from '../../services/ProfileService'
import { NotificationService } from '../../services/NotificationService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })

  const unreadCount = await NotificationService.getUnreadCount(profile._id.toString())

  return { unreadCount }
})
