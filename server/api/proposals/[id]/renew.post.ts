import { ProfileService } from '../../../services/ProfileService'
import { ProposalService } from '../../../services/ProposalService'
import { Proposal } from '../../../models/Proposal'
import { QueueService } from '../../../services/QueueService'

interface RenewBody {
  resendEmail?: boolean
}

/**
 * Renova um orçamento:
 * - Recalcula a validade (expiresAt = agora + defaultValidityDays do perfil)
 * - Se estava expirado, reabre o status p/ 'sent' (link existente continua valendo)
 * - Opcional: reenvia o e-mail ao cliente com o MESMO link (body.resendEmail = true)
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  const body: RenewBody = await readBody(event).catch(() => ({}))
  const resendEmail = body.resendEmail === true

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID do orçamento inválido' })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })

  const proposal = await ProposalService.getById(id, profile._id.toString())
  if (!proposal) throw createError({ statusCode: 404, statusMessage: 'Orçamento não encontrado' })

  // Terminal por assinatura/aceite não renova
  if (proposal.status === 'accepted' || proposal.status === 'signed') {
    throw createError({ statusCode: 422, statusMessage: 'Orçamento já aceito/assinado não pode ser renovado.' })
  }

  if (!proposal.client?.email) {
    throw createError({ statusCode: 400, statusMessage: 'Cliente sem e-mail cadastrado' })
  }

  const validityDays = profile?.defaultValidityDays || 7
  const now = new Date()
  const expiresAt = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000)

  const wasExpired = proposal.status === 'expired' || (proposal.expiresAt && new Date(proposal.expiresAt).getTime() <= now.getTime())

  const updated = await Proposal.findOneAndUpdate(
    { _id: id, profileId: profile._id },
    {
      expiresAt,
      // Orçamento expirado volta p/ 'sent' (aberto ao cliente); senão mantém o status atual
      ...(wasExpired ? { status: 'sent' } : {})
    },
    { returnDocument: 'after' }
  )

  if (!updated) throw createError({ statusCode: 404, statusMessage: 'Orçamento não encontrado' })

  await ProposalService.logHistory(updated._id, 'renew', 'system', { renewedAt: now, validityDays, resendEmail })

  let emailed = false
  if (resendEmail) {
    const domain = process.env.PUBLIC_PROPOSAL_URL || process.env.PUBLIC_URL || 'https://orcamento.orceifacil.com.br'
    const proposalUrl = `${domain}/p/${updated.slug}?t=${updated.token}`
    const runPromise = Promise.all([
      QueueService.publish('SEND_EMAIL_PROPOSAL', {
        clientEmail: updated.client.email,
        clientName: updated.client.name || 'Cliente',
        url: proposalUrl,
        profileName: profile.name,
        proposalId: updated._id
      }),
      ProposalService.logHistory(updated._id, 'sent', 'email', { status: 'queued', action: 'renew' })
    ])
    if (typeof event?.waitUntil === 'function') {
      event.waitUntil(runPromise)
    } else {
      await runPromise
    }
    emailed = true
  }

  return {
    success: true,
    renewed: true,
    emailed,
    expiresAt,
    status: updated.status,
    message: emailed
      ? 'Orçamento renovado e novo e-mail enviado ao cliente.'
      : 'Orçamento renovado com a nova data de validade.'
  }
})