import { AIService } from '../../services/AIService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  const { prompt } = await readBody(event)
  if (!prompt) {
    throw createError({ statusCode: 400, statusMessage: 'Prompt é obrigatório' })
  }

  try {
    const text = await AIService.generateDescription(prompt)
    return { text }
  } catch (e: any) {
    throw createError({ 
      statusCode: 500, 
      statusMessage: e.message || 'Erro ao gerar texto com IA' 
    })
  }
})
