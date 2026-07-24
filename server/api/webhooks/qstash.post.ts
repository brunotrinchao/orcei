import { Receiver } from "@upstash/qstash"
import mongoose from 'mongoose'
import { Profile } from '../../models/Profile'
import { Client } from '../../models/Client'
import { Proposal } from '../../models/Proposal'
import { CatalogItem } from '../../models/CatalogItem'
import { Report } from '../../models/Report'
import { AuditService } from '../../services/AuditService'
import { ProposalService } from '../../services/ProposalService'
import { GoogleService } from '../../services/GoogleService'
import { NotificationService } from '../../services/NotificationService'
import { ReportGeneratorService } from '../../services/ReportGeneratorService'
import { generateProposalPdfBuffer } from '../../utils/pdf'
import { jsonToCsv } from '../../utils/csv'
import { 
  sendBackupEmail,
  sendProposalEmail,
  sendWelcomeEmail,
  sendCreditPurchaseEmail,
  sendPlanActivationEmail,
  sendPlanCancellationEmail,
  sendCartRecoveryEmail
} from '../../utils/email'
import { uploadToCloudinary } from '../../utils/cloudinary'
import { sanitizeError } from '../../utils/error-handler'

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

  // Validação de Segurança via SDK — obrigatória (antes de qualquer conexão/operação)
  if (!config.qstashCurrentSigningKey || !config.qstashNextSigningKey) {
    console.error('[QStash Webhook] Chaves de assinatura QStash não configuradas.')
    throw createError({ statusCode: 500, statusMessage: 'QStash signing keys not configured' })
  }

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

  // Garantir conexão com MongoDB só depois de assinatura validada
  if (mongoose.connection.readyState !== 1) {
    console.warn(`[QStash Webhook] MongoDB state is ${mongoose.connection.readyState}. Operation [${action}] might fail.`)
    // Se estiver desconectado, tentamos forçar a conexão (útil em cold starts severos)
    if (mongoose.connection.readyState === 0) {
      const uri = config.mongodbUri || process.env.MONGODB_URI
      if (uri) await mongoose.connect(uri)
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

      case 'SEND_EMAIL_WELCOME':
        await handleSendEmailWelcome(body)
        break

      case 'SEND_EMAIL_BUY_CREDIT':
        await handleSendEmailBuyCredit(body)
        break

      case 'SEND_EMAIL_PLAN_ACTIVATION':
        await handleSendEmailPlanActivation(body)
        break

      case 'SEND_EMAIL_PLAN_CANCELLATION':
        await handleSendEmailPlanCancellation(body)
        break

      case 'SEND_EMAIL_CART_RECOVERY':
        await handleSendEmailCartRecovery(body)
        break

      case 'REGISTER_AUDIT_LOG':
        await handleRegisterAuditLog(body)
        break

      case 'GENERATE_BACKUP_CSV':
        await handleGenerateBackupCsv(body)
        break

      case 'GENERATE_REPORT':
        await ReportGeneratorService.handleGenerateReport(body)
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
    throw sanitizeError(error, 'Erro ao processar job em segundo plano')
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

  const [clients, proposals, catalog, reports] = await Promise.all([
    Client.find({ profileId }).lean(),
    Proposal.find({ profileId }).lean(),
    CatalogItem.find({ profileId }).lean(),
    Report.find({ profileId }).lean()
  ])

  const zip = new JSZip()
  zip.file('clientes.csv', jsonToCsv(clients))
  zip.file('orcamentos.csv', jsonToCsv(proposals))
  zip.file('catalogo.csv', jsonToCsv(catalog))
  zip.file('relatorios.csv', jsonToCsv(reports))

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

  // 1. Declaramos a variável aqui fora com escopo amplo
  let uploadResult: { url: string; public_id: string, size: number, created_at: string } | null = null

  try {
    console.log(`[Job] Iniciando upload do ZIP para o Cloudinary...`)
    
    // 2. Atribuímos o resultado sem o "const" para não criar um novo escopo interno
    uploadResult = await uploadToCloudinary(zipBuffer, {
      targetFolder: 'backups',
      resourceType: 'raw',
      publicId: `backup-${profileId}-${Date.now()}.zip`
    })

    console.log(`[Job] Backup salvo no Cloudinary com sucesso! URL: ${uploadResult.url}`)
  } catch (cloudinaryError) {
    console.error(`[Job][Erro] Falha ao enviar ZIP para o Cloudinary:`, cloudinaryError)
  }
  
  // 3. Só envia o e-mail se o upload de fato deu certo e temos a URL
  if (uploadResult && uploadResult.url) {
    await sendBackupEmail(profile.email, profile.name, uploadResult)
    console.log(`[Job] Backup CSV enviado para e-mail: ${profile.email}`)
  } else {
    console.error(`[Job][Abortado] E-mail de backup não enviado pois o upload falhou.`)
  }
}
async function handleProposalAccepted(payload: any) {
  const { proposalId } = payload

  const proposal = await Proposal.findById(proposalId).populate('profileId')
  if (!proposal) throw new Error(`Proposta ${proposalId} não encontrada`)

  const profile: any = proposal.profileId
  if (!profile?.googleIntegration?.refreshToken) return

  console.log(`[Job] Iniciando automação Google para: ${proposal.code}`)
  
  const auth = GoogleService.getAuthClient(profile)

  // Garantir pasta raiz do app
  const rootFolderId = await GoogleService.ensureFolder(auth, profile)

  // Garantir sub-pasta "Propostas" dentro da raiz
  const proposalsFolderId = await GoogleService.ensureProposalsFolder(auth, profile, rootFolderId!)

  // Garantir sub-pasta do cliente dentro de "Propostas"
  const clientFolderId = await GoogleService.ensureClientFolder(auth, proposalsFolderId, proposal.client.name)

  const pdfBuffer = await generateProposalPdfBuffer(proposal, profile)
  const fileName = `Proposta-${proposal.code}-${proposal.client.name}.pdf`
  const driveFile = await GoogleService.uploadPdf(auth, clientFolderId, fileName, pdfBuffer)

  // Salvar referência do Drive na proposta para evitar regerar o PDF no download
  await Proposal.findByIdAndUpdate(proposalId, {
    driveFileId: driveFile.id,
    driveWebViewLink: driveFile.webViewLink
  })

  if (proposal.executionDate) {
    await ProposalService.ensureApplicationCalendarEvent(proposal, profile)
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
  console.log(`[Job] Enviando e-mail de proposta para: ${clientEmail}`)
  
  const emailRes = await sendProposalEmail(clientEmail, clientName, url, profileName)

  if (proposalId) {
    const proposal = await Proposal.findById(proposalId)
    if (proposal) {
      if (emailRes) {
        await Proposal.findByIdAndUpdate(proposalId, { lastEmailId: emailRes.id })
      }
      try {
        await NotificationService.createNotification({
          profileId: proposal.profileId.toString(),
          type: 'proposal_sent',
          title: 'E-mail de Orçamento Enviado',
          summary: `Proposta #${proposal.code} enviada com sucesso para ${clientEmail}.`,
          details: {
            proposalId: proposal._id.toString(),
            code: proposal.code,
            title: proposal.title,
            clientName,
            clientEmail,
            url,
            sentAt: new Date().toISOString()
          },
          metadata: {
            proposalId: proposal._id.toString(),
            code: proposal.code
          }
        })
      } catch (notifErr) {
        console.error(`[QStash Webhook] Erro ao criar notificação de e-mail enviado:`, notifErr)
      }
    }
  }
}

async function handleSendEmailWelcome(payload: any) {
  const { userEmail, userName } = payload
  console.log(`[Job] Enviando e-mail de boas-vindas para: ${userEmail}`)
  await sendWelcomeEmail(userEmail, userName)
}

async function handleSendEmailBuyCredit(payload: any) {
  const { userEmail, userName, creditsAdded, newBalance, amountPaid } = payload
  console.log(`[Job] Enviando e-mail de compra de créditos para: ${userEmail}`)
  await sendCreditPurchaseEmail(userEmail, userName, creditsAdded, newBalance, amountPaid)
}

async function handleSendEmailPlanActivation(payload: any) {
  const { userEmail, userName, planName, credits, planPrice, billingCycle } = payload
  console.log(`[Job] Enviando e-mail de ativação de plano para: ${userEmail}`)
  await sendPlanActivationEmail(userEmail, userName, planName, credits, planPrice, billingCycle)
}

async function handleSendEmailPlanCancellation(payload: any) {
  const { userEmail, userName, planName, cancellationDate, effectiveEndDate } = payload
  console.log(`[Job] Enviando e-mail de cancelamento de plano para: ${userEmail}`)
  await sendPlanCancellationEmail(userEmail, userName, planName, cancellationDate, effectiveEndDate)
}

async function handleSendEmailCartRecovery(payload: any) {
  const { userEmail, checkoutUrl } = payload
  console.log(`[Job] Enviando e-mail de recuperação de carrinho para: ${userEmail}`)
  await sendCartRecoveryEmail(userEmail, checkoutUrl)
}
