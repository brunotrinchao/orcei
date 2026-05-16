import { ProfileService } from '../../services/ProfileService'
import { CatalogService } from '../../services/CatalogService'
import { validateCatalogItem, throwIfInvalid } from '../../utils/validate'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404 })

  const body = await readBody(event)
  throwIfInvalid(validateCatalogItem(body))

  return await CatalogService.create({ ...body, profileId: profile._id })
})
