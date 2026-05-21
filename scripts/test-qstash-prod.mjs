import * as dotenv from 'dotenv'
dotenv.config()

async function testProd() {
  const token = process.env.QSTASH_TOKEN
  const siteUrl = 'https://orceifacil.com.br' 
  const destination = `${siteUrl}/api/webhooks/qstash`

  if (!token) {
    console.error('ERRO: QSTASH_TOKEN nao encontrado no .env')
    process.exit(1)
  }

  console.log('Enviando job de teste para PRODUCAO (Dominio Correto)...')
  console.log('URL de Destino:', destination)

  try {
    const response = await fetch(`https://qstash.upstash.io/v2/publish/${destination}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Upstash-Forward-Action': 'TEST_JOB'
      },
      body: JSON.stringify({ 
        message: 'Teste Final Dominio Correto', 
        timestamp: new Date().toISOString()
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Falha no QStash: ${error}`)
    }

    const result = await response.json()
    console.log('\n✅ DADO ENVIADO AO QSTASH!')
    console.log('Message ID:', result.messageId)
    console.log('\nVerifique agora: https://console.upstash.com/qstash')

  } catch (error) {
    console.error('ERRO NO TESTE:', error.message)
  } finally {
    process.exit(0)
  }
}

testProd()
