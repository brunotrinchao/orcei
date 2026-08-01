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

  if (body.email?.trim() && await ClientService.emailExists(profile._id as any, body.email, id)) {
    throwIfInvalid([{ field: 'email', message: 'Já existe um cliente cadastrado com este e-mail.' }])
  }

  return await ClientService.update(id, profile._id as any, body)
})
