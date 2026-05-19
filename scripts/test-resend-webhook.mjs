import { Webhook } from 'svix'
import dotenv from 'dotenv'

dotenv.config()

async function testWebhook() {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  const targetUrl = 'http://localhost:3000/api/webhooks/resend'
  
  if (!secret) {
    console.error('ERRO: RESEND_WEBHOOK_SECRET não encontrado no .env')
    process.exit(1)
  }

  // Pegar emailId do argumento ou usar um placeholder
  const emailId = process.argv[2] || 're_123abc'
  const eventType = process.argv[3] || 'email.opened'

  console.log(`\n🚀 Testando Webhook: ${eventType}`)
  console.log(`📧 Email ID: ${emailId}`)
  console.log(`🔗 Alvo: ${targetUrl}\n`)

  const payload = {
    type: eventType,
    created_at: new Date().toISOString(),
    data: {
      id: emailId, // Resend usa 'id' para o email_id em alguns eventos
      email_id: emailId,
      to: ['cliente@exemplo.com'],
      subject: 'Teste de Orçamento',
      created_at: new Date().toISOString(),
    }
  }

  const payloadString = JSON.stringify(payload)
  const wh = new Webhook(secret)
  
  // Gerar headers svix
  const msgId = `msg_${Math.random().toString(36).substring(7)}`
  const now = new Date()
  const timestamp = Math.floor(now.getTime() / 1000).toString()
  const signature = wh.sign(msgId, now, payloadString)

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'svix-id': msgId,
        'svix-timestamp': timestamp,
        'svix-signature': signature,
      },
      body: payloadString
    })

    const result = await response.json()
    console.log('✅ Resposta do Servidor:', JSON.stringify(result, null, 2))
  } catch (err) {
    console.error('❌ Erro ao enviar requisição:', err.message)
  }
}

testWebhook()
