import puppeteer from 'puppeteer'
import MarkdownIt from 'markdown-it'
import { Report } from '../../../models/Report'
import { Profile } from '../../../models/Profile'
import { generateReportHtml } from '../../../utils/pdf'

export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string }
  const session = await getUserSession(event)

  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  const report = await Report.findById(id).lean()
  if (!report) {
    throw createError({ statusCode: 404, statusMessage: 'Relatório não encontrado' })
  }

  const profile = await Profile.findOne({ userId: (session.user as any).id }).lean()
  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })
  }

  const md = new MarkdownIt({ html: true })
  const contentHtml = md.render(report.content)

  const config = useRuntimeConfig()
  const htmlContent = generateReportHtml({ ...report, contentHtml }, profile, config.appName)

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setContent(htmlContent)
  const pdf = await page.pdf({ format: 'A4', printBackground: true })
  await browser.close()

  event.node.res.setHeader('Content-Type', 'application/pdf')
  event.node.res.setHeader('Content-Disposition', `attachment; filename=relatorio-estratégico-${id}.pdf`)
  
  return pdf
})
