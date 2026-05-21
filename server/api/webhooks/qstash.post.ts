import { Receiver } from "@upstash/qstash"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const signature = getHeader(event, 'upstash-signature')
  const action = getHeader(event, 'upstash-forward-action')
  const body = await readBody(event)

  // Validação de Segurança via SDK
  if (config.qstashCurrentSigningKey && config.qstashNextSigningKey) {
    const receiver = new Receiver({
      currentSigningKey: config.qstashCurrentSigningKey,
      nextSigningKey: config.qstashNextSigningKey,
    })

    const isValid = await receiver.verify({
      signature: signature || '',
      body: JSON.stringify(body),
    }).catch(() => false)

    if (!isValid) {
      console.error('[QStash Webhook] Assinatura inválida detectada.')
      throw createError({ statusCode: 401, statusMessage: 'Assinatura QStash inválida' })
    }
  } else {
    console.warn('[QStash Webhook] Chaves de assinatura não configuradas. Pulando validação.')
  }

  console.log(`[QStash Webhook] Recebido job: ${action}`)

  try {
    switch (action) {
      case 'PROPOSAL_ACCEPTED':
        await handleProposalAccepted(body)
        break
      
      case 'SEND_EMAIL_PROPOSAL':
        await handleSendEmailProposal(body)
        break

      case 'TEST_JOB':
        console.log('[QStash Webhook] Teste recebido com sucesso!', body)
        break

      default:
        console.warn(`[QStash Webhook] Ação desconhecida: ${action}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error(`[QStash Webhook] Erro ao processar job ${action}:`, error.message)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})

async function handleProposalAccepted(payload: any) {
  const { proposalId } = payload
  const { Proposal } = await import('../../models/Proposal')
  const { GoogleService } = await import('../../services/GoogleService')
  const { generateProposalPdfBuffer } = await import('../../utils/pdf')

  const proposal = await Proposal.findById(proposalId).populate('profileId')
  if (!proposal) throw new Error(`Proposta ${proposalId} não encontrada`)

  const profile: any = proposal.profileId
  if (!profile?.googleIntegration?.refreshToken) return

  console.log(`[Job] Iniciando automação Google para: ${proposal.code}`)
  
  const auth = GoogleService.getAuthClient(profile)
  const folderId = profile.googleIntegration.driveFolderId || await GoogleService.ensureFolder(auth, profile)

  const pdfBuffer = await generateProposalPdfBuffer(proposal, profile)
  const fileName = `Proposta-${proposal.code}-${proposal.client.name}.pdf`
  const driveFile = await GoogleService.uploadPdf(auth, folderId, fileName, pdfBuffer)

  if (proposal.executionDate) {
    await GoogleService.createEvent(auth, {
      summary: `Execução: ${proposal.title} (${proposal.client.name})`,
      location: profile.address?.city || '',
      description: `Orçamento: ${proposal.code}\nCliente: ${proposal.client.name}\nValor: R$ ${proposal.totals.final.toLocaleString('pt-BR')}\n\nPDF: ${driveFile.webViewLink}`,
      start: proposal.executionDate,
      fileId: driveFile.id,
      webViewLink: driveFile.webViewLink,
      fileName
    })
  }

  const { ProposalService } = await import('../../services/ProposalService')
  await ProposalService.logHistory(proposal._id, 'google_sync', 'system', { drive: true, calendar: !!proposal.executionDate })
  
  console.log(`[Job] Automação Google concluída para: ${proposal.code}`)
}

async function handleSendEmailProposal(payload: any) {
  const { clientEmail, clientName, url, profileName } = payload
  console.log(`[Job] Enviando e-mail para: ${clientEmail}`)
  const { sendProposalEmail } = await import('../../utils/email')
  await sendProposalEmail(clientEmail, clientName, url, profileName)
}
