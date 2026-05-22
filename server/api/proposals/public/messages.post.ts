import { Proposal } from '../../../models/Proposal'
import { ProposalMessage } from '../../../models/ProposalMessage'
import { ProposalService } from '../../../services/ProposalService'

export default defineEventHandler(async (event) => {
  const { slug, t: token } = getQuery(event)
  const body = await readBody(event)

  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing Slug' })
  if (!body.text) throw createError({ statusCode: 400, statusMessage: 'Missing Message Text' })

  let proposal
  try {
    proposal = await ProposalService.getBySlug(slug)
  } catch (err) {
    console.error('[Chat API] Erro ao buscar proposta:', err)
    throw createError({ statusCode: 503, statusMessage: 'Erro de conexão com o banco de dados' })
  }

  if (!proposal) throw createError({ statusCode: 404, statusMessage: 'Proposal not found' })

  // Security check
  if (proposal.token && proposal.token !== token) {
    throw createError({ statusCode: 403, statusMessage: 'Token inválido' })
  }

  const message = await ProposalMessage.create({
    proposalId: proposal._id,
    profileId: proposal.profileId,
    sender: 'client',
    text: body.text
  })

  // Update proposal status to PENDING (viewed/changes requested) if it's not accepted/expired
  if (!['accepted', 'expired'].includes(proposal.status)) {
    await ProposalService.updateStatus(slug, 'pending')
    await ProposalService.logHistory(proposal._id, 'pending', 'system', { notes: body.text })
  }

  // Trigger Pusher Event
  const pusher = usePusher()
  if (pusher) {
    // Specific proposal channel
    pusher.trigger(`private-proposal-${proposal._id}`, 'new-message', message)
    
    // Global profile channel for freelancer notifications
    const profileId = typeof proposal.profileId === 'object' && proposal.profileId._id 
      ? proposal.profileId._id.toString() 
      : proposal.profileId.toString()

    pusher.trigger(`private-profile-${profileId}`, 'proposal-notification', {
      proposalId: proposal._id,
      type: 'new-message',
      message
    })
  }

  return message
})
