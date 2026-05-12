import { ProfileService } from '../../services/ProfileService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userId = (session.user as any).id
  const profile = await ProfileService.getByUserId(userId)
  
  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Profile not found' })
  }

  return profile
})
