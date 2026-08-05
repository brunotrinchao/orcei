import { ProfileService } from '../../../services/ProfileService'
import { ProposalService } from '../../../services/ProposalService'
import { AssinafyService } from '../../../services/AssinafyService'
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

  try {
    // Solicita a criação do documento e assinatura via Assinafy (transparente)
    const result = await AssinafyService.createAndSendDocument({
      proposal: proposal.toObject(),
      profile: profile.toObject()
    })

    // Atualiza os dados de assinatura da proposta
    proposal.signature = {
      provider: 'assinafy',
      documentId: result.documentId,
      status: 'pending',
      signingUrl: result.signingUrl,
      signedAt: null,
      signedFileUrl: null,
      rejectionReason: null
    }

    // Se o orçamento estava em rascunho, avança o status para enviado
    if (proposal.status === 'draft') {
      proposal.status = 'sent'
    }

    await proposal.save()

    // Registra log de auditoria
    await AuditService.log({
      adminId: (session.user as any).id,
      adminName: profile.name,
      action: 'REQUEST_DIGITAL_SIGNATURE',
      targetId: proposal._id?.toString(),
      targetType: 'Proposal',
      details: { documentId: result.documentId, clientEmail: proposal.client.email }
    })

    return {
      success: true,
      message: 'Solicitação de assinatura eletrônica iniciada com sucesso!',
      signature: proposal.signature,
      signingUrl: result.signingUrl
    }
  } catch (error: any) {
    console.error('[Signature.post] Erro ao solicitar assinatura:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Falha ao comunicar com o serviço de assinatura eletrônica'
    })
  }
})
