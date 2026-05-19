import puppeteer from 'puppeteer'
import { Proposal } from '../../../models/Proposal'
import { Profile } from '../../../models/Profile'
import { generateProposalHtml } from '../../../utils/pdf'

export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string }
  const session = await getUserSession(event)

  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  const proposal = await Proposal.findById(id).lean()
  if (!proposal) {
    throw createError({ statusCode: 404, statusMessage: 'Proposta não encontrada' })
  }

  const profile = await Profile.findOne({ userId: (session.user as any).id }).lean()
  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })
  }

  const config = useRuntimeConfig()
  const htmlContent = generateProposalHtml(proposal, profile, config.appName)

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setContent(htmlContent)
  const pdf = await page.pdf({ format: 'A4', printBackground: true })
  await browser.close()

  event.node.res.setHeader('Content-Type', 'application/pdf')
  event.node.res.setHeader('Content-Disposition', `attachment; filename=proposta-${proposal.slug}.pdf`)
  
  return pdf
})
