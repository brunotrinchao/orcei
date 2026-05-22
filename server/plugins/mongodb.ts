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
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      // Manter pool de conexões otimizado
      maxPoolSize: 10
    }

    if (mongoose.connection.readyState === 1) {
      return
    }

    // Se estiver conectando (2), esperamos a conexão atual
    if (mongoose.connection.readyState === 2) {
      console.log('[MongoDB] Já existe uma tentativa de conexão em andamento...')
      return
    }

    await mongoose.connect(uri, options)
    console.log('MongoDB connected successfully')
  } catch (e) {
    console.error('MongoDB connection error:', e)
  }
})

