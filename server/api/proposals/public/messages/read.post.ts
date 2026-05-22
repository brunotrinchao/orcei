import { Proposal } from '../../../models/Proposal'
import { ProposalMessage } from '../../../models/ProposalMessage'

export default defineEventHandler(async (event) => {
  const { slug, t: token } = getQuery(event)

  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing Slug' })

  const proposal = await Proposal.findOne({ slug })
  if (!proposal) throw createError({ statusCode: 404, statusMessage: 'Proposal not found' })

  // Security check
  if (proposal.token && proposal.token !== token) {
    throw createError({ statusCode: 403, statusMessage: 'Token inválido' })
  }

  // Marcar todas as mensagens do freelancer para esta proposta como lidas
  await ProposalMessage.updateMany(
    { 
      proposalId: proposal._id,
      sender: 'freelancer',
      read: false
    },
    { $set: { read: true } }
  )

  return { success: true }
})
