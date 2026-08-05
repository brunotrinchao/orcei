import { Proposal } from '../../models/Proposal'
import { ProposalHistory } from '../../models/ProposalHistory'
import { NotificationService } from '../../services/NotificationService'

export default defineEventHandler(async (event) => {
  setResponseStatus(event, 200)

  let payload: any
  try {
    payload = await readBody(event)
  } catch (e) {
    console.error('[Assinafy Webhook] Erro ao ler corpo da requisição:', e)
    return { received: false, error: 'Corpo da requisição inválido' }
  }

  if (!payload) {
    return { received: true, note: 'Payload vazio' }
  }

  console.log('[Assinafy Webhook] Evento recebido:', JSON.stringify(payload))

  const eventType = (
    payload.event ||
    payload.type ||
    payload.action ||
    payload.event_type ||
    payload.name ||
    ''
  ).toString().trim().toLowerCase()

  const documentData = payload.object || payload.data || payload.document || payload
  const documentId =
    (payload.object && payload.object.id) ||
    (payload.data && payload.data.id) ||
    (payload.document && payload.document.id) ||
    documentData?.document_id ||
    payload.document_id ||
    (typeof payload.id === 'string' ? payload.id : null)

  const externalId =
    documentData?.external_id ||
    payload.external_id ||
    documentData?.metadata?.proposalId ||
    payload.metadata?.proposalId

  if (!documentId && !externalId) {
    return { received: true, note: 'ID de documento não informado no payload' }
  }

  // Localiza a proposta por ID do documento da Assinafy ou por externalId (_id da proposta)
  let proposal: any = null
  if (documentId) {
    proposal = await Proposal.findOne({ 'signature.documentId': documentId })
  }
  if (!proposal && externalId) {
    proposal = await Proposal.findById(externalId)
  }

  // Fallback 3: Tenta localizar pelo código da proposta contido no nome do arquivo (ex: "orcamento_-ORC-2026-004.pdf")
  if (!proposal && documentData?.name) {
    const match = documentData.name.match(/ORC-\d{4}-\d{3,}/i)
    if (match) {
      const code = `#${match[0].toUpperCase()}`
      proposal = await Proposal.findOne({ code })
      if (proposal && documentId) {
        proposal.signature = proposal.signature || {}
        proposal.signature.documentId = documentId
      }
    }
  }

  if (!proposal) {
    console.log('[Assinafy Webhook] Orçamento não encontrado para o documento:', documentId || externalId)
    return { received: true, note: 'Orçamento não localizado' }
  }

  /**
   * Ciclo de Vida do Webhook Assinafy:
   * 1. document_uploaded: Documento criado/enviado para o Assinafy
   * 2. signer_viewed_document: Signatário visualizou o documento de assinatura
   * 3. signer_signed_document: Signatário assinou o documento
   * 4. user_rejected_document: Signatário recusou assinar o documento
   */

  // --- 1. DOCUMENT UPLOADED ---
  if (
    eventType === 'document_uploaded' ||
    eventType === 'document.uploaded' ||
    eventType === 'document_created' ||
    eventType === 'document.created' ||
    eventType.includes('uploaded')
  ) {
    if (proposal.signature && proposal.signature.status !== 'signed') {
      proposal.signature.status = 'pending'
      if (documentId) {
        proposal.signature.documentId = documentId
      }
      const signingUrl = documentData?.signing_url || documentData?.url || documentData?.assignment?.signing_urls?.[0]?.url
      if (signingUrl) {
        proposal.signature.signingUrl = signingUrl
      }
    }

    await proposal.save()

    await ProposalHistory.create({
      proposalId: proposal._id,
      type: 'signature',
      action: 'uploaded',
      details: {
        provider: 'assinafy',
        documentId: documentId || proposal.signature?.documentId,
        event: 'document_uploaded'
      },
      timestamp: new Date()
    })

    return { received: true, event: 'document_uploaded', status: 'pending' }
  }

  // --- 2. SIGNER VIEWED DOCUMENT ---
  if (
    eventType === 'signer_viewed_document' ||
    eventType === 'signer.viewed_document' ||
    eventType === 'document_viewed' ||
    eventType === 'document.viewed' ||
    eventType === 'signer_viewed' ||
    eventType.includes('viewed')
  ) {
    if (proposal.status === 'sent') {
      proposal.status = 'viewed'
      await proposal.save()
    }

    await ProposalHistory.create({
      proposalId: proposal._id,
      type: 'signature',
      action: 'viewed',
      details: {
        provider: 'assinafy',
        documentId: documentId || proposal.signature?.documentId,
        event: 'signer_viewed_document'
      },
      timestamp: new Date()
    })

    return { received: true, event: 'signer_viewed_document', status: proposal.status }
  }

  // --- 3. SIGNER SIGNED DOCUMENT ---
  if (
    eventType === 'signer_signed_document' ||
    eventType === 'signer.signed_document' ||
    eventType === 'document_signed' ||
    eventType === 'document.signed' ||
    eventType === 'signer_signed' ||
    eventType.includes('signed') ||
    eventType === 'completed'
  ) {
    proposal.signature = proposal.signature || {}
    proposal.signature.status = 'signed'
    proposal.signature.signedAt = new Date()
    proposal.status = 'accepted'

    const downloadUrl =
      documentData?.download_url ||
      documentData?.pdf_url ||
      documentData?.signed_file_url ||
      payload.download_url

    if (downloadUrl) {
      proposal.signature.signedFileUrl = downloadUrl
    }

    await proposal.save()

    await ProposalHistory.create({
      proposalId: proposal._id,
      type: 'signature',
      action: 'signed',
      details: {
        provider: 'assinafy',
        documentId: documentId || proposal.signature.documentId,
        signedAt: new Date(),
        event: 'signer_signed_document'
      },
      timestamp: new Date()
    })

    // Enviar notificação para o prestador de serviço
    try {
      const profileIdStr = typeof proposal.profileId === 'object' ? proposal.profileId._id.toString() : proposal.profileId.toString()
      const clientName = proposal.client?.name || 'Cliente'
      await NotificationService.createNotification({
        profileId: profileIdStr,
        type: 'proposal_accepted',
        title: 'Documento Assinado Digitalmente!',
        summary: `O cliente ${clientName} assinou a proposta #${proposal.code} via Assinafy.`,
        details: {
          proposalId: proposal._id.toString(),
          code: proposal.code,
          title: proposal.title,
          clientName,
          clientEmail: proposal.client?.email || '',
          finalValue: proposal.totals?.final,
          paymentMethod: proposal.paymentConfig?.method,
          signedAt: new Date().toISOString()
        },
        metadata: {
          proposalId: proposal._id.toString(),
          code: proposal.code
        }
      })
    } catch (notifErr) {
      console.error('[Assinafy Webhook] Erro ao enviar notificação de documento assinado:', notifErr)
    }

    return { received: true, event: 'signer_signed_document', status: 'signed' }
  }

  // --- 4. USER REJECTED DOCUMENT ---
  if (
    eventType === 'user_rejected_document' ||
    eventType === 'user.rejected_document' ||
    eventType === 'signer_rejected_document' ||
    eventType === 'signer.rejected_document' ||
    eventType === 'document_rejected' ||
    eventType === 'document.rejected' ||
    eventType.includes('rejected')
  ) {
    const reason =
      documentData?.rejection_reason ||
      payload.reason ||
      payload.rejection_reason ||
      'Recusado pelo signatário'

    proposal.signature = proposal.signature || {}
    proposal.signature.status = 'rejected'
    proposal.signature.rejectionReason = reason
    proposal.status = 'rejected'

    await proposal.save()

    await ProposalHistory.create({
      proposalId: proposal._id,
      type: 'signature',
      action: 'rejected',
      details: {
        provider: 'assinafy',
        documentId: documentId || proposal.signature.documentId,
        reason,
        event: 'user_rejected_document'
      },
      timestamp: new Date()
    })

    // Enviar notificação para o prestador de serviço
    try {
      const profileIdStr = typeof proposal.profileId === 'object' ? proposal.profileId._id.toString() : proposal.profileId.toString()
      const clientName = proposal.client?.name || 'Cliente'
      await NotificationService.createNotification({
        profileId: profileIdStr,
        type: 'proposal_rejected',
        title: 'Assinatura Recusada pelo Cliente',
        summary: `O cliente ${clientName} recusou a assinatura da proposta #${proposal.code}.`,
        details: {
          proposalId: proposal._id.toString(),
          code: proposal.code,
          title: proposal.title,
          clientName,
          reason,
          rejectedAt: new Date().toISOString()
        },
        metadata: {
          proposalId: proposal._id.toString(),
          code: proposal.code
        }
      })
    } catch (notifErr) {
      console.error('[Assinafy Webhook] Erro ao enviar notificação de documento recusado:', notifErr)
    }

    return { received: true, event: 'user_rejected_document', status: 'rejected' }
  }

  return { received: true, note: `Evento '${eventType}' recebido e processado (sem alteração de status)` }
})
