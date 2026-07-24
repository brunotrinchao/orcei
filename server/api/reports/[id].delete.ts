import { Report } from '../../models/Report'
import { ProfileService } from '../../services/ProfileService'
import { sanitizeError } from '../../utils/error-handler'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })

  const id = getRouterParam(event, 'id') || (event.context.params as any)?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID do relatório não informado' })
  }

  try {
    const deleted = await Report.findOneAndDelete({ _id: id, profileId: profile._id })
    if (!deleted) {
      const exists = await Report.findById(id)
      if (!exists) {
        // Já havia sido excluído (ex: duplo clique ou fechamento simultâneo do modal)
        return { success: true, message: 'Relatório já havia sido excluído' }
      }
      throw createError({ statusCode: 404, statusMessage: 'Relatório não encontrado' })
    }
    return { success: true }
  } catch (e: any) {
    if (e.statusCode) throw e
    throw sanitizeError(e, 'Erro ao excluir relatório')
  }
})
