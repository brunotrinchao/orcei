import mongoose from 'mongoose'

export default defineNitroPlugin(async (nitroApp) => {
  const config = useRuntimeConfig()
  const uri = config.mongodbUri || process.env.MONGODB_URI

  if (!uri) {
    console.error('MONGODB_URI não configurado no runtimeConfig ou process.env')
    return
  }

  // Desabilitar buffering global para evitar timeouts silenciosos em serverless
  // Se a conexão cair, o Mongoose deve falhar imediatamente ao invés de esperar 10s
  mongoose.set('bufferCommands', false)

  // Debug ofuscado
  const sanitizedUri = uri.replace(/:([^@]+)@/, ':****@')
  console.log(`[MongoDB] Tentando conectar em: ${sanitizedUri}`)

  try {
    const options = {
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 30000, // Aumentado para 30s para evitar falhas em cold starts
      maxPoolSize: 10
    }

    if (mongoose.connection.readyState === 1) {
      return
    }

    // Se estiver conectando (2), esperamos a conexão atual
    if (mongoose.connection.readyState === 2) {
      console.log('[MongoDB] Conexão já em andamento...')
      return
    }

    console.log('[MongoDB] Iniciando conexão...')
    await mongoose.connect(uri, options)
    console.log('[MongoDB] Conectado com sucesso!')
  } catch (e: any) {
    console.error('[MongoDB] Erro fatal de conexão:', {
      name: e.name,
      message: e.message,
      reason: e.reason ? 'Server Selection Timeout / Network Access' : 'Authentication / DNS'
    })
  }
})

