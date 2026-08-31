import { ProfileService } from '../../services/ProfileService'
import { CatalogService } from '../../services/CatalogService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID do item não informado' })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })

  const deleted = await CatalogService.delete(id, profile._id.toString())
  // Garantir a idempotência do endpoint DELETE: se o item já foi excluído ou não existe mais, retornamos sucesso
  if (!deleted) {
    return { success: true, message: 'Item já não existe ou foi removido' }
  }

  return { success: true }
})
