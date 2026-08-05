import { Proposal } from '../../models/Proposal'
import { ProposalHistory } from '../../models/ProposalHistory'

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

  const eventType = payload.event || payload.type || payload.action
  const documentData = payload.data || payload.document || payload
  const documentId = documentData?.id || documentData?.document_id || payload.document_id
  const externalId = documentData?.external_id || payload.external_id

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

  if (!proposal) {
    console.log('[Assinafy Webhook] Orçamento não encontrado para o documento:', documentId || externalId)
    return { received: true, note: 'Orçamento não localizado' }
  }

  const action = (eventType || '').toLowerCase()

  if (action.includes('signed') || action === 'document.signed' || action === 'completed') {
    proposal.signature.status = 'signed'
    proposal.signature.signedAt = new Date()
    proposal.status = 'accepted'

    if (documentData?.download_url || documentData?.pdf_url) {
      proposal.signature.signedFileUrl = documentData.download_url || documentData.pdf_url
    }

    await proposal.save()

    await ProposalHistory.create({
      proposalId: proposal._id,
      type: 'signature',
      action: 'signed',
      details: {
        provider: 'assinafy',
        documentId: documentId || proposal.signature.documentId,
        signedAt: new Date()
      }
    })

    return { received: true, status: 'signed' }
  }

  if (action.includes('rejected') || action === 'document.rejected') {
    const reason = documentData?.rejection_reason || payload.reason || 'Recusado pelo signatário'
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
        reason
      }
    })

    return { received: true, status: 'rejected' }
  }

  if (action.includes('viewed') || action === 'document.viewed') {
    if (proposal.status === 'sent') {
      proposal.status = 'viewed'
      await proposal.save()
    }

    await ProposalHistory.create({
      proposalId: proposal._id,
      type: 'signature',
      action: 'viewed',
      details: { provider: 'assinafy', documentId }
    })

    return { received: true, status: 'viewed' }
  }

  return { received: true, note: `Evento '${eventType}' processado sem alteração de status` }
})
