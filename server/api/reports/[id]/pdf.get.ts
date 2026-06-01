import MarkdownIt from 'markdown-it'
import { Report } from '../../../models/Report'
import { Profile } from '../../../models/Profile'
import { generateReportHtml, generatePdfFromHtml } from '../../../utils/pdf'

export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string }
  const session = await getUserSession(event)

  if (!session.user) {
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

  const md = new MarkdownIt({ html: true })
  const contentHtml = md.render(report.content)

  const config = useRuntimeConfig()
  const htmlContent = generateReportHtml({ ...report, contentHtml }, profile, config.appName)

  const pdf = await generatePdfFromHtml(htmlContent)

  event.node.res.setHeader('Content-Type', 'application/pdf')
  event.node.res.setHeader('Content-Disposition', `attachment; filename=relatorio-estratégico-${id}.pdf`)

  return pdf
})
