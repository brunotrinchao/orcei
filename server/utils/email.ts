export const sendProposalEmail = async (clientEmail: string, clientName: string, proposalUrl: string, professionalName: string) => {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not found in environment variables')
    return null
  }

  try {
    const response = await $fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: {
        from: 'Orcei <onboarding@resend.dev>', // Usando domínio de teste do Resend
        to: clientEmail,
        subject: `Orçamento: ${professionalName} preparou um orçamento para você`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #eee; border-radius: 20px;">
            <h1 style="font-size: 24px; font-weight: 900; color: #000; margin-bottom: 20px; text-transform: uppercase;">Olá, ${clientName}!</h1>
            <p style="font-size: 16px; color: #666; line-height: 1.6;">${professionalName} acaba de enviar um orçamento comercial exclusivo para você.</p>
            <p style="font-size: 16px; color: #666; line-height: 1.6; margin-bottom: 40px;">Você pode visualizar todos os detalhes do investimento, escolher a forma de pagamento e aceitar o orçamento clicando no botão abaixo:</p>
            
            <a href="${proposalUrl}" style="display: inline-block; background: #000; color: #fff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Visualizar Orçamento</a>
            
            <p style="font-size: 12px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">Este é um e-mail automático enviado via Orcei. Não é necessário responder.</p>
          </div>
        `
      }
    })
    return response as { id: string }
  } catch (error) {
    console.error('Error sending email via Resend:', error)
    return null
  }
}
