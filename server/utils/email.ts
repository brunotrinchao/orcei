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
      proposal: config.resendTemplateProposal || 'proposta',
      welcome: config.resendTemplateWelcome || 'bem-vindo',
      backup: config.resendTemplateBackup || 'backup',
      assignPlan: config.resendTemplateAssignPlan || 'ativar-plano',
      buyCredit: config.resendTemplateBuyCredit || 'comprar-credito',
      cancelPlan: config.resendTemplateCancelPlan || 'cancelar-plano'
    }
  }
}

// Verifica se um template ID do Resend é customizado no .env ou é apenas a chave padrão/vazia
const isCustomTemplate = (id: string, fallbackDefault: string): boolean => {
  if (!id) return false
  const cleanId = id.trim()
  return cleanId !== fallbackDefault && cleanId !== '' && cleanId !== 'proposta' && cleanId !== 'bem-vindo' && cleanId !== 'backup' && cleanId !== 'comprar-credito' && cleanId !== 'ativar-plano' && cleanId !== 'cancelar-plano'
}

// Template base estético unificado de altíssima conversão (Midnight Sapphire / Blue Tech)
export const renderBaseEmailTemplate = (options: {
  badge: string
  title: string
  userName: string
  bodyHtml: string
  ctaText?: string
  ctaUrl?: string
  footerNote?: string
}) => {
  const logoUrl = 'https://res.cloudinary.com/dpeaqezkb/image/upload/v1778873300/orcafacil/logo-default.png'
  const appName = 'Orcei'
  const currentYear = new Date().getFullYear()

  const ctaBlock = options.ctaText && options.ctaUrl ? `
            <!-- Botão de Ação -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0 24px 0;">
              <tbody><tr>
                <td align="center">
                  <table border="0" cellpadding="0" cellspacing="0">
                    <tbody><tr>
                      <td align="center" bgcolor="#3147F6" style="border-radius: 100px;">
                        <a href="${options.ctaUrl}" style="font-size: 14px; font-weight: bold; color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 100px; border: 1px solid #3147F6; display: inline-block; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 1px;">
                          ${options.ctaText}
                        </a>
                      </td>
                    </tr>
                  </tbody></table>
                  <p style="font-size: 12px; color: #94a3b8; margin: 12px 0 0 0; font-family: Arial, sans-serif;">
                    Acesse a plataforma para criar e gerenciar seus projetos
                  </p>
                </td>
              </tr>
            </tbody></table>
  ` : ''

  const footerNoteBlock = options.footerNote ? `
            <p style="font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.5; font-family: Arial, sans-serif;">
              ${options.footerNote}
            </p>
  ` : ''

  return `
<table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-wrapper" style="background-color: #f1f5f9; width: 100%; padding: 40px 16px;" align="center">
  <tbody><tr>
    <td align="center">
      
      <!-- Card do E-mail -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-card" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border-collapse: separate;">
        
        <!-- Cabeçalho -->
        <tbody><tr>
          <td class="header" bgcolor="#ffffff" align="center" style="padding: 40px 40px; background-color: #ffffff;">
            <img src="${logoUrl}" alt="${appName}" width="120" style="width: 120px; max-width: 120px; margin-bottom: 24px;">
            
            <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
              <tbody><tr>
                <td bgcolor="#3147F6" style="border-radius: 100px; padding: 6px 16px; font-size: 11px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">
                  ${options.badge}
                </td>
              </tr>
            </tbody></table>

            <h1 style="font-size: 24px; font-weight: 800; color: #3147F6; margin: 0; line-height: 1.3; font-family: Arial, sans-serif;">
              ${options.title}
            </h1>
          </td>
        </tr>

        <!-- Corpo Principal -->
        <tr>
          <td class="body" style="padding: 40px 40px 32px 40px;">
            <p style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; font-family: Arial, sans-serif;">
              Olá, ${options.userName}! 💰
            </p>
            
            ${options.bodyHtml}

            ${ctaBlock}

            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0 24px 0;">
              <tbody><tr>
                <td style="border-top: 1px solid #e2e8f0; height: 1px; line-height: 1px; font-size: 1px;">&nbsp;</td>
              </tr>
            </tbody></table>

            ${footerNoteBlock}
          </td>
        </tr>

        <!-- Rodapé -->
        <tr>
          <td class="footer" bgcolor="#f8fafc" style="background-color: #f8fafc; padding: 32px 40px; text-align: center; border-top: 1px solid #f1f5f9;">
            <img src="${logoUrl}" alt="${appName}" width="80" style="width: 80px; max-width: 80px; margin: 0 auto 16px; opacity: 0.5;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0 0 6px 0; line-height: 1.5; font-family: Arial, sans-serif;">
              E-mail enviado automaticamente pela plataforma <strong>${appName}</strong>.
            </p>
            <p style="font-size: 11px; color: #94a3b8; margin: 0; font-family: Arial, sans-serif;">
              © ${currentYear} ${appName} · Seu Orçamento Inteligente
            </p>
          </td>
        </tr>

      </tbody></table>
      
    </td>
  </tr>
</tbody></table>
  `
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
    const subject = `${professionalName} preparou um orçamento para você`

    const emailParams: any = {
      from: `${appName} <contato@orceifacil.com.br>`,
      to: recipient,
      subject
    }

    if (isCustomTemplate(templates.proposal, 'proposta')) {
      emailParams.template = {
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
    } else {
      const bodyHtml = `
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px 0; font-family: Arial, sans-serif;">
          <strong>${professionalName}</strong> preparou uma proposta comercial exclusiva e personalizada para o seu projeto. Você pode visualizá-la e realizar o aceite de forma 100% digital e segura.
        </p>
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px 0; font-family: Arial, sans-serif;">
          Clique no botão abaixo para analisar o escopo, valores e cronograma propostos.
        </p>
      `
      emailParams.html = renderBaseEmailTemplate({
        badge: 'Orçamento Disponível',
        title: 'Seu orçamento exclusivo<br>está pronto',
        userName: clientName,
        bodyHtml,
        ctaText: 'Visualizar Minha Proposta',
        ctaUrl: proposalUrl,
        footerNote: 'Este link é exclusivo para o seu acesso seguro. Se tiver dúvidas sobre a proposta, responda a este e-mail para interagir com o profissional.'
      })
    }

    const { data, error } = await resend.emails.send(emailParams)
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
    const subject = `Bem-vindo ao ${appName}!`

    const emailParams: any = {
      from: `${appName} <contato@orceifacil.com.br>`,
      to: recipient,
      subject
    }

    if (isCustomTemplate(templates.welcome, 'bem-vindo')) {
      emailParams.template = {
        id: templates.welcome,
        variables: {
          userName,
          appName,
          appLogo,
          appUrl
        }
      }
    } else {
      const bodyHtml = `
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px 0; font-family: Arial, sans-serif;">
          Confirmamos o seu cadastro com sucesso! A partir de agora, você tem acesso à plataforma mais rápida para gerar orçamentos, contratos digitais e fechar mais negócios com inteligência artificial.
        </p>
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px 0; font-family: Arial, sans-serif;">
          Abasteça sua conta com créditos cumulativos vitalícios para criar orçamentos profissionais em menos de 2 minutos utilizando o Copilot de IA.
        </p>
      `
      emailParams.html = renderBaseEmailTemplate({
        badge: 'Boas-vindas',
        title: 'Seja muito bem-vindo<br>ao Orcei',
        userName,
        bodyHtml,
        ctaText: 'Acessar Meu Dashboard',
        ctaUrl: `${appUrl}/dashboard`,
        footerNote: 'Se tiver qualquer dúvida ao configurar seus primeiros catálogos ou propostas comerciais, fale com o suporte técnico no chat.'
      })
    }

    const { data, error } = await resend.emails.send(emailParams)
    if (error) console.error('[Resend] Welcome Email Error:', JSON.stringify(error))
    return data
  } catch (err) {
    console.error('[Resend] Welcome Email Exception:', err)
    return null
  }
}

