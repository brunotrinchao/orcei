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

  const body = await bodyPromise
  throwIfInvalid(validateClient(body))

  if (body.email?.trim() && await ClientService.emailExists(profile._id as any, body.email)) {
    throwIfInvalid([{ field: 'email', message: 'Já existe um cliente cadastrado com este e-mail.' }])
  }

  return await ClientService.create({ ...body, profileId: profile._id })
})
