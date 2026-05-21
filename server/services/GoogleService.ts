import { google } from 'googleapis'
import { Readable } from 'stream'

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

    // Add token refresh listener
    oauth2Client.on('tokens', async (tokens) => {
      try {
        const updateData: any = {}
        if (tokens.access_token) updateData['googleIntegration.accessToken'] = tokens.access_token
        if (tokens.expiry_date) updateData['googleIntegration.expiryDate'] = tokens.expiry_date
        
        if (Object.keys(updateData).length > 0) {
          const { Profile } = await import('../models/Profile')
          await Profile.findByIdAndUpdate(profile._id, { $set: updateData })
          console.log(`[GoogleService] Tokens refreshed and saved for profile: ${profile._id}`)
        }
      } catch (error) {
        console.error(`[GoogleService] Failed to save refreshed tokens for profile: ${profile._id}`, error)
      }
    })

    return oauth2Client
  },

  async ensureFolder(auth: any, profile: any) {
    try {
      const drive = google.drive({ version: 'v3', auth })
      
      // 1. Check if we already have a folder ID in profile
      if (profile.googleIntegration?.driveFolderId) {
        try {
          const folder = await drive.files.get({
            fileId: profile.googleIntegration.driveFolderId,
            fields: 'id, trashed'
          })
          if (folder.data && !folder.data.trashed) {
            return folder.data.id as string
          }
        } catch (e) {
          // Folder doesn't exist or no access, fall through to search/create
          console.warn(`[GoogleService] Stored folder ID ${profile.googleIntegration.driveFolderId} is invalid, searching...`)
        }
      }

      const config = useRuntimeConfig()
      const folderName = config.appName || 'Orcei'
      
      // 2. Search by name
      const res = await drive.files.list({
        q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id)'
      })

      let folderId: string | undefined

      if (res.data.files?.length) {
        folderId = res.data.files[0].id as string
      } else {
        // 3. Create new folder
        const folder = await drive.files.create({
          requestBody: { name: folderName, mimeType: 'application/vnd.google-apps.folder' },
          fields: 'id'
        })
        folderId = folder.data.id as string
      }

      // 4. Update profile with new/found folderId
      if (folderId && folderId !== profile.googleIntegration?.driveFolderId) {
        const { Profile } = await import('../models/Profile')
        await Profile.findByIdAndUpdate(profile._id, {
          $set: { 'googleIntegration.driveFolderId': folderId }
        })
      }

      return folderId
    } catch (error) {
      console.error('[GoogleService] Error in ensureFolder:', error)
      throw error
    }
  },

  async uploadPdf(auth: any, folderId: string, fileName: string, buffer: Buffer) {
    try {
      const drive = google.drive({ version: 'v3', auth })
      
      // Google API espera Stream para uploads no Node.js
      const stream = Readable.from(buffer)

      const res = await drive.files.create({
        requestBody: { name: fileName, parents: [folderId] },
        media: { mimeType: 'application/pdf', body: stream },
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
