import { GoogleService } from '../../../services/GoogleService'
import { Profile } from '../../../models/Profile'
import { google } from 'googleapis'

export default defineEventHandler(async (event) => {
  const { code } = getQuery(event)
  const session = await getUserSession(event)
  
  if (!session?.user || !code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing code or session'
    })
  }

  try {
    const oauth2Client = GoogleService.getAuthClient({})
    const { tokens } = await oauth2Client.getToken(code as string)
    
    oauth2Client.setCredentials(tokens)
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const userInfo = await oauth2.userinfo.get()

    await Profile.findOneAndUpdate(
      { userId: (session.user as any).id },
      { 
        $set: {
          googleIntegration: {
            email: userInfo.data.email,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiryDate: tokens.expiry_date,
          }
        }
      }
    )

    return sendRedirect(event, '/dashboard/settings?google=connected')
  } catch (error: any) {
    console.error('[Google Callback] Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to authenticate with Google'
    })
  }
})
