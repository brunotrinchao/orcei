import { ProfileService } from '../../services/ProfileService'
import { ClientService } from '../../services/ClientService'
import { validateClient, throwIfInvalid } from '../../utils/validate'

export default defineEventHandler(async (event) => {
  const sessionPromise = getUserSession(event)
  const bodyPromise = readBody(event)

  const session = await sessionPromise
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404 })

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing client id' })

  const body = await bodyPromise
  throwIfInvalid(validateClient(body))

  return await ClientService.update(id, profile._id as any, body)
})
