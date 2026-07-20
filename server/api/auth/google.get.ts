import { ProfileService } from '../../services/ProfileService'

export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user }) {
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
