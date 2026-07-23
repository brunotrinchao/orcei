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

/**
 * Converte uma URL de imagem remota para um data URI base64.
 * Necessário porque o Puppeteer bloqueia carregamento de URLs externas
 * nos templates de headerTemplate/footerTemplate.
 */
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const contentType = response.headers.get('content-type') || 'image/png'
    return `data:${contentType};base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
}

export async function buildPdfHeaderHtml(profile: any, appName: string = 'ORCEI'): Promise<string> {
  const logoUrl = profile?.brandConfig?.logoUrl || process.env.APP_DOCUMENT_LOGO
  let logoContent: string

  if (logoUrl) {
    const dataUri = await fetchImageAsBase64(logoUrl)
    logoContent = dataUri
      ? `<img src="${dataUri}" style="max-height: 42px; width: auto; object-fit: contain;">`
      : `<span style="font-size: 18px; font-weight: 900; color: #3B82F6; letter-spacing: -0.025em;">${appName.toUpperCase()}</span>`
  } else {
    logoContent = `<span style="font-size: 18px; font-weight: 900; color: #3B82F6; letter-spacing: -0.025em;">${appName.toUpperCase()}</span>`
  }

  const companyName = profile?.company?.tradeName || profile?.company?.legalName || profile?.name || appName
  const email = profile?.email || ''
  
  const addressParts: string[] = []
  if (profile?.address?.street) {
    addressParts.push(`${profile.address.street}${profile.address.number ? `, ${profile.address.number}` : ''}`)
  }
  if (profile?.address?.neighborhood) addressParts.push(profile.address.neighborhood)
  if (profile?.address?.city || profile?.address?.state) {
    addressParts.push(`${profile.address.city || ''}/${profile.address.state || ''}`)
  }
  if (profile?.address?.zip) addressParts.push(`CEP: ${profile.address.zip}`)
  const addressStr = addressParts.join(' - ')

  const taxIdStr = profile?.company?.taxId ? `CNPJ/CPF: ${profile.company.taxId}` : ''

  return `
    <style>
      html { -webkit-print-color-adjust: exact; }
      .pdf-header-container {
        width: 100%;
        margin: 0 40px;
        padding-bottom: 10px;
        border-bottom: 2px solid #3B82F6;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: system-ui, -apple-system, sans-serif;
      }
      .pdf-header-info {
        text-align: right;
        font-size: 9px;
        color: #4B5563;
        line-height: 1.3;
      }
      .pdf-header-title {
        font-weight: 800;
        font-size: 11px;
        color: #111827;
      }
    </style>
    <div class="pdf-header-container">
      <div>${logoContent}</div>
      <div class="pdf-header-info">
        <div class="pdf-header-title">${companyName}</div>
        <div>${email} ${taxIdStr ? `· ${taxIdStr}` : ''}</div>
        ${addressStr ? `<div>${addressStr}</div>` : ''}
      </div>
    </div>
  `
}

export async function buildPdfFooterHtml(profile: any, appName: string = 'ORCEI'): Promise<string> {
  const logoUrl = profile?.brandConfig?.logoUrl || process.env.APP_DOCUMENT_LOGO

  let logoHtml: string
  if (logoUrl) {
    const dataUri = await fetchImageAsBase64(logoUrl)
    logoHtml = dataUri
      ? `<img src="${dataUri}" style="height: 14px; width: auto; vertical-align: middle; margin-right: 6px; object-fit: contain;">`
      : `<strong style="color: #3B82F6; margin-right: 6px; font-size: 9px;">${appName.toUpperCase()}</strong>`
  } else {
    logoHtml = `<strong style="color: #3B82F6; margin-right: 6px; font-size: 9px;">${appName.toUpperCase()}</strong>`
  }

  const social = profile?.contact?.social || {}
  const socialParts: string[] = []
  if (social.instagram) socialParts.push(`Instagram: ${social.instagram}`)
  if (social.facebook) socialParts.push(`Facebook: ${social.facebook}`)
  if (social.twitter) socialParts.push(`X: ${social.twitter}`)
  if (social.youtube) socialParts.push(`YouTube: ${social.youtube}`)
  const socialStr = socialParts.join(' · ')

  const phones = profile?.contact?.phones || []
  const phoneNumbers = phones.map((p: any) => p.number).filter(Boolean)
  const phoneStr = phoneNumbers.length ? `Tel: ${phoneNumbers.join(', ')}` : ''

  const contactItems = [socialStr, phoneStr].filter(Boolean).join(' · ')
  const line1Content = contactItems ? `${logoHtml} ${contactItems}` : logoHtml

  return `
    <style>
      html { -webkit-print-color-adjust: exact; }
      .pdf-footer-container {
        width: 100%;
        margin: 0 40px;
        padding-top: 6px;
        border-top: 1px solid #E5E7EB;
        font-family: system-ui, -apple-system, sans-serif;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
      }
      .pdf-footer-line1 {
        font-size: 8px;
        color: #374151;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
      }
      .pdf-footer-line2 {
        font-size: 7.5px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #9CA3AF;
      }
    </style>
    <div class="pdf-footer-container">
      <div class="pdf-footer-line1">${line1Content}</div>
      <div class="pdf-footer-line2">Powered by Orcei Fácil · orceifacil.com.br</div>
    </div>
  `
}

export async function generateProposalPdfBuffer(proposal: any, profile: any, appName: string = 'ORCEI') {
  const htmlContent = generateProposalHtml(proposal, profile, appName)
  const [headerTemplate, footerTemplate] = await Promise.all([
    buildPdfHeaderHtml(profile, appName),
    buildPdfFooterHtml(profile, appName)
  ])
  
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
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate,
    footerTemplate,
    margin: { top: '120px', bottom: '80px', left: '40px', right: '40px' }
  })
  await browser.close()
  return pdf
}

export async function generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
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
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '40px', bottom: '40px', left: '40px', right: '40px' }
  })
  await browser.close()
  return pdf as Buffer
}

export function generateProposalHtml(proposal: any, profile: any, appName: string = 'ORCEI') {
  // Processar variáveis e sanitizar contra injeção de script
  const contractHtml = sanitizeHtml(processVariables(proposal.contractText || '', proposal, profile), sanitizeOptions)
  const termsHtml = sanitizeHtml(processVariables(proposal.termsAndConditions || '', proposal, profile), sanitizeOptions)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: sans-serif; padding: 10px 0; color: #333; line-height: 1.6; font-size: 13px; }
        .title { font-size: 26px; font-weight: 900; margin-bottom: 10px; color: #1E3A8A; }
        .client-info { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 16px; border-radius: 8px; margin-bottom: 25px; }
        .section-title { font-size: 16px; font-weight: bold; border-bottom: 2px solid #E2E8F0; padding-bottom: 5px; margin-top: 25px; margin-bottom: 15px; color: #1E3A8A; text-transform: uppercase; tracking: 0.05em; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        th { text-align: left; background: #F1F5F9; padding: 10px 12px; border-bottom: 2px solid #CBD5E1; font-size: 11px; text-transform: uppercase; color: #475569; }
        td { padding: 10px 12px; border-bottom: 1px solid #E2E8F0; }
        .total-box { background: #F1F5F9; padding: 16px 20px; border-radius: 8px; text-align: right; margin-top: 25px; border-left: 4px solid #3B82F6; }
        .total-label { font-size: 12px; color: #64748B; font-weight: bold; text-transform: uppercase; }
        .total-value { font-size: 22px; font-weight: 900; color: #0F172A; }
        .page-break { page-break-before: always; break-before: page; margin-top: 0; }
        .contract, .terms { margin-top: 20px; }
        .contract h2, .terms h2 { color: #1E3A8A; margin-top: 15px; font-size: 18px; }
        .prose p { margin-bottom: 12px; }
      </style>
    </head>
    <body>
      <div class="title">Orçamento Comercial</div>
      
      <div class="client-info">
        <div style="display: flex; justify-content: space-between;">
          <div>
            <strong>Para:</strong> ${proposal.client.name}<br>
            <strong>E-mail:</strong> ${proposal.client.email}<br>
            ${proposal.client.phone ? `<strong>Telefone:</strong> ${proposal.client.phone}` : ''}
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748B;">
            <strong>Código:</strong> ${proposal.code}<br>
            <strong>Data:</strong> ${new Date(proposal.createdAt).toLocaleDateString('pt-BR')}<br>
            ${proposal.executionDate ? `<strong>Data de Execução:</strong> ${new Date(proposal.executionDate).toLocaleDateString('pt-BR')}` : ''}
          </div>
        </div>
      </div>

      <div class="section-title">Serviços Detalhados</div>
      <table>
        <thead>
          <tr>
            <th>Serviço</th>
            <th style="width: 50px; text-align: center;">Qtd</th>
            <th style="width: 110px; text-align: right;">Preço Unit.</th>
            <th style="width: 110px; text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${proposal.items.map((item: any) => `
            <tr>
              <td>
                <div style="font-weight: bold; color: #1E293B;">${item.name}</div>
                ${item.description ? `<div style="font-size: 11px; color: #64748B; margin-top: 2px;">${item.description}</div>` : ''}
              </td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: right;">R$ ${item.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              <td style="text-align: right; font-weight: bold;">R$ ${(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total-box">
        <div class="total-label">Valor Total (${proposal.paymentConfig?.method === 'cash' ? 'À Vista' : `Parcelado em ${proposal.paymentConfig?.installments || 1}x`})</div>
        <div class="total-value">R$ ${proposal.totals.final.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        ${proposal.paymentConfig?.method === 'cash' && proposal.paymentConfig.cashDiscount > 0 ? `
          <div style="font-size: 11px; color: #059669; font-weight: bold; margin-top: 4px;">
            Desconto de ${proposal.paymentConfig.cashDiscount}% aplicado para pagamento à vista
          </div>
        ` : ''}
        ${proposal.paymentConfig?.method === 'credit_card' && (proposal.paymentConfig.installments || 1) > 1 ? `
          <div style="font-size: 11px; color: #64748B; margin-top: 4px;">
            ${proposal.paymentConfig.installments}x de R$ ${(proposal.totals.final / proposal.paymentConfig.installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        ` : ''}
      </div>

      ${contractHtml ? `
        <div class="page-break"></div>
        <div class="contract prose">
          ${contractHtml.toLowerCase().includes('contrato') ? '' : '<div class="section-title">Contrato de Prestação de Serviços</div>'}
          ${contractHtml}
        </div>
      ` : ''}

      <div class="page-break"></div>

      <div class="terms prose">
        <div class="section-title">Termos e Condições</div>
        ${termsHtml}
      </div>
    </body>
    </html>
  `
}

function buildSocialLinksHtml(social: any) {
  if (!social) return ''
  const links: { label: string; url: string }[] = []
  if (social.instagram) links.push({ label: `Instagram: ${social.instagram}`, url: `https://instagram.com/${String(social.instagram).replace('@', '')}` })
  if (social.facebook) links.push({ label: `Facebook: ${social.facebook}`, url: `https://facebook.com/${String(social.facebook).replace('@', '')}` })
  if (social.twitter) links.push({ label: `X (Twitter): ${social.twitter}`, url: `https://x.com/${String(social.twitter).replace('@', '')}` })
  if (social.youtube) links.push({ label: `YouTube: ${social.youtube}`, url: `https://youtube.com/${String(social.youtube).replace('@', '')}` })

  if (!links.length) return ''

  return `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
      <div style="font-size: 10px; color: #999; letter-spacing: 0.1em; text-transform: uppercase; font-weight: bold; margin-bottom: 8px;">Redes Sociais</div>
      <div style="font-size: 11px; color: #3B82F6;">
        ${links.map(l => `<a href="${l.url}" style="color: #3B82F6; text-decoration: none; margin: 0 8px;">${l.label}</a>`).join(' · ')}
      </div>
    </div>
  `
}

export function generateReportHtml(report: any, profile: any, appName: string = 'Orcei') {
  const logoUrl = profile?.brandConfig?.logoUrl || process.env.APP_DOCUMENT_LOGO
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" width="150" height="108">`
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
        Este relatório foi gerado automaticamente pela Inteligência Artificial do ${appName} e pode conter equívocos — valide as informações antes de tomar decisões críticas.<br>
        © 2026 ${appName} - Todos os direitos reservados.
      </div>
    </body>
    </html>
  `
}
