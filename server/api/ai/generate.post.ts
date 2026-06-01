import { AIService } from '../../services/AIService'
import { checkRateLimit } from '../../utils/rate-limit'

import { ProfileService } from '../../services/ProfileService'
import { Profile } from '../../models/Profile'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  // Rate Limit: 10 requests per 1 minute for general generation
  checkRateLimit(event, { max: 10, windowMs: 60 * 1000, keyPrefix: 'ai-generate' })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })
  }

  // Verificação de saldo de créditos
  if (profile.creditsBalance < 1 && (session.user as any).role !== 'admin') {
    throw createError({
      statusCode: 402,
      statusMessage: 'Saldo de créditos insuficiente. Adquira créditos para usar a IA.'
    })
  }

  // Dedução de 1 crédito (atômica — previne race condition)
  if ((session.user as any).role !== 'admin') {
    const updated = await Profile.findOneAndUpdate(
      { _id: profile._id, creditsBalance: { $gte: 1 } },
      { $inc: { creditsBalance: -1, creditsUsed: 1, 'aiUsage.proposals': 1 } },
      { new: true }
    )
    if (!updated) {
      throw createError({ statusCode: 402, statusMessage: 'Saldo de créditos insuficiente. Adquira créditos para usar a IA.' })
    }
  }

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
