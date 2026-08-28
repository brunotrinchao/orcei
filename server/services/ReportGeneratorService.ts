import { Profile } from '../models/Profile'
import { Report } from '../models/Report'
import { AIService } from './AIService'
import { NotificationService } from './NotificationService'
import { GoogleService } from './GoogleService'
import { chargeCredit } from '../utils/credits'
import { generateReportPdfBuffer, buildReportFilename } from '../utils/pdf'

export const ReportGeneratorService = {
  async handleGenerateReport(payload: any) {
    const { profileId, prompt, context, cost, isAdmin, start, end, periodFormatted } = payload

    const profile = await Profile.findById(profileId)
    if (!profile) throw new Error(`Perfil ${profileId} não encontrado para geração de relatório`)

    console.log(`[Job] Gerando relatório estratégico IA para o perfil: ${profile._id}`)
    const analysis = await AIService.generateDescription(prompt, 8192, { profileId: profile._id.toString(), action: 'analyzeReport', cost })

    // Save report to database
    const newReport = await Report.create({
      profileId: profile._id,
      content: analysis,
      score: context.commercialScore,
      context: {
        totalProposals: context.totalProposals,
        totalRevenue: context.totalRevenue,
        score: context.commercialScore,
        period: periodFormatted
      }
    })

    // Dedução de crédito SOMENTE após relatório gerado e salvo com sucesso (atômica)
    await chargeCredit(profile._id, cost, isAdmin, {
      aiUsageField: 'aiUsage.reports',
      errorMessage: 'Saldo de créditos insuficiente. Adquira créditos para gerar relatórios com IA.'
    })

    // Gerar PDF do relatório via motor unificado e enviar para o Google Drive (se integrado)
    if (profile.googleIntegration?.refreshToken) {
      try {
        const config = useRuntimeConfig()
        const pdfBuffer = await generateReportPdfBuffer(newReport, profile, config.appName || 'ORCEI')
        const auth = GoogleService.getAuthClient(profile)
        const rootFolderId = await GoogleService.ensureFolder(auth, profile)
        const reportsFolderId = await GoogleService.ensureReportsFolder(auth, profile, rootFolderId)

        const startDate = start ? new Date(start as string) : new Date(Date.now() - 30 * 86400000)
        const endDate = end ? new Date(end as string) : new Date()
        const fileName = buildReportFilename(startDate, endDate, newReport._id.toString())

        const driveFile = await GoogleService.uploadPdf(auth, reportsFolderId, fileName, pdfBuffer)
        
        await Report.findByIdAndUpdate(newReport._id, {
          driveFileId: driveFile.id,
          driveWebViewLink: driveFile.webViewLink
        })
        console.log(`[Job] Relatório enviado para a pasta Relatórios no Google Drive: ${fileName}`)
      } catch (driveErr) {
        console.error(`[Job] Erro ao enviar relatório para o Google Drive:`, driveErr)
      }
    }

    // Notificar usuário na Central de Notificações
    try {
      await NotificationService.createNotification({
        profileId: profile._id.toString(),
        type: 'report_generated',
        title: 'Relatório IA Concluído',
        summary: `Sua análise estratégica de IA (${periodFormatted}) foi concluída com sucesso!`,
        details: {
          reportId: newReport._id.toString(),
          content: analysis,
          period: periodFormatted,
          totalProposals: context.totalProposals,
          totalRevenue: context.totalRevenue,
          generatedAt: new Date().toISOString()
        },
        metadata: {
          reportId: newReport._id.toString()
        }
      })
    } catch (notifErr) {
      console.error('[Job] Erro ao emitir notificação de relatório gerado:', notifErr)
    }

    return { text: analysis, reportId: newReport._id }
  }
}
