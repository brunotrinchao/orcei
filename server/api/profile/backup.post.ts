import { Profile } from '../../models/Profile'
import { QueueService } from '../../services/QueueService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  const profile = await Profile.findOne({ userId: (session.user as any).id })
  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })
  }

  try {
    await QueueService.publish('GENERATE_BACKUP_CSV', { profileId: profile._id })
    return { success: true, message: 'Backup está sendo gerado e será enviado para o seu e-mail em instantes.' }
  } catch (e: any) {
    console.error('Backup Queue Error:', e)
    throw createError({ statusCode: 500, statusMessage: 'Erro ao agendar backup' })
  }
})