export const sendBackupEmail = async (userEmail: string, userName: string, zipBuffer: Buffer) => {
  const resend = getResend()
  if (!resend) return null

  try {
    const { appName, appLogo, appUrl, resendTestTo, templates } = getEmailConfig()
    const recipient = resendTestTo || userEmail
    const subject = `Seu Backup de Dados - ${appName}`

    const emailParams: any = {
      from: `${appName} <contato@orceifacil.com.br>`,
      to: recipient,
      subject,
      attachments: [
        {
          filename: `backup-${appName.toLowerCase()}-${new Date().toISOString().split('T')[0]}.zip`,
          content: zipBuffer
        }
      ]
    }

    if (isCustomTemplate(templates.backup, 'backup')) {
      emailParams.template = {
        id: templates.backup,
        variables: {
          userName,
          appName,
          appLogo,
          appUrl
        }
      }
    } else {
      const bodyHtml = `
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px 0; font-family: Arial, sans-serif;">
          Como solicitado, geramos o arquivo compactado contendo todo o seu histórico de dados cadastrados na plataforma (clientes, propostas comerciais, escopos do catálogo de serviços e logs analíticos).
        </p>
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px 0; font-family: Arial, sans-serif;">
          O arquivo ZIP está anexado com total segurança a este e-mail.
        </p>
      `
      emailParams.html = renderBaseEmailTemplate({
        badge: 'Backup de Dados',
        title: 'Seu backup está<br>pronto para download',
        userName,
        bodyHtml,
        ctaText: 'Acessar Plataforma',
        ctaUrl: `${appUrl}/dashboard`,
        footerNote: 'Por motivos de segurança, recomendamos armazenar este arquivo em um local seguro. Ele contém informações sensíveis de seu histórico comercial.'
      })
    }

    const { data, error } = await resend.emails.send(emailParams)
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
    const subject = `Seu Plano ${planName.toUpperCase()} está ativo!`

    const emailParams: any = {
      from: `${appName} <contato@orceifacil.com.br>`,
      to: recipient,
      subject
    }

    if (isCustomTemplate(templates.assignPlan, 'ativar-plano')) {
      emailParams.template = {
        id: templates.assignPlan,
        variables: {
          userName,
          planName,
          credits: credits === 9999 ? 'Ilimitados' : credits.toString(),
          planPrice,
          billingCycle,
          appName,
          appLogo,
          appUrl
        }
      }
    } else {
      const bodyHtml = `
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px 0; font-family: Arial, sans-serif;">
          Confirmamos o pagamento e a ativação do seu plano <strong>${planName.toUpperCase()}</strong>! A partir de agora, suas franquias foram injetadas e você já pode aproveitar todas as funcionalidades analíticas sem limites de visualização.
        </p>
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8faff; border: 1px solid #e0e7ff; border-radius: 12px; margin: 24px 0;">
          <tbody><tr>
            <td style="padding: 16px 20px;">
              <p style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px 0; font-family: Arial, sans-serif;">
                Resumo da Assinatura
              </p>
              <p style="font-size: 14px; color: #1e293b; margin: 0 0 4px 0; font-family: Arial, sans-serif;">
                <strong>Plano Ativo:</strong> <span style="color: #3147F6; font-weight: bold;">${planName.toUpperCase()}</span>
              </p>
              <p style="font-size: 14px; color: #1e293b; margin: 0 0 4px 0; font-family: Arial, sans-serif;">
                <strong>Franquia Mensal:</strong> ${credits === 9999 ? 'Créditos Ilimitados' : `${credits} créditos`}
              </p>
              <p style="font-size: 14px; color: #1e293b; margin: 0 0 4px 0; font-family: Arial, sans-serif;">
                <strong>Ciclo de Cobrança:</strong> ${billingCycle}
              </p>
              <p style="font-size: 14px; color: #1e293b; margin: 0; font-family: Arial, sans-serif;">
                <strong>Valor:</strong> ${planPrice}
              </p>
            </td>
          </tr>
        </tbody></table>
      `
      emailParams.html = renderBaseEmailTemplate({
        badge: 'Assinatura Ativa',
        title: 'Seu plano exclusivo<br>está pronto',
        userName,
        bodyHtml,
        ctaText: 'Acessar Cockpit Comercial',
        ctaUrl: `${appUrl}/dashboard`,
        footerNote: 'A nota fiscal correspondente a esta assinatura será enviada para o seu e-mail cadastrado em até 24 horas úteis.'
      })
    }

    const { data, error } = await resend.emails.send(emailParams)
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
    const subject = `Seus créditos foram adicionados!`

    const emailParams: any = {
      from: `${appName} <contato@orceifacil.com.br>`,
      to: recipient,
      subject
    }

    if (isCustomTemplate(templates.buyCredit, 'comprar-credito')) {
      emailParams.template = {
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
    } else {
      const bodyHtml = `
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px 0; font-family: Arial, sans-serif;">
          Confirmamos o seu pagamento. Seus novos créditos já foram injetados no sistema e você já pode continuar a enviar e gerenciar seus orçamentos sem interrupções.
        </p>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8faff; border: 1px solid #e0e7ff; border-radius: 12px; margin: 24px 0;">
          <tbody><tr>
            <td style="padding: 16px 20px;">
              <p style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px 0; font-family: Arial, sans-serif;">
                Resumo da Transação
              </p>
              <p style="font-size: 14px; color: #1e293b; margin: 0 0 4px 0; font-family: Arial, sans-serif;">
                <strong>Créditos adquiridos:</strong> <span style="color: #3147F6; font-weight: bold;">${creditsAdded}</span>
              </p>
              <p style="font-size: 14px; color: #1e293b; margin: 0 0 4px 0; font-family: Arial, sans-serif;">
                <strong>Valor pago:</strong> ${amountPaid}
              </p>
              <p style="font-size: 14px; color: #1e293b; margin: 0; font-family: Arial, sans-serif;">
                <strong>Novo saldo total:</strong> ${newBalance}
              </p>
            </td>
          </tr>
        </tbody></table>
      `
      emailParams.html = renderBaseEmailTemplate({
        badge: 'Créditos Adicionados',
        title: 'Seu saldo já está<br>disponível na conta',
        userName,
        bodyHtml,
        ctaText: 'Utilizar Meus Créditos',
        ctaUrl: `${appUrl}/dashboard`,
        footerNote: 'A nota fiscal desta transação será enviada para o seu e-mail cadastrado em até 24 horas úteis. Se tiver qualquer dúvida, fale conosco.'
      })
    }

    const { data, error } = await resend.emails.send(emailParams)
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
    const subject = `Sua assinatura ${appName} foi cancelada`

    const emailParams: any = {
      from: `${appName} <contato@orceifacil.com.br>`,
      to: recipient,
      subject
    }

    if (isCustomTemplate(templates.cancelPlan, 'cancelar-plano')) {
      emailParams.template = {
        id: templates.cancelPlan,
        variables: {
          userName,
          planName,
          cancellationDate,
          effectiveEndDate,
          appName,
          appLogo,
          appUrl
        }
      }
    } else {
      const bodyHtml = `
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px 0; font-family: Arial, sans-serif;">
          Confirmamos o cancelamento da sua assinatura <strong>${planName.toUpperCase()}</strong>. Lamentamos ver você partir, mas entendemos que os fluxos de trabalho comercial mudam.
        </p>
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8faff; border: 1px solid #e0e7ff; border-radius: 12px; margin: 24px 0;">
          <tbody><tr>
            <td style="padding: 16px 20px;">
              <p style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px 0; font-family: Arial, sans-serif;">
                Resumo do Cancelamento
              </p>
              <p style="font-size: 14px; color: #1e293b; margin: 0 0 4px 0; font-family: Arial, sans-serif;">
                <strong>Plano Cancelado:</strong> ${planName.toUpperCase()}
              </p>
              <p style="font-size: 14px; color: #1e293b; margin: 0 0 4px 0; font-family: Arial, sans-serif;">
                <strong>Data de Solicitação:</strong> ${cancellationDate}
              </p>
              <p style="font-size: 14px; color: #1e293b; margin: 0; font-family: Arial, sans-serif;">
                <strong>Fim do Período de Acesso:</strong> ${effectiveEndDate}
              </p>
            </td>
          </tr>
        </tbody></table>
      `
      emailParams.html = renderBaseEmailTemplate({
        badge: 'Assinatura Cancelada',
        title: 'Confirmação de<br>Cancelamento',
        userName,
        bodyHtml,
        ctaText: 'Reativar Minha Assinatura',
        ctaUrl: `${appUrl}/planos`,
        footerNote: 'Seu cadastro permanecerá ativo como plano gratuito. Seus créditos avulsos vitalícios continuam válidos e utilizáveis.'
      })
    }

    const { data, error } = await resend.emails.send(emailParams)
    if (error) console.error('[Resend] Plan Cancellation Email Error:', JSON.stringify(error))
    return data
  } catch (err) {
    console.error('[Resend] Plan Cancellation Email Exception:', err)
    return null
  }
}
