import { ProfileService } from '../../../services/ProfileService'
import { ProposalService } from '../../../services/ProposalService'
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

  const proposalUrl = `${process.env.PUBLIC_URL || 'https://orcei.com.br'}/p/${proposal.slug}?t=${proposal.token}`
  const emailRes = await sendProposalEmail(
    proposal.client.email,
    proposal.client.name || 'Cliente',
    proposalUrl,
    profile.name
  )

  if (!emailRes) {
    throw createError({ 
      statusCode: 500, 
      statusMessage: 'Erro ao enviar e-mail. Verifique sua chave da API do Resend.' 
    })
  }

  // Atualizar o ID do último e-mail enviado
  await ProposalService.update(id!, profile._id.toString(), {
    lastEmailId: emailRes.id
  })

  return { success: true, emailId: emailRes.id }
})
