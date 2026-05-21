import mongoose from 'mongoose'
import * as dotenv from 'dotenv'
import { google } from 'googleapis'

dotenv.config()

async function debug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    const db = mongoose.connection.db

    const profile = await db.collection('profiles').findOne({ email: 'brunotrinchao@gmail.com' })
    if (!profile?.googleIntegration?.refreshToken) {
      console.error('ERRO: Google nao conectado para brunotrinchao@gmail.com')
      process.exit(1)
    }

    console.log('1. Perfil encontrado. DriveFolderId:', profile.googleIntegration.driveFolderId || 'Nao definido')

    const oauth2Client = new google.auth.OAuth2(
      process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID,
      process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
      access_token: profile.googleIntegration.accessToken,
      refresh_token: profile.googleIntegration.refreshToken
    })

    // Testar Refresh de Token
    console.log('2. Testando refresh de token...')
    try {
      const { credentials } = await oauth2Client.refreshAccessToken()
      console.log('Refresh OK. Novo AccessToken gerado.')
    } catch (e) {
      console.error('ERRO no Refresh Token:', e.message)
    }

    // Buscar ultima proposta aceita com data
    const proposal = await db.collection('proposals').findOne({ 
      profileId: profile._id, 
      status: 'accepted',
      executionDate: { $ne: null }
    }, { sort: { updatedAt: -1 } })

    if (!proposal) {
      console.log('3. Nenhuma proposta aceita com data encontrada para teste.')
      process.exit(0)
    }

    console.log('3. Proposta encontrada:', proposal.code, 'Data:', proposal.executionDate)

    // Testar Pasta Drive
    console.log('4. Testando Drive...')
    const drive = google.drive({ version: 'v3', auth: oauth2Client })
    const folderName = process.env.APP_NAME || 'Orcei'
    
    let folderId = profile.googleIntegration.driveFolderId
    if (!folderId) {
      const res = await drive.files.list({
        q: "name = '" + folderName + "' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
        fields: 'files(id)'
      })
      if (res.data.files?.length) {
        folderId = res.data.files[0].id
        console.log('Pasta ja existia no Drive:', folderId)
      } else {
        const folder = await drive.files.create({
          requestBody: { name: folderName, mimeType: 'application/vnd.google-apps.folder' },
          fields: 'id'
        })
        folderId = folder.data.id
        console.log('Nova pasta criada no Drive:', folderId)
      }
    } else {
      try {
        await drive.files.get({ fileId: folderId })
        console.log('FolderId armazenado e valido:', folderId)
      } catch (e) {
        console.error('FolderId armazenado e INVALIDO:', e.message)
      }
    }

    // Testar Criacao de Evento (Simulacao)
    console.log('5. Testando Calendar (createEvent)...')
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    
    const eventData = {
      summary: 'TESTE DEBUG: ' + proposal.title,
      description: 'Orçamento: ' + proposal.code + '\nCliente: ' + proposal.client.name,
      start: { dateTime: new Date(proposal.executionDate).toISOString() },
      end: { dateTime: new Date(new Date(proposal.executionDate).getTime() + 3600000).toISOString() }
    }

    try {
      const eventRes = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: eventData
      })
      console.log('EVENTO CRIADO COM SUCESSO! Link:', eventRes.data.htmlLink)
    } catch (e) {
      console.error('ERRO ao criar evento no Calendar:', e.message)
      if (e.errors) console.log('Detalhes:', JSON.stringify(e.errors, null, 2))
    }

  } catch (e) {
    console.error('ERRO FATAL NO DEBUG:', e)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

debug()
