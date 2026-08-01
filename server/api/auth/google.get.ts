import { ProfileService } from '../../services/ProfileService'

// Login roda dentro de uma janela popup (ver app/composables/useGoogleLogin.ts),
// não na aba principal. Em vez de redirecionar, fecha a própria janela e avisa
// o app principal via BroadcastChannel — mesmo padrão já usado no fluxo de
// integração Google (server/api/integrations/google/callback.get.ts).
function popupClose(event: any, status: 'success' | 'error') {
  setResponseHeader(event, 'Content-Type', 'text/html')
  return `<!DOCTYPE html><html><body><script>
    (function () {
      var payload = { source: 'google-login', status: '${status}' }
      try {
        var channel = new BroadcastChannel('google-login')
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

export default defineOAuthGoogleEventHandler({
  config: {
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  },
  async onSuccess(event, { user, tokens }) {
    if (!user.email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email não fornecido pela conta Google. Verifique suas configurações de privacidade.'
      })
    }

    const userData = {
      id: user.id || user.sub,
      name: user.name,
      email: user.email,
      avatar: user.picture
    }

    // Vincular/Criar perfil no MongoDB e atualizar lastLoginAt
    const profile = await ProfileService.createForUser(userData, event)
    if (profile) {
      profile.lastLoginAt = new Date()
      // Fix for legacy profiles with empty subscriptionPlan
      if (!profile.subscriptionPlan) {
        profile.subscriptionPlan = 'free'
      }

      // Login não deve gravar/sobrescrever tokens de integração (Drive/Calendar) —
      // isso é feito exclusivamente pelo fluxo dedicado em
      // /api/integrations/google/connect + callback. Só mantemos o e-mail em dia.
      profile.googleIntegration = {
        ...(profile.googleIntegration || {}),
        email: user.email
      }

      await profile.save()
    }

    await setUserSession(event, {
      user: {
        ...userData,
        role: profile.role,
        creditsBalance: profile.creditsBalance
      }
    })
    return popupClose(event, 'success')
  },
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return popupClose(event, 'error')
  },
})

