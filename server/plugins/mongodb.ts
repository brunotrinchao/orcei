import mongoose from 'mongoose'

export default defineNitroPlugin(async (nitroApp) => {
  const config = useRuntimeConfig()
  const uri = config.mongodbUri || process.env.MONGODB_URI

  if (!uri) {
    console.error('MONGODB_URI não configurado no runtimeConfig ou process.env')
    return
  }

  // Debug ofuscado
  const sanitizedUri = uri.replace(/:([^@]+)@/, ':****@')
  console.log(`[MongoDB] Tentando conectar em: ${sanitizedUri}`)

  try {
    // Configurações para evitar buffering excessivo e timeouts em serverless
    const options = {
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000
    }

    if (mongoose.connection.readyState === 1) {
      return
    }

    await mongoose.connect(uri, options)
    console.log('MongoDB connected successfully')
  } catch (e) {
    console.error('MongoDB connection error:', e)
  }
})
