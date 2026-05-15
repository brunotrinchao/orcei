import { ProfileService } from '../../services/ProfileService'
import { ClientService } from '../../services/ClientService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404 })

  const body = await readBody(event)
  return await ClientService.create({ ...body, profileId: profile._id })
})
