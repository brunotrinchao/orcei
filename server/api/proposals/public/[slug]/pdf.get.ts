import puppeteer from 'puppeteer'
import { Proposal } from '../../../../models/Proposal'
import { generateProposalHtml } from '../../../../utils/pdf'

export default defineEventHandler(async (event) => {
  const { slug } = event.context.params as { slug: string }

  const proposal = await Proposal.findOne({ slug }).populate('profileId').lean()
  if (!proposal) {
    throw createError({ statusCode: 404, statusMessage: 'Proposta não encontrada' })
  }

  const profile = (proposal as any).profileId
  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })
  }

  const htmlContent = generateProposalHtml(proposal, profile)

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setContent(htmlContent)
  const pdf = await page.pdf({ format: 'A4', printBackground: true })
  await browser.close()

  event.node.res.setHeader('Content-Type', 'application/pdf')
  event.node.res.setHeader('Content-Disposition', `attachment; filename=proposta-${proposal.slug}.pdf`)
  
  return pdf
})
