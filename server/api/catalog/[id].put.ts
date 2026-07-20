import { ProfileService } from '../../services/ProfileService'
import { CatalogService } from '../../services/CatalogService'
import { validateCatalogItem, throwIfInvalid } from '../../utils/validate'

export default defineEventHandler(async (event) => {
  const sessionPromise = getUserSession(event)
  const bodyPromise = readBody(event)

  const session = await sessionPromise
  if (!session?.user) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')
  const body = await bodyPromise

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404 })

  throwIfInvalid(validateCatalogItem(body))

  const item = await CatalogService.update(id!, profile._id.toString(), body)
  if (!item) throw createError({ statusCode: 404, statusMessage: 'Item não encontrado ou sem permissão' })

  return item
})
