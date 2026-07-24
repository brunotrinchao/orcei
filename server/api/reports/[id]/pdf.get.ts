import { Report } from '../../../models/Report'
import { Profile } from '../../../models/Profile'
import { generateReportPdfBuffer, buildReportFilename } from '../../../utils/pdf'
import { GoogleService } from '../../../services/GoogleService'

export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string }
  const session = await getUserSession(event)

  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  const profile = await Profile.findOne({ userId: (session.user as any).id }).lean()
  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })
  }

  // SEGURANÇA: Filtrar pelo ID do relatório E pelo profileId do usuário logado
  const report = await Report.findOne({ _id: id, profileId: profile._id }).lean()
  if (!report) {
    throw createError({ statusCode: 404, statusMessage: 'Relatório não encontrado' })
  }

  const config = useRuntimeConfig()
  let pdfBuffer: Buffer

  // Se o relatório tiver um driveFileId salvo e a integração do Google estiver ativa, baixar do Drive
  if (report.driveFileId && profile.googleIntegration?.refreshToken) {
    try {
      const auth = GoogleService.getAuthClient(profile)
      pdfBuffer = await GoogleService.downloadFile(auth, report.driveFileId)
    } catch (e) {
      console.warn(`[Report PDF] Falha ao baixar do Google Drive (${report.driveFileId}), compilando via motor unificado...`)
      pdfBuffer = await generateReportPdfBuffer(report, profile, config.appName || 'ORCEI')
    }
  } else {
    pdfBuffer = await generateReportPdfBuffer(report, profile, config.appName || 'ORCEI')
  }

  const filename = buildReportFilename(report.createdAt, report.createdAt, report._id.toString())

  event.node.res.setHeader('Content-Type', 'application/pdf')
  event.node.res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

  return pdfBuffer
})
