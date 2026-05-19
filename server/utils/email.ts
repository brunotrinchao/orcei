import { Resend } from 'resend'

export const sendProposalEmail = async (
  clientEmail: string,
  clientName: string,
  proposalUrl: string,
  professionalName: string
) => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[Resend] RESEND_API_KEY not set')
    return null
  }

  const resend = new Resend(apiKey)

  try {
    // Carregar template via Nitro Storage
    const storage = useStorage('assets:templates')
    const htmlTemplate = await storage.getItem('email/proposal.html')
    
    if (!htmlTemplate) {
      console.error('[Resend] Template not found in storage')
      return null
    }

    let html = htmlTemplate.toString()

    const config = useRuntimeConfig()
    const appName = config.appName || 'Orcei'
    const appLogo = config.appDocumentLogo

    // Substituir variáveis
    html = html
      .replace(/{{clientName}}/g, clientName)
      .replace(/{{professionalName}}/g, professionalName)
      .replace(/{{proposalUrl}}/g, proposalUrl)
      .replace(/{{appName}}/g, appName)
      .replace(/{{appLogo}}/g, appLogo || '')

    const recipient = process.env.RESEND_TEST_TO || clientEmail

    const { data, error } = await resend.emails.send({
      from: `${appName} <onboarding@resend.dev>`,
      to: recipient,
      subject: `${professionalName} preparou um orçamento para você`,
      html // Usando o HTML carregado e processado
    })

    if (error) {
      console.error('[Resend] API Error:', JSON.stringify(error))
      return null
    }

    console.log('[Resend] Email sent:', data?.id)
    return data
  } catch (err) {
    console.error('[Resend] Exception:', err)
    return null
  }
}
