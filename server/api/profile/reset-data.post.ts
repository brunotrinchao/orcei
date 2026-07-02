import { Profile } from '../../models/Profile'
import { Client } from '../../models/Client'
import { Proposal } from '../../models/Proposal'
import { ProposalMessage } from '../../models/ProposalMessage'
import { ProposalHistory } from '../../models/ProposalHistory'
import { CatalogItem } from '../../models/CatalogItem'
import { Report } from '../../models/Report'
import { Event } from '../../models/Event'
import { Counter } from '../../models/Counter'
import { AuditLog } from '../../models/AuditLog'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  const userId = (session.user as any).id
  const profile = await Profile.findOne({ userId })
  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })
  }

  const body = await readBody(event).catch(() => ({}))
  if (body?.confirm !== profile.email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Confirmação inválida. Digite seu e-mail para confirmar o reset dos dados.'
    })
  }

  // Log de auditoria antes de apagar (ação destrutiva e irreversível)
  await AuditLog.create({
    adminId: userId,
    adminName: profile.name,
    action: 'ACCOUNT_DATA_RESET',
    targetId: profile._id.toString(),
    targetType: 'User',
    details: { email: profile.email },
    ip: event.node.req.socket.remoteAddress
  })

  // Mensagens e histórico dependem de proposalId, não de profileId diretamente
  const proposalIds = await Proposal.find({ profileId: profile._id }).distinct('_id')

  await Promise.all([
    ProposalMessage.deleteMany({ proposalId: { $in: proposalIds } }),
    ProposalHistory.deleteMany({ proposalId: { $in: proposalIds } }),
    Proposal.deleteMany({ profileId: profile._id }),
    Client.deleteMany({ profileId: profile._id }),
    CatalogItem.deleteMany({ profileId: profile._id }),
    Report.deleteMany({ profileId: profile._id }),
    Event.deleteMany({ profileId: profile._id }),
    Counter.deleteMany({ profileId: profile._id })
  ])

  return { success: true, message: 'Clientes, catálogo, orçamentos e relatórios foram apagados. Sua conta e créditos permanecem intactos.' }
})
