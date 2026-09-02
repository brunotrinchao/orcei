import { ProfileService } from '../../../services/ProfileService'
import { ProposalService } from '../../../services/ProposalService'
import { QueueService } from '../../../services/QueueService'
import { AuditService } from '../../../services/AuditService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID do orçamento inválido' })
  }

  const proposal = await ProposalService.getById(id, profile._id as any)
  if (!proposal) {
    throw createError({ statusCode: 404, statusMessage: 'Orçamento não encontrado' })
  }

  if (!proposal.client?.name || !proposal.client?.email) {
    throw createError({ statusCode: 400, statusMessage: 'O cliente precisa ter nome e e-mail cadastrados para assinar digitalmente.' })
  }

  // Regra de negócio: assinatura eletrônica somente APÓS o aceite do cliente.
  // O aceite dispara a solicitação automaticamente (via fila) — este endpoint é o fallback manual.
  if (proposal.status !== 'accepted') {
    throw createError({
      statusCode: 422,
      statusMessage: 'O cliente precisa aceitar o orçamento antes de solicitar a assinatura eletrônica. O link será enviado por e-mail automaticamente após o aceite.'
    })
  }

  // Atualiza os dados de assinatura da proposta para status "pending" (Aguardando assinatura)
  proposal.signature = {
    provider: 'assinafy',
    documentId: proposal.signature?.documentId || null,
    status: 'pending',
    signingUrl: proposal.signature?.signingUrl || null,
    signedAt: null,
    signedFileUrl: null,
    rejectionReason: null,
    requestedAt: new Date()
  }

  await proposal.save()

  // Agendar solicitação de assinatura assincronamente via Fila (QStash)
  const runPromise = Promise.all([
    QueueService.publish('REQUEST_DIGITAL_SIGNATURE', {
      proposalId: proposal._id?.toString(),
      profileId: profile._id?.toString()
    }),
    ProposalService.logHistory(proposal._id, 'signature_requested', 'system', { status: 'queued' }),
    AuditService.log({
      adminId: (session.user as any).id,
      adminName: profile.name,
      action: 'REQUEST_DIGITAL_SIGNATURE',
      targetId: proposal._id?.toString(),
      targetType: 'Proposal',
      details: { clientEmail: proposal.client.email }
    })
  ])

  if (typeof event?.waitUntil === 'function') {
    event.waitUntil(runPromise)
  } else {
    await runPromise
  }

  return {
    success: true,
    queued: true,
    message: 'Solicitação de assinatura eletrônica agendada com sucesso!',
    signature: proposal.signature
  }
})
