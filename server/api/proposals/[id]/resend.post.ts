import { ProfileService } from '../../../services/ProfileService'
import { ProposalService } from '../../../services/ProposalService'
import { Proposal } from '../../../models/Proposal'
import { sendProposalEmail } from '../../../utils/email'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')
  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'Profile not found' })

  const proposal = await ProposalService.getById(id!, profile._id.toString())
  if (!proposal) throw createError({ statusCode: 404, statusMessage: 'Proposal not found' })

  // Reenviar e-mail via Resend
  if (!proposal.client?.email) {
    throw createError({ statusCode: 400, statusMessage: 'Cliente sem e-mail cadastrado' })
  }

  const proposalUrl = `${process.env.PUBLIC_URL || 'https://orcfacil.com.br'}/p/${proposal.slug}?t=${proposal.token}`
  const emailRes = await sendProposalEmail(
    proposal.client.email,
    proposal.client.name || 'Cliente',
    proposalUrl,
    profile.name
  )

  if (!emailRes) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao enviar e-mail via Resend. Verifique os logs do servidor para detalhes.'
    })
  }

  // Atualizar só o lastEmailId — update direto evita recalcular totals
  await Proposal.findByIdAndUpdate(id, { lastEmailId: emailRes.id })

  return { success: true, emailId: emailRes.id }
})
