import { GoogleService, GOOGLE_SCOPES } from '../../../services/GoogleService'
import { getCookieDomain } from '../../../utils/cookie-domain'
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

  // Salvar state no cookie temporário (com domain correto para evitar mismatch entre subdomínios)
  setCookie(event, 'google_auth_state', state, {
    maxAge: 60 * 10, // 10 minutos
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: getCookieDomain(config.public.siteUrl)
  })

  // ?feature=drive | calendar — permite conectar cada integração separadamente
  // (Drive é obrigatório pro fluxo de PDF, Calendar é opcional). Sem o param,
  // pede os dois de uma vez (compatibilidade com o botão único antigo).
  const { feature } = getQuery(event)
  const scope: string[] = [GOOGLE_SCOPES.EMAIL]
  if (feature === 'drive') {
    scope.push(GOOGLE_SCOPES.DRIVE)
  } else if (feature === 'calendar') {
    scope.push(GOOGLE_SCOPES.CALENDAR)
  } else {
    scope.push(GOOGLE_SCOPES.CALENDAR, GOOGLE_SCOPES.DRIVE)
  }

  const oauth2Client = GoogleService.getAuthClient({}, event)
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true, // autorização incremental: acumula com escopos já concedidos antes
    state,
    scope
  })

  return sendRedirect(event, url)
})
