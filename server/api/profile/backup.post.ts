import { Profile } from '../../models/Profile'
import { Client } from '../../models/Client'
import { Proposal } from '../../models/Proposal'
import { CatalogItem } from '../../models/CatalogItem'
import { Event } from '../../models/Event'
import { Resend } from 'resend'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  const profile = await Profile.findOne({ userId: (session.user as any).id })
  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })
  }

  // Coletar todos os dados
  const [clients, proposals, catalog, events] = await Promise.all([
    Client.find({ profileId: profile._id }).lean(),
    Proposal.find({ profileId: profile._id }).lean(),
    CatalogItem.find({ profileId: profile._id }).lean(),
    Event.find({ profileId: profile._id }).lean()
  ])

  const backupData = {
    profile: {
      name: profile.name,
      email: profile.email,
      company: profile.company,
      address: profile.address,
      contact: profile.contact
    },
    clients,
    proposals,
    catalog,
    events,
    exportedAt: new Date().toISOString()
  }

  const jsonBackup = JSON.stringify(backupData, null, 2)
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'Serviço de e-mail não configurado' })
  }

  const resend = new Resend(apiKey)
  const recipient = process.env.RESEND_TEST_TO || profile.email
  const config = useRuntimeConfig()
  const appName = config.appName || 'Orcei'

  try {
    await resend.emails.send({
      from: `${appName} <onboarding@resend.dev>`,
      to: recipient,
      subject: `Seu Backup de Dados - ${appName}`,
      html: `
        <h1>Backup de Dados ${appName}</h1>
        <p>Olá ${profile.name},</p>
        <p>Conforme solicitado, segue em anexo o backup completo dos seus dados na plataforma ${appName}.</p>
        <p>O arquivo está no formato JSON, que pode ser lido por programadores ou importado em outras ferramentas.</p>
        <br>
        <p>Equipe ${appName}</p>
      `,
      attachments: [
        {
          filename: `backup-${appName.toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`,
          content: Buffer.from(jsonBackup).toString('base64')
        }
      ]
    })

    return { success: true, message: 'Backup enviado para o seu e-mail.' }
  } catch (e: any) {
    console.error('Backup Email Error:', e)
    throw createError({ statusCode: 500, statusMessage: 'Erro ao enviar e-mail de backup' })
  }
})
