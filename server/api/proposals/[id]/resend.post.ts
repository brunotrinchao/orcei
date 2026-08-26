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

  const domain = process.env.PUBLIC_PROPOSAL_URL || process.env.PUBLIC_URL || 'https://orcamento.orceifacil.com.br'
  const proposalUrl = `${domain}/p/${proposal.slug}?t=${proposal.token}`
  
  const runPromise = Promise.all([
    QueueService.publish('SEND_EMAIL_PROPOSAL', {
      clientEmail: proposal.client.email,
      clientName: proposal.client.name || 'Cliente',
      url: proposalUrl,
      profileName: profile.name,
      proposalId: proposal._id
    }),
    ProposalService.logHistory(proposal._id, 'sent', 'email', { status: 'queued', action: 'resend' })
  ])

  if (typeof event?.waitUntil === 'function') {
    event.waitUntil(runPromise)
  } else {
    await runPromise
  }

  return { success: true, queued: true }
})
