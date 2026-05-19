import { Resend } from 'resend'

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[Resend] RESEND_API_KEY not set')
    return null
  }
  return new Resend(apiKey)
}

const getEmailConfig = () => {
  const config = useRuntimeConfig()
  return {
    appName: config.appName || 'Orcei',
    appLogo: config.appDocumentLogo || '',
    appUrl: process.env.PUBLIC_URL || 'https://orceifacil.com.br',
    resendTestTo: process.env.RESEND_TEST_TO,
    templates: {
      proposal: config.resendTemplateProposal,
      welcome: config.resendTemplateWelcome,
      backup: config.resendTemplateBackup,
      assignPlan: config.resendTemplateAssignPlan,
      buyCredit: config.resendTemplateBuyCredit,
      cancelPlan: config.resendTemplateCancelPlan
    }
  }
}

export const sendProposalEmail = async (
  clientEmail: string,
  clientName: string,
  proposalUrl: string,
  professionalName: string
) => {
  const resend = getResend()
  if (!resend) return null

  try {
    const { appName, appLogo, appUrl, resendTestTo, templates } = getEmailConfig()
    const recipient = resendTestTo || clientEmail

    const { data, error } = await resend.emails.send({
      from: `${appName} <contato@orceifacil.com.br>`,
      to: recipient,
      subject: `${professionalName} preparou um orçamento para você`,
      template: {
        id: templates.proposal,
        variables: {
          clientName,
          professionalName,
          proposalUrl,
          appName,
          appLogo,
          appUrl
        }
      }
    })

    if (error) {
      console.error('[Resend] Proposal Email Error:', JSON.stringify(error))
      return null
    }

    return data
  } catch (err) {
    console.error('[Resend] Proposal Email Exception:', err)
    return null
  }
}

export const sendWelcomeEmail = async (userEmail: string, userName: string) => {
  const resend = getResend()
  if (!resend) return null

  try {
    const { appName, appLogo, appUrl, resendTestTo, templates } = getEmailConfig()
    const recipient = resendTestTo || userEmail

    const { data, error } = await resend.emails.send({
      from: `${appName} <contato@orceifacil.com.br>`,
      to: recipient,
      subject: `Bem-vindo ao ${appName}!`,
      template: {
        id: templates.welcome,
        variables: {
          userName,
          appName,
          appLogo,
          appUrl
        }
      }
    })

    if (error) console.error('[Resend] Welcome Email Error:', JSON.stringify(error))
    return data
  } catch (err) {
    console.error('[Resend] Welcome Email Exception:', err)
    return null
  }
}

export const sendBackupEmail = async (userEmail: string, userName: string, backupJson: string) => {
  const resend = getResend()
  if (!resend) return null

  try {
    const { appName, appLogo, appUrl, resendTestTo, templates } = getEmailConfig()
    const recipient = resendTestTo || userEmail

    const { data, error } = await resend.emails.send({
      from: `${appName} <contato@orceifacil.com.br>`,
      to: recipient,
      subject: `Seu Backup de Dados - ${appName}`,
      template: {
        id: templates.backup,
        variables: {
          userName,
          appName,
          appLogo,
          appUrl
        }
      },
      attachments: [
        {
          filename: `backup-${appName.toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`,
          content: Buffer.from(backupJson).toString('base64')
        }
      ]
    })

    if (error) console.error('[Resend] Backup Email Error:', JSON.stringify(error))
    return data
  } catch (err) {
    console.error('[Resend] Backup Email Exception:', err)
    return null
  }
}

export const sendPlanActivationEmail = async (
  userEmail: string, 
  userName: string, 
  planName: string, 
  credits: number,
  planPrice: string,
  billingCycle: string
) => {
  const resend = getResend()
  if (!resend) return null

  try {
    const { appName, appLogo, appUrl, resendTestTo, templates } = getEmailConfig()
    const recipient = resendTestTo || userEmail

    const { data, error } = await resend.emails.send({
      from: `${appName} <contato@orceifacil.com.br>`,
      to: recipient,
      subject: `Seu Plano ${planName.toUpperCase()} está ativo!`,
      template: {
        id: templates.assignPlan,
        variables: {
          userName,
          planName,
          credits: credits === 9999 ? 'Ilimitados' : credits.toString(),
          planPrice,
          billingCycle, // 'Mensal' ou 'Anual'
          appName,
          appLogo,
          appUrl
        }
      }
    })

    if (error) console.error('[Resend] Plan Activation Email Error:', JSON.stringify(error))
    return data
  } catch (err) {
    console.error('[Resend] Plan Activation Email Exception:', err)
    return null
  }
}

export const sendCreditPurchaseEmail = async (
  userEmail: string, 
  userName: string, 
  creditsAdded: number, 
  newBalance: number,
  amountPaid: string
) => {
  const resend = getResend()
  if (!resend) return null

  try {
    const { appName, appLogo, appUrl, resendTestTo, templates } = getEmailConfig()
    const recipient = resendTestTo || userEmail

    const { data, error } = await resend.emails.send({
      from: `${appName} <contato@orceifacil.com.br>`,
      to: recipient,
      subject: `Seus créditos foram adicionados!`,
      template: {
        id: templates.buyCredit,
        variables: {
          userName,
          creditsAdded: creditsAdded.toString(),
          newBalance: newBalance.toString(),
          amountPaid,
          appName,
          appLogo,
          appUrl
        }
      }
    })

    if (error) console.error('[Resend] Credit Purchase Email Error:', JSON.stringify(error))
    return data
  } catch (err) {
    console.error('[Resend] Credit Purchase Email Exception:', err)
    return null
  }
}

export const sendPlanCancellationEmail = async (
  userEmail: string, 
  userName: string, 
  planName: string, 
  cancellationDate: string,
  effectiveEndDate: string
) => {
  const resend = getResend()
  if (!resend) return null

  try {
    const { appName, appLogo, appUrl, resendTestTo, templates } = getEmailConfig()
    const recipient = resendTestTo || userEmail

    const { data, error } = await resend.emails.send({
      from: `${appName} <contato@orceifacil.com.br>`,
      to: recipient,
      subject: `Sua assinatura ${appName} foi cancelada`,
      template: {
        id: templates.cancelPlan,
        variables: {
          userName,
          planName,
          cancellationDate, // Data/Hora do cancelamento
          effectiveEndDate, // Quando os recursos serão cortados
          appName,
          appLogo,
          appUrl
        }
      }
    })

    if (error) console.error('[Resend] Cancellation Email Error:', JSON.stringify(error))
    return data
  } catch (err) {
    console.error('[Resend] Cancellation Email Exception:', err)
    return null
  }
}
