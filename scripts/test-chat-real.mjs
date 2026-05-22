import mongoose from 'mongoose'
import Pusher from 'pusher'
import PusherClient from 'pusher-js'
import * as dotenv from 'dotenv'
import { nanoid } from 'nanoid'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI
const PUSHER_APP_ID = process.env.PUSHER_APP_ID
const PUSHER_KEY = process.env.PUSHER_KEY
const PUSHER_SECRET = process.env.PUSHER_SECRET
const PUSHER_CLUSTER = process.env.PUSHER_CLUSTER

async function testChatIntegration() {
  console.log('🚀 Iniciando teste de integração real do Chat...')

  if (!MONGODB_URI || !PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
    console.error('❌ Erro: Credenciais ausentes no .env')
    process.exit(1)
  }

  // 1. Conectar ao Banco
  await mongoose.connect(MONGODB_URI)
  const db = mongoose.connection.db
  console.log('✅ Conectado ao MongoDB:', db.databaseName)

  // 2. Setup Pusher Server (para simular a API)
  const pusherServer = new Pusher({
    appId: PUSHER_APP_ID,
    key: PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS: true
  })

  // Pegamos uma proposta existente para o teste (Fuaehu-Rd-)
  const slug = 'Fuaehu-Rd-'
  const proposal = await db.collection('proposals').findOne({ slug })
  
  if (!proposal) {
    console.error('❌ Erro: Proposta de teste não encontrada no banco.')
    process.exit(1)
  }

  const channelName = `private-proposal-${proposal._id}`
  
  // Vamos testar o payload que causou o erro 413 e o fix de ID
  const testMessage = {
    _id: new mongoose.Types.ObjectId(),
    proposalId: proposal._id,
    profileId: proposal.profileId,
    sender: 'client',
    text: 'Teste de integração real ' + nanoid(5),
    createdAt: new Date()
  }

  console.log('✉️ Simulando envio de mensagem do CLIENTE...')
  
  try {
    // Simula a lógica do messages.post.ts que corrigimos
    const messagePayload = {
      _id: testMessage._id.toString(),
      text: testMessage.text,
      sender: testMessage.sender,
      createdAt: testMessage.createdAt.toISOString()
    }

    // Teste 1: Validar se o trigger do Pusher passa (Payload < 10KB)
    console.log('📡 Disparando evento no canal:', channelName)
    await pusherServer.trigger(channelName, 'new-message', messagePayload)
    console.log('✅ Evento Pusher (Cliente) enviado com sucesso!')

    // Teste 2: Validar o canal do Freelancer (o que estava dando erro de objeto)
    const profileIdStr = proposal.profileId.toString()
    console.log('📡 Disparando notificação no canal:', `private-profile-${profileIdStr}`)
    await pusherServer.trigger(`private-profile-${profileIdStr}`, 'proposal-notification', {
      proposalId: proposal._id.toString(),
      type: 'new-message',
      message: messagePayload
    })
    console.log('✅ Notificação Global (Freelancer) enviada com sucesso!')

    // Teste 3: Gravação no Banco
    await db.collection('proposalmessages').insertOne(testMessage)
    console.log('✅ Mensagem gravada no MongoDB.')

  } catch (err) {
    console.error('❌ Falha no teste:', err)
  } finally {
    await mongoose.disconnect()
    console.log('🏁 Teste finalizado.')
    process.exit(0)
  }
}

testChatIntegration()
