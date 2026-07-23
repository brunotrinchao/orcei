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
  getAuthClient(profile: any, event?: any) {
    const config = useRuntimeConfig()
    let redirectUri = `${config.public.siteUrl}/api/integrations/google/callback`

    if (event) {
      try {
        const protocol = getRequestProtocol(event, { xForwardedProto: true }) || 'https'
        const host = getRequestHost(event, { xForwardedHost: true })
        if (host) {
          redirectUri = `${protocol}://${host}/api/integrations/google/callback`
        }
      } catch (e) {}
    }

    const oauth2Client = new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      redirectUri
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
        if (!tokens.access_token && !tokens.expiry_date) return

        const { Profile } = await import('../models/Profile')
        const current = await Profile.findById(profile._id)
        const existingIntegration = current?.googleIntegration || {}

        // Substitui o objeto inteiro (não dot-notation) — evita erro do Mongo
        // "Cannot create field X in element {googleIntegration: null}".
        const googleIntegration = {
          ...existingIntegration,
          accessToken: tokens.access_token || existingIntegration.accessToken,
          expiryDate: tokens.expiry_date || existingIntegration.expiryDate
        }

        await Profile.findByIdAndUpdate(profile._id, { $set: { googleIntegration } })
        console.log(`[GoogleService] Tokens refreshed and saved for profile: ${profile._id}`)
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
        // Substitui o objeto inteiro (não dot-notation) — evita erro do Mongo
        // "Cannot create field X in element {googleIntegration: null}".
        const googleIntegration = { ...(profile.googleIntegration || {}), driveFolderId: folderId }
        await Profile.findByIdAndUpdate(profile._id, { $set: { googleIntegration } })
      }

      return folderId
    } catch (error) {
      console.error('[GoogleService] Error in ensureFolder:', error)
      throw error
    }
  },

  /**
   * Garante a sub-pasta "Propostas" dentro da pasta raiz do app.
   * Persiste o ID no perfil para evitar buscas repetidas.
   */
  async ensureProposalsFolder(auth: any, profile: any, rootFolderId: string): Promise<string> {
    const drive = google.drive({ version: 'v3', auth })

    // Verificar se já temos o ID salvo
    if (profile.googleIntegration?.driveProposalsFolderId) {
      try {
        const folder = await drive.files.get({
          fileId: profile.googleIntegration.driveProposalsFolderId,
          fields: 'id, trashed'
        })
        if (folder.data && !folder.data.trashed) {
          return folder.data.id as string
        }
      } catch (e) {
        console.warn('[GoogleService] Pasta Propostas inválida, recriando...')
      }
    }

    // Buscar ou criar a pasta "Propostas" dentro da raiz
    const res = await drive.files.list({
      q: `name = 'Propostas' and mimeType = 'application/vnd.google-apps.folder' and '${rootFolderId}' in parents and trashed = false`,
      fields: 'files(id)'
    })

    let proposalsFolderId: string
    if (res.data.files?.length) {
      proposalsFolderId = res.data.files[0].id as string
    } else {
      const folder = await drive.files.create({
        requestBody: { name: 'Propostas', mimeType: 'application/vnd.google-apps.folder', parents: [rootFolderId] },
        fields: 'id'
      })
      proposalsFolderId = folder.data.id as string
    }

    // Salvar no perfil
    const { Profile } = await import('../models/Profile')
    const googleIntegration = { ...(profile.googleIntegration || {}), driveProposalsFolderId: proposalsFolderId }
    await Profile.findByIdAndUpdate(profile._id, { $set: { googleIntegration } })

    return proposalsFolderId
  },

  /**
   * Garante a sub-pasta com o nome do cliente dentro de "Propostas".
   */
  async ensureClientFolder(auth: any, proposalsFolderId: string, clientName: string): Promise<string> {
    const drive = google.drive({ version: 'v3', auth })
    // Sanitizar o nome do cliente para uso como nome de pasta
    const safeName = clientName.replace(/[\/\\:*?"<>|]/g, '').trim() || 'Cliente'

    const res = await drive.files.list({
      q: `name = '${safeName}' and mimeType = 'application/vnd.google-apps.folder' and '${proposalsFolderId}' in parents and trashed = false`,
      fields: 'files(id)'
    })

    if (res.data.files?.length) {
      return res.data.files[0].id as string
    }

    const folder = await drive.files.create({
      requestBody: { name: safeName, mimeType: 'application/vnd.google-apps.folder', parents: [proposalsFolderId] },
      fields: 'id'
    })
    return folder.data.id as string
  },

  async uploadPdf(auth: any, folderId: string, fileName: string, buffer: Buffer) {
    try {
      const drive = google.drive({ version: 'v3', auth })
      
      // Converter Uint8Array para Buffer e passar como array de 1 item para o Readable
      const stream = Readable.from([Buffer.from(buffer)])

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

  /**
   * Faz download do conteúdo de um arquivo do Drive e retorna como Buffer.
   */
  async downloadFile(auth: any, fileId: string): Promise<Buffer> {
    const drive = google.drive({ version: 'v3', auth })
    const res = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    )
    return Buffer.from(res.data as ArrayBuffer)
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
