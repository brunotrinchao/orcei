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
    const config = useRuntimeConfig()
    const appName = config.appName || 'Orcei'
    const appLogo = config.appDocumentLogo
    const templateId = config.resendTemplateProposal

    const recipient = process.env.RESEND_TEST_TO || clientEmail

    const { data, error } = await resend.emails.send({
      from: `${appName} <onboarding@resend.dev>`,
      to: recipient,
      subject: `${professionalName} preparou um orçamento para você`,
      template: {
        id: templateId,
        variables: {
          clientName,
          professionalName,
          proposalUrl,
          appName,
          appLogo: appLogo || ''
        }
      }
    })

    if (error) {
      console.error('[Resend] API Error:', JSON.stringify(error))
      return null
    }

    console.log('[Resend] Email sent via template:', data?.id)
    return data
  } catch (err) {
    console.error('[Resend] Exception:', err)
    return null
  }
}
