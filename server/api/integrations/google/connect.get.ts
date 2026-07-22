import { GoogleService } from '../../../services/GoogleService'
import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const config = useRuntimeConfig()

  // Gerar state aleatório para prevenir CSRF
  const state = crypto.randomBytes(32).toString('hex')

  // Salvar state no cookie temporário
  setCookie(event, 'google_auth_state', state, {
    maxAge: 60 * 10, // 10 minutos
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: getCookieDomain(config.public.siteUrl)
  })

  const oauth2Client = GoogleService.getAuthClient({}, event)
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    state,
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  })
  
  return sendRedirect(event, url)
})
