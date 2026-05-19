import { Profile } from '../../models/Profile'
import { Client } from '../../models/Client'
import { Proposal } from '../../models/Proposal'
import { CatalogItem } from '../../models/CatalogItem'
import { Event } from '../../models/Event'
import { sendBackupEmail } from '../../utils/email'

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

  try {
    if (profile.email) {
      await sendBackupEmail(profile.email, profile.name, jsonBackup)
    }

    return { success: true, message: 'Backup enviado para o seu e-mail.' }
  } catch (e: any) {
    console.error('Backup Email Error:', e)
    throw createError({ statusCode: 500, statusMessage: 'Erro ao enviar e-mail de backup' })
  }
})
