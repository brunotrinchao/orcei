import { google } from 'googleapis'
import mongoose from 'mongoose'
import * as dotenv from 'dotenv'
dotenv.config()

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    const db = mongoose.connection.db
    const profile = await db.collection('profiles').findOne({ email: 'brunotrinchao@gmail.com' })

    if (!profile?.googleIntegration?.refreshToken) {
      console.error('RefreshToken nao encontrado.')
      process.exit(1)
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID,
      process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
      access_token: profile.googleIntegration.accessToken,
      refresh_token: profile.googleIntegration.refreshToken
    })

    console.log('Testando Google Calendar...')
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    const calRes = await calendar.calendarList.list()
    console.log('Conexao Calendar OK. Calendarios encontrados:', calRes.data.items.length)

    console.log('Testando Google Drive...')
    const drive = google.drive({ version: 'v3', auth: oauth2Client })
    const driveRes = await drive.files.list({ pageSize: 1 })
    console.log('Conexao Drive OK. Arquivos encontrados:', driveRes.data.files.length)

    console.log('TESTE CONCLUIDO COM SUCESSO')

  } catch (e) {
    console.error('ERRO NO TESTE:', e.message)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}
test()
