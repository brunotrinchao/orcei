import { Receiver } from "@upstash/qstash"
import mongoose from 'mongoose'
import { Profile } from '../../models/Profile'
import { Client } from '../../models/Client'
import { Proposal } from '../../models/Proposal'
import { CatalogItem } from '../../models/CatalogItem'
import { AuditService } from '../../services/AuditService'
import { ProposalService } from '../../services/ProposalService'
import { GoogleService } from '../../services/GoogleService'
import { generateProposalPdfBuffer } from '../../utils/pdf'
import { jsonToCsv } from '../../utils/csv'
import { sendBackupEmail, sendProposalEmail } from '../../utils/email'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const headers = getHeaders(event)
  
  // O QStash pode enviar os headers originais com ou sem prefixo 'upstash-'
  const action = headers['upstash-forward-action'] || headers['forward-action'] || headers['x-action'] || headers['action']
  const signature = headers['upstash-signature']
  const body = await readBody(event)

  if (!action) {
    console.error('[QStash Webhook] Ação não encontrada nos headers:', JSON.stringify(headers))
    throw createError({ statusCode: 400, statusMessage: 'Action missing' })
  }

  // Garantir conexão com MongoDB antes de qualquer operação
  if (mongoose.connection.readyState !== 1) {
    console.warn(`[QStash Webhook] MongoDB state is ${mongoose.connection.readyState}. Operation [${action}] might fail.`)
    // Se estiver desconectado, tentamos forçar a conexão (útil em cold starts severos)
    if (mongoose.connection.readyState === 0) {
      const uri = config.mongodbUri || process.env.MONGODB_URI
      if (uri) await mongoose.connect(uri)
    }
  }

  // Validação de Segurança via SDK
  if (config.qstashCurrentSigningKey && config.qstashNextSigningKey) {
    const receiver = new Receiver({
      currentSigningKey: config.qstashCurrentSigningKey,
      nextSigningKey: config.qstashNextSigningKey,
    })

    // No SDK Receiver.verify, o body deve ser a string exata recebida
    const isValid = await receiver.verify({
      signature: signature || '',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }).catch((e) => {
      console.error('[QStash Webhook] Erro na verificação:', e.message)
      return false
    })

    if (!isValid) {
      console.error('[QStash Webhook] Assinatura inválida detectada.')
      throw createError({ statusCode: 401, statusMessage: 'Assinatura QStash inválida' })
    }
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

      case 'REGISTER_AUDIT_LOG':
        await handleRegisterAuditLog(body)
        break

      case 'GENERATE_BACKUP_CSV':
        await handleGenerateBackupCsv(body)
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

async function handleRegisterAuditLog(payload: any) {
  await AuditService.persist(payload)
}

async function handleGenerateBackupCsv(payload: any) {
  const { profileId } = payload
  const JSZip = await import('jszip').then(m => m.default)

  const profile = await Profile.findById(profileId)
  if (!profile || !profile.email) return

  console.log(`[Job] Gerando backup CSV para: ${profile.email}`)

  const [clients, proposals, catalog] = await Promise.all([
    Client.find({ profileId }).lean(),
    Proposal.find({ profileId }).lean(),
    CatalogItem.find({ profileId }).lean()
  ])

  const zip = new JSZip()
  zip.file('clientes.csv', jsonToCsv(clients))
  zip.file('orcamentos.csv', jsonToCsv(proposals))
  zip.file('catalogo.csv', jsonToCsv(catalog))

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
  
  await sendBackupEmail(profile.email, profile.name, zipBuffer)
  
  console.log(`[Job] Backup CSV enviado para e-mail: ${profile.email}`)
}

async function handleProposalAccepted(payload: any) {
  const { proposalId } = payload

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

  await ProposalService.logHistory(proposal._id, 'google_sync', 'system', { drive: true, calendar: !!proposal.executionDate })
  
  console.log(`[Job] Automação Google concluída para: ${proposal.code}`)
}

async function handleSendEmailProposal(payload: any) {
  const { clientEmail, clientName, url, profileName, proposalId } = payload
  console.log(`[Job] Enviando e-mail para: ${clientEmail}`)
  
  const emailRes = await sendProposalEmail(clientEmail, clientName, url, profileName)

  if (emailRes && proposalId) {
    await Proposal.findByIdAndUpdate(proposalId, { lastEmailId: emailRes.id })
    console.log(`[Job] Proposta ${proposalId} atualizada com emailId: ${emailRes.id}`)
  }
}
