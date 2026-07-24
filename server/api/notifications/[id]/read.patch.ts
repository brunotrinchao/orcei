import { ProfileService } from '../../../services/ProfileService'
import { NotificationService } from '../../../services/NotificationService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID da notificação é obrigatório' })

  const result = await NotificationService.markAsRead(profile._id.toString(), id)

  return result
})
