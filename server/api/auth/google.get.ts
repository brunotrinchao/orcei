import { ProfileService } from '../../services/ProfileService'

export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user }) {
    const userData = {
      id: user.id || user.sub,
      name: user.name,
      email: user.email,
      avatar: user.picture
    }

    // Vincular/Criar perfil no MongoDB
    await ProfileService.createForUser(userData)

    await setUserSession(event, {
      user: userData
    })
    return sendRedirect(event, '/dashboard')
  },
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/')
  },
})
