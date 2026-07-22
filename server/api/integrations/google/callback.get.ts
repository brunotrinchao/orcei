import { GoogleService } from '../../../services/GoogleService'
import { Profile } from '../../../models/Profile'
import { google } from 'googleapis'

export default defineEventHandler(async (event) => {
  const { code, state } = getQuery(event)
  const session = await getUserSession(event)

  const config = useRuntimeConfig()
  const savedState = getCookie(event, 'google_auth_state')
  deleteCookie(event, 'google_auth_state', { domain: getCookieDomain(config.public.siteUrl) })

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Sessão expirada ou inválida. Faça login novamente.'
    })
  }

  // SEGURANÇA: Validar state para prevenir CSRF
  if (!state || state !== savedState) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Falha na validação de segurança (CSRF State mismatch). Tente novamente.'
    })
  }

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Código de autorização do Google não recebido.'
    })
  }

  try {
    const oauth2Client = GoogleService.getAuthClient({}, event)
    const { tokens } = await oauth2Client.getToken(code as string)

    oauth2Client.setCredentials(tokens)
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const userInfo = await oauth2.userinfo.get()

    const existingProfile = await Profile.findOne({ userId: (session.user as any).id })
    const existingIntegration = existingProfile?.googleIntegration || {}

    // O Google só envia refresh_token na primeira autorização ou se prompt=consent.
    // Se recebemos um novo, atualizamos. Se não, mantemos o que já está no banco.
    const googleIntegration = {
      ...existingIntegration,
      email: userInfo.data.email,
      accessToken: tokens.access_token,
      expiryDate: tokens.expiry_date,
      refreshToken: tokens.refresh_token || existingIntegration.refreshToken
    }

    // Substitui o objeto inteiro (não dot-notation) — evita erro do Mongo
    // "Cannot create field X in element {googleIntegration: null}" quando
    // googleIntegration estava null (ex: após desconectar).
    await Profile.findOneAndUpdate(
      { userId: (session.user as any).id },
      { $set: { googleIntegration } }
    )

    return sendRedirect(event, '/configuracoes?google=connected')
  } catch (error: any) {
    console.error('[Google Callback] Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha na autenticação com Google'
    })
  }
})

