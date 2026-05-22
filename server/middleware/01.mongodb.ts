import mongoose from 'mongoose'

export default defineEventHandler(async (event) => {
  // Apenas para rotas de API
  if (!event.path.startsWith('/api/')) return

  // Se já está conectado, segue o fluxo
  if (mongoose.connection.readyState === 1) return

  // Se estiver conectando (2), esperamos um pouco (max 5s)
  if (mongoose.connection.readyState === 2) {
    let attempts = 0
    while (mongoose.connection.readyState === 2 && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
    }
  }

  // Se ainda não estiver conectado, erro 503
  if (mongoose.connection.readyState !== 1) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Database connection not established. Please check MongoDB Atlas IP whitelist.',
      fatal: false
    })
  }
})
