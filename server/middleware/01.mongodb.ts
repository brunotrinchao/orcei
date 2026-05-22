import mongoose from 'mongoose'

export default defineEventHandler(async (event) => {
  // Apenas para rotas de API
  if (!event.path.startsWith('/api/')) return

  // Se já está conectado, segue o fluxo
  if (mongoose.connection.readyState === 1) return

  // Se estiver desconectado (0), tentamos disparar a conexão novamente
  if (mongoose.connection.readyState === 0) {
    const config = useRuntimeConfig()
    const uri = config.mongodbUri || process.env.MONGODB_URI
    if (uri) {
      console.log('[Middleware DB] Estado 0 detectado. Tentando reconectar...')
      mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      }).catch(err => console.error('[Middleware DB] Erro na tentativa de reconexão:', err))
    }
  }

  // Se estiver conectando (2) ou desconectado (0), esperamos um pouco (max 10s)
  if (mongoose.connection.readyState !== 1) {
    console.log(`[Middleware DB] Banco em estado ${mongoose.connection.readyState}, aguardando estabilização...`)
    let attempts = 0
    while (mongoose.connection.readyState !== 1 && attempts < 100) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
    }
  }

  // Se ainda não estiver conectado, erro 503
  if (mongoose.connection.readyState !== 1) {
    console.error(`[Middleware DB] Erro crítico: Banco offline (${mongoose.connection.readyState}) após 10s. Verifique Whitelist IP Atlas.`)
    throw createError({
      statusCode: 503,
      statusMessage: 'Database connection not established. Please check MongoDB Atlas IP whitelist.',
      fatal: false
    })
  }
})
