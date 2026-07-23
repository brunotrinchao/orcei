import { ProfileService } from '../../services/ProfileService'

export default defineOAuthGoogleEventHandler({
  config: {
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/drive.file'
    ],
    authorizationParams: {
      access_type: 'offline',
      prompt: 'consent'
    }
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

      // Salvar os tokens da integração Google diretamente no perfil
      if (tokens) {
        const existingIntegration = profile.googleIntegration || {}
        profile.googleIntegration = {
          ...existingIntegration,
          email: user.email,
          accessToken: tokens.access_token || existingIntegration.accessToken,
          refreshToken: tokens.refresh_token || existingIntegration.refreshToken,
          expiryDate: tokens.expires_in ? Date.now() + (tokens.expires_in * 1000) : existingIntegration.expiryDate
        }
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
    return sendRedirect(event, '/dashboard')
  },
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/')
  },
})

