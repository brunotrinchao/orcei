import { getServerSession } from '#auth'
import { ProfileService } from '../../services/ProfileService'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  // No @sidebase/nuxt-auth v1.x com Auth.js, o ID do usuário pode estar em session.user.id
  // Dependendo da config do session callback. 
  // Por enquanto, usaremos o email como fallback se o id não estiver disponível, 
  // mas o ideal é garantir o ID na sessão.
  
  const user = session.user as any
  const userId = user.id

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID not found in session',
    })
  }

  const profile = await ProfileService.getByUserId(userId)
  
  if (!profile) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Profile not found',
    })
  }

  return profile
})
