import { ProposalService } from '../../services/ProposalService'
import { sendProposalEmail } from '../../utils/email'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const signature = getHeader(event, 'upstash-signature')
  const action = getHeader(event, 'upstash-forward-action')
  const body = await readBody(event)

  // 1. Validação de Segurança (Simplificada por enquanto, ideal usar @upstash/qstash)
  // Se as chaves estiverem configuradas, deveríamos validar a assinatura
  if (config.qstashCurrentSigningKey && !signature) {
    throw createError({ statusCode: 401, statusMessage: 'Assinatura QStash ausente' })
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

      default:
        console.warn(`[QStash Webhook] Ação desconhecida: ${action}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error(`[QStash Webhook] Erro ao processar job ${action}:`, error.message)
    // Retornamos 500 para o QStash tentar novamente mais tarde
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})

async function handleProposalAccepted(payload: any) {
  const { proposalId } = payload
  const { Proposal } = await import('../../models/Proposal')
  const { Profile } = await import('../../models/Profile')
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

  // Log no histórico via ProposalService (importação dinâmica para evitar loop)
  const { ProposalService } = await import('../../services/ProposalService')
  await ProposalService.logHistory(proposal._id, 'google_sync', 'system', { drive: true, calendar: !!proposal.executionDate })
  
  console.log(`[Job] Automação Google concluída para: ${proposal.code}`)
}

async function handleSendEmailProposal(payload: any) {
  const { clientEmail, clientName, url, profileName } = payload
  console.log(`[Job] Enviando e-mail para: ${clientEmail}`)
  await sendProposalEmail(clientEmail, clientName, url, profileName)
}
