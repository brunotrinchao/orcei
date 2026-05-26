import { processVariables } from './variables'
import sanitizeHtml from 'sanitize-html'

const sanitizeOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
    'nl', 'li', 'ins', 'del', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
    'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'span'
  ],
  allowedAttributes: {
    a: [ 'href', 'name', 'target' ],
    span: [ 'style', 'class' ],
    p: [ 'style', 'class' ],
    div: [ 'style', 'class' ],
    table: [ 'style', 'class' ],
    tr: [ 'style', 'class' ],
    td: [ 'style', 'class' ]
  },
  allowedStyles: {
    '*': {
      'text-align': [ /^left$/, /^right$/, /^center$/, /^justify$/ ],
      'color': [ /^#(?:[0-9a-fA-F]{3}){1,2}$/, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/ ],
      'background-color': [ /^#(?:[0-9a-fA-F]{3}){1,2}$/, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/ ],
      'font-size': [ /^\d+(?:px|em|rem|%)$/ ],
      'font-weight': [ /^bold$/, /^normal$/, /^\d+$/ ],
      'padding-left': [ /^\d+(?:px|em|rem|%)$/ ]
    }
  }
}

export async function generateProposalPdfBuffer(proposal: any, profile: any, appName: string = 'ORCEI') {
  const htmlContent = generateProposalHtml(proposal, profile, appName)
  
  let browser
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL
  
  if (isProd) {
    const puppeteerCore = await import('puppeteer-core').then(m => m.default || m)
    const chromium = await import('@sparticuz/chromium').then(m => m.default || m)
    
    browser = await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    })
  } else {
    const puppeteer = await import('puppeteer').then(m => m.default || m)
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  }

  const page = await browser.newPage()
  await page.setContent(htmlContent)
  const pdf = await page.pdf({ format: 'A4', printBackground: true })
  await browser.close()
  return pdf
}

export function generateProposalHtml(proposal: any, profile: any, appName: string = 'ORCEI') {
  // Processar variáveis e sanitizar contra injeção de script
  const contractHtml = sanitizeHtml(processVariables(proposal.contractText || '', proposal, profile), sanitizeOptions)
  const termsHtml = sanitizeHtml(processVariables(proposal.termsAndConditions || '', proposal, profile), sanitizeOptions)

  const logoHtml = process.env.APP_DOCUMENT_LOGO 
    ? `<img src="${process.env.APP_DOCUMENT_LOGO}" width="150" height="108">` 
    : appName.toUpperCase()

  return `
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
        .prose h2 { font-size: 20px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">${logoHtml}</div>
        <div style="text-align: right">
          <div style="font-weight: bold">${profile.name}</div>
          <div style="font-size: 12px; color: #666">${profile.email}</div>
          ${profile.address?.street ? `
            <div style="font-size: 10px; color: #999; margin-top: 4px;">
              ${profile.address.street}, ${profile.address.number || ''} - ${profile.address.neighborhood || ''}<br>
              ${profile.address.city || ''}/${profile.address.state || ''} - ${profile.address.zip || ''}
            </div>
          ` : ''}
        </div>
      </div>

      <div class="title">Orçamento Comercial</div>
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
          ${proposal.items.map((item: any) => `
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
        <div class="total-label">Valor Total (${proposal.paymentConfig?.method === 'cash' ? 'À Vista' : `Parcelado em ${proposal.paymentConfig?.installments || 1}x`})</div>
        <div class="total-value">R$ ${proposal.totals.final.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        ${proposal.paymentConfig?.method === 'cash' && proposal.paymentConfig.cashDiscount > 0 ? `
          <div style="font-size: 10px; color: #059669; font-weight: bold; margin-top: 4px;">
            Desconto de ${proposal.paymentConfig.cashDiscount}% aplicado para pagamento à vista
          </div>
        ` : ''}
        ${proposal.paymentConfig?.method === 'credit_card' && (proposal.paymentConfig.installments || 1) > 1 ? `
          <div style="font-size: 10px; color: #6b7280; margin-top: 4px;">
            ${proposal.paymentConfig.installments}x de R$ ${(proposal.totals.final / proposal.paymentConfig.installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        ` : ''}
      </div>

      <div class="contract prose">
        ${contractHtml}
      </div>

      <div class="page-break"></div>

      <div class="terms prose">
        <div class="section-title">Termos e Condições</div>
        ${termsHtml}
      </div>
    </body>
    </html>
  `
}

export function generateReportHtml(report: any, profile: any, appName: string = 'Orcei') {
  const logoHtml = process.env.APP_DOCUMENT_LOGO 
    ? `<img src="${process.env.APP_DOCUMENT_LOGO}" width="150" height="108">` 
    : appName.toUpperCase()

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; margin-bottom: 40px; }
        .logo { font-size: 24px; font-weight: bold; color: #3B82F6; }
        .title { font-size: 28px; font-weight: 900; margin-bottom: 10px; }
        .date { font-size: 14px; color: #6b7280; margin-bottom: 40px; }
        .content { margin-top: 20px; }
        .content h1, .content h2, .content h3 { color: #3B82F6; margin-top: 30px; }
        .content p { margin-bottom: 15px; }
        .content ul { margin-bottom: 15px; }
        .footer { margin-top: 50px; border-top: 1px solid #eee; pt-20px; font-size: 10px; color: #999; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">${logoHtml}</div>
        <div style="text-align: right">
          <div style="font-weight: bold">${profile.name}</div>
          <div style="font-size: 12px; color: #666">${profile.email}</div>
        </div>
      </div>

      <div class="title">Relatório Estratégico IA</div>
      <div class="date">Gerado em: ${new Date(report.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</div>

      <div class="content">
        ${sanitizeHtml(report.contentHtml, sanitizeOptions)}
      </div>

      <div class="footer">
        Este relatório foi gerado automaticamente pela Inteligência Artificial do ${appName}.<br>
        © 2026 ${appName} - Todos os direitos reservados.
      </div>
    </body>
    </html>
  `
}
