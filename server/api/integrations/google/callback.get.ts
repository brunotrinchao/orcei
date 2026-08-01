import { GoogleService } from '../../../services/GoogleService'
import { Profile } from '../../../models/Profile'
import { getCookieDomain } from '../../../utils/cookie-domain'
import { google } from 'googleapis'

// Este callback roda dentro de uma janela popup (ver app/composables/useGoogleConnect.ts).
// Em vez de redirecionar, ele fecha a própria janela e avisa o app principal.
//
// IMPORTANTE: accounts.google.com aplica Cross-Origin-Opener-Policy: same-origin
// nas próprias páginas — isso faz o navegador desligar a referência
// `window.opener` assim que o popup navega pro domínio do Google, e ela NÃO
// volta mesmo quando o popup retorna pro nosso domínio no final do fluxo.
// Por isso usamos BroadcastChannel como canal principal (não depende de
// referência de window, só de mesma origem) — postMessage via window.opener
// fica só como tentativa best-effort, sem depender dele.
function popupClose(event: any, status: 'connected' | 'error' | 'cancelled') {
  setResponseHeader(event, 'Content-Type', 'text/html')
  return `<!DOCTYPE html><html><body><script>
    (function () {
      var payload = { source: 'google-connect', status: '${status}' }
      try {
        var channel = new BroadcastChannel('google-connect')
        channel.postMessage(payload)
        channel.close()
      } catch (e) {}
      if (window.opener) {
        try { window.opener.postMessage(payload, window.location.origin) } catch (e) {}
      }
      window.close()
    })()
  </script></body></html>`
}

export default defineEventHandler(async (event) => {
  const { code, state, error: oauthError } = getQuery(event)
  const session = await getUserSession(event)

  const config = useRuntimeConfig()
  const savedState = getCookie(event, 'google_auth_state')
  deleteCookie(event, 'google_auth_state', { domain: getCookieDomain(config.public.siteUrl) })

  if (!session?.user) {
    console.error('[Google Callback] Sessão expirada ou inválida.')
    return popupClose(event, 'error')
  }

  // Usuário clicou em "Cancelar" na tela de consentimento do Google —
  // não é uma falha real, é uma escolha do usuário.
  if (oauthError) {
    return popupClose(event, 'cancelled')
  }

  // SEGURANÇA: Validar state para prevenir CSRF
  if (!state || state !== savedState) {
    console.error('[Google Callback] Falha na validação de segurança (CSRF State mismatch).')
    return popupClose(event, 'error')
  }

  if (!code) {
    console.error('[Google Callback] Código de autorização do Google não recebido.')
    return popupClose(event, 'error')
  }

  try {
    const oauth2Client = GoogleService.getAuthClient({}, event)
    const { tokens } = await oauth2Client.getToken(code as string)

    oauth2Client.setCredentials(tokens)
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const userInfo = await oauth2.userinfo.get()

    const existingProfile = await Profile.findOne({ userId: (session.user as any).id })
    const existingIntegration = existingProfile?.googleIntegration || {}

    // Com include_granted_scopes=true, tokens.scope reflete o total acumulado de
    // escopos concedidos (não só o que foi pedido nesta chamada) — por isso é
    // seguro sobrescrever grantedScopes em vez de só unir com o que já existia.
    const grantedScopes = tokens.scope ? tokens.scope.split(' ').filter(Boolean) : (existingIntegration.grantedScopes || [])

    // O Google só envia refresh_token na primeira autorização ou se prompt=consent.
    // Se recebemos um novo, atualizamos. Se não, mantemos o que já está no banco.
    const googleIntegration = {
      ...existingIntegration,
      email: userInfo.data.email,
      accessToken: tokens.access_token,
      expiryDate: tokens.expiry_date,
      refreshToken: tokens.refresh_token || existingIntegration.refreshToken,
      grantedScopes
    }

    // Substitui o objeto inteiro (não dot-notation) — evita erro do Mongo
    // "Cannot create field X in element {googleIntegration: null}" quando
    // googleIntegration estava null (ex: após desconectar).
    await Profile.findOneAndUpdate(
      { userId: (session.user as any).id },
      { $set: { googleIntegration } }
    )

    return popupClose(event, 'connected')
  } catch (error: any) {
    console.error('[Google Callback] Error:', error)
    return popupClose(event, 'error')
  }
})
