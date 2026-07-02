import { Report } from '../../models/Report'
import { ProfileService } from '../../services/ProfileService'
import { sanitizeError } from '../../utils/error-handler'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })
  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404 })
  const id = getRouterParam(event, 'id')
  try {
    const deleted = await Report.findOneAndDelete({ _id: id, profileId: profile._id })
    if (!deleted) throw createError({ statusCode: 404, statusMessage: 'Relatório não encontrado' })
    return { success: true }
  } catch (e: any) {
    if (e.statusCode) throw e
    throw sanitizeError(e, 'Erro ao excluir relatório')
  }
})
