import { Profile } from '../../models/Profile'
import { hash } from 'ohash' // Nuxt auth utils usa ohash para hash simples ou @adonisjs/hash

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, email, password } = body

  if (!name || !email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Preencha todos os campos' })
  }

  const existing = await Profile.findOne({ email })
  if (existing) {
    throw createError({ statusCode: 400, statusMessage: 'E-mail já cadastrado' })
  }

  // No MVP, vamos usar o userId como o próprio email ou um nanoid
  // Mas para o nuxt-auth-utils, o ideal é criar o perfil e depois logar
  
  const profile = await Profile.create({
    userId: email, // Placeholder para auth local
    name,
    email,
    password, // O Mongoose deveria fazer o hash, mas vamos simplificar no service
    creditsBalance: 1,
    isEmailVerified: false
  })

  // Auto login após registro (opcional)
  await setUserSession(event, {
    user: {
      id: email,
      name,
      email
    }
  })

  return { success: true }
})
