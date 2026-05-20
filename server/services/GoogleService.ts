import { google } from 'googleapis'

export interface GoogleEventData {
  summary: string
  location?: string
  description?: string
  start: string | Date
  fileId?: string
  webViewLink?: string
  fileName?: string
}

export const GoogleService = {
  getAuthClient(profile: any) {
    const config = useRuntimeConfig()
    const oauth2Client = new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      `${config.public.siteUrl}/api/integrations/google/callback`
    )

    if (profile.googleIntegration?.refreshToken) {
      oauth2Client.setCredentials({
        access_token: profile.googleIntegration.accessToken,
        refresh_token: profile.googleIntegration.refreshToken,
        expiry_date: profile.googleIntegration.expiryDate
      })
    }

    return oauth2Client
  },

  async ensureFolder(auth: any) {
    try {
      const drive = google.drive({ version: 'v3', auth })
      const config = useRuntimeConfig()
      const folderName = config.appName || 'Orcei'
      
      const res = await drive.files.list({
        q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id)'
      })

      if (res.data.files?.length) return res.data.files[0].id

      const folder = await drive.files.create({
        requestBody: { name: folderName, mimeType: 'application/vnd.google-apps.folder' },
        fields: 'id'
      })
      return folder.data.id
    } catch (error) {
      console.error('[GoogleService] Error in ensureFolder:', error)
      throw error
    }
  },

  async uploadPdf(auth: any, folderId: string, fileName: string, buffer: Buffer) {
    try {
      const drive = google.drive({ version: 'v3', auth })
      // Using a simple buffer upload for the plan
      const res = await drive.files.create({
        requestBody: { name: fileName, parents: [folderId] },
        media: { mimeType: 'application/pdf', body: buffer },
        fields: 'id, webViewLink'
      })
      return res.data
    } catch (error) {
      console.error('[GoogleService] Error in uploadPdf:', error)
      throw error
    }
  },

  async createEvent(auth: any, data: GoogleEventData) {
    try {
      const calendar = google.calendar({ version: 'v3', auth })
      return await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: data.summary,
          location: data.location,
          description: data.description,
          start: { dateTime: new Date(data.start).toISOString() },
          end: { dateTime: new Date(new Date(data.start).getTime() + 3600000).toISOString() },
          attachments: data.fileId ? [{ fileUrl: data.webViewLink, title: data.fileName, mimeType: 'application/pdf' }] : []
        },
        supportsAttachments: true
      })
    } catch (error) {
      console.error('[GoogleService] Error in createEvent:', error)
      throw error
    }
  }
}
