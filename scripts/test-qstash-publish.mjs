import * as dotenv from 'dotenv'
dotenv.config()

async function testPublish() {
  const token = process.env.QSTASH_TOKEN
  // Usando uma URL dummy para o Upstash aceitar o publish (ja que localhost ele bloqueia)
  const siteUrl = 'https://orceifacil.com.br' 
  const destination = `${siteUrl}/api/webhooks/qstash`

  if (!token) {
    console.error('ERRO: QSTASH_TOKEN nao encontrado no .env')
    process.exit(1)
  }

  console.log('Publicando job de teste no QStash...')
  console.log('Destino simulado:', destination)

  try {
    const response = await fetch(`https://qstash.upstash.io/v2/publish/${destination}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Upstash-Forward-Action': 'TEST_JOB'
      },
      body: JSON.stringify({ message: 'Ola do script de teste!', timestamp: new Date() })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Falha no QStash: ${error}`)
    }

    const result = await response.json()
    console.log('\n✅ SUCESSO!')
    console.log('Message ID:', result.messageId)
    console.log('\nO que fazer agora:')
    console.log('1. Acesse https://console.upstash.com/qstash')
    console.log('2. Clique na aba \"Events\" ou \"Messages\" no menu superior')
    console.log('3. Voce vera o log da mensagem enviada.')
    console.log('4. Note que o status estara como \"Failed\" ou \"Retrying\" porque a orceifacil.com.br ainda nao tem o endpoint, mas o importante e que o QStash RECEBEU o dado.')

  } catch (error) {
    console.error('ERRO NO TESTE:', error.message)
  } finally {
    process.exit(0)
  }
}

testPublish()
