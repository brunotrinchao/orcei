import { AIService } from '../../services/AIService'
import { checkRateLimit } from '../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  // Rate Limit: 5 requests per 1 minute for AI
  checkRateLimit(event, { max: 5, windowMs: 60 * 1000, keyPrefix: 'ai-client-extract' })

  const { text } = await readBody(event)
  if (!text) {
    throw createError({ statusCode: 400, statusMessage: 'Texto do lead é obrigatório' })
  }

  try {
    const responseText = await AIService.extractClientInfo(text)
    if (!responseText) throw new Error('IA retornou resposta vazia')

    const cleanJson = responseText.replace(/```json|```/g, '').trim()
    const extractedData = JSON.parse(cleanJson)

    return {
      name: extractedData.name || '',
      email: extractedData.email || '',
      phone: extractedData.phone || '',
      segment: extractedData.segment || '',
      companySize: extractedData.companySize || ''
    }
  } catch (e: any) {
    console.error('AI Client Extraction Error:', e)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao extrair dados do cliente com IA. Tente novamente.'
    })
  }
})
