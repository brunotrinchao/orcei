import { Profile } from '../../models/Profile'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  const profile = await Profile.findOne({ email }).select('+password')
  if (!profile || profile.password !== password) { // Simplificado sem bcrypt por agora
    throw createError({ statusCode: 401, statusMessage: 'Credenciais inválidas' })
  }

  await setUserSession(event, {
    user: {
      id: profile.userId,
      name: profile.name,
      email: profile.email
    }
  })

  return { success: true }
})
