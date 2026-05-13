import puppeteer from 'puppeteer'
import { Proposal } from '../../../models/Proposal'
import { Profile } from '../../../models/Profile'
import { processVariables } from '../../../utils/variables'

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

  const profile = await Profile.findOne({ userId: session.user.id }).lean()
  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })
  }

  // Processar variáveis
  const contractHtml = processVariables(proposal.contractText || '', proposal, profile)
  const termsHtml = processVariables(proposal.termsAndConditions || '', proposal, profile)

  // Gerar HTML para o PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; margin-bottom: 40px; }
        .logo { font-size: 24px; font-weight: bold; color: #3B82F6; }
        .title { font-size: 28px; font-weight: 900; margin-bottom: 10px; }
        .client-info { margin-bottom: 40px; }
        .section-title { font-size: 18px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { text-align: left; background: #f9fafb; padding: 12px; border-bottom: 1px solid #eee; }
        td { padding: 12px; border-bottom: 1px solid #eee; }
        .total-box { background: #f3f4f6; padding: 20px; border-radius: 12px; text-align: right; margin-top: 40px; }
        .total-label { font-size: 14px; color: #6b7280; }
        .total-value { font-size: 24px; font-weight: bold; }
        .page-break { page-break-before: always; }
        .contract, .terms { margin-top: 40px; }
        .contract h2, .terms h2 { color: #3B82F6; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">ORCEI</div>
        <div style="text-align: right">
          <div style="font-weight: bold">${profile.name}</div>
          <div style="font-size: 12px; color: #666">${profile.email}</div>
        </div>
      </div>

      <div class="title">Proposta de Orçamento</div>
      <div class="client-info">
        <strong>Para:</strong> ${proposal.client.name}<br>
        <strong>E-mail:</strong> ${proposal.client.email}
      </div>

      <div class="section-title">Serviços Detalhados</div>
      <table>
        <thead>
          <tr>
            <th>Serviço</th>
            <th>Qtd</th>
            <th>Preço</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${proposal.items.map(item => `
            <tr>
              <td>
                <div style="font-weight: bold">${item.name}</div>
                <div style="font-size: 12px; color: #666">${item.description}</div>
              </td>
              <td>${item.quantity}</td>
              <td>R$ ${item.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              <td>R$ ${(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total-box">
        <div class="total-label">Valor Total</div>
        <div class="total-value">R$ ${proposal.totals.final.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
      </div>

      <div class="contract">
        ${contractHtml}
      </div>

      <div class="page-break"></div>

      <div class="terms">
        <div class="section-title">Termos e Condições</div>
        ${termsHtml}
      </div>
    </body>
    </html>
  `

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setContent(htmlContent)
  const pdf = await page.pdf({ format: 'A4', printBackground: true })
  await browser.close()

  event.node.res.setHeader('Content-Type', 'application/pdf')
  event.node.res.setHeader('Content-Disposition', `attachment; filename=proposta-${proposal.slug}.pdf`)
  
  return pdf
})
