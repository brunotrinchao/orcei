import { AIService } from '../../services/AIService'
import { checkRateLimit } from '../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  // Rate Limit: 10 requests per 1 minute for general generation
  checkRateLimit(event, { max: 10, windowMs: 60 * 1000, keyPrefix: 'ai-generate' })

  const { prompt } = await readBody(event)
  if (!prompt) {
    throw createError({ statusCode: 400, statusMessage: 'Prompt é obrigatório' })
  }

  try {
    const text = await AIService.generateDescription(prompt)
    return { text }
  } catch (e: any) {
    console.error('AI Generation Error:', e)
    throw createError({ 
      statusCode: 500, 
      statusMessage: 'Erro ao gerar texto com IA. Tente novamente.' 
    })
  }
})
