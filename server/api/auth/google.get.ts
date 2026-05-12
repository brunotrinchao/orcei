import { ProfileService } from '../../services/ProfileService'

export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user }) {
    // Vincular/Criar perfil no MongoDB
    await ProfileService.createForUser({
      id: user.id || user.sub,
      name: user.name,
      email: user.email
    })

    await setUserSession(event, {
      user: {
        id: user.id || user.sub,
        name: user.name,
        email: user.email
      }
    })
    return sendRedirect(event, '/dashboard')
  },
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/')
  },
})
