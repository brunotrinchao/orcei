import { ProfileService } from '../../../services/ProfileService'
import { ProposalService } from '../../../services/ProposalService'
import { Proposal } from '../../../models/Proposal'
import { QueueService } from '../../../services/QueueService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')
  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'Profile not found' })

  const proposal = await ProposalService.getById(id!, profile._id.toString())
  if (!proposal) throw createError({ statusCode: 404, statusMessage: 'Proposal not found' })

  // Agendar reenvio de e-mail via Fila
  if (!proposal.client?.email) {
    throw createError({ statusCode: 400, statusMessage: 'Cliente sem e-mail cadastrado' })
  }

  const proposalUrl = `${process.env.PUBLIC_URL || 'https://orcei.com.br'}/p/${proposal.slug}?t=${proposal.token}`
  
  await QueueService.publish('SEND_EMAIL_PROPOSAL', {
    clientEmail: proposal.client.email,
    clientName: proposal.client.name || 'Cliente',
    url: proposalUrl,
    profileName: profile.name,
    proposalId: proposal._id
  })

  // Log no histórico
  await ProposalService.logHistory(proposal._id, 'sent', 'email', { status: 'queued', action: 'resend' })

  return { success: true, queued: true }
})
