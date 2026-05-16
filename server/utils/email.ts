import { Resend } from 'resend'
import fs from 'node:fs'
import path from 'node:path'

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
    // Carregar template
    const templatePath = path.resolve('server/templates/email/proposal.html')
    let html = fs.readFileSync(templatePath, 'utf-8')

    // Substituir variáveis
    html = html
      .replace(/{{clientName}}/g, clientName)
      .replace(/{{professionalName}}/g, professionalName)
      .replace(/{{proposalUrl}}/g, proposalUrl)

    const recipient = process.env.RESEND_TEST_TO || clientEmail

    const { data, error } = await resend.emails.send({
      from: 'Orcei <onboarding@resend.dev>',
      to: recipient,
      subject: `${professionalName} preparou um orçamento para você`,
      template: {
        id: 'proposta', // ID do seu template
        variables: {
          clientName: clientName,
          professionalName: professionalName,
          proposalUrl: proposalUrl
        },
      },
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
