import { AIService } from '../../services/AIService'
import { checkRateLimit } from '../../utils/rate-limit'

import { ProfileService } from '../../services/ProfileService'
import { Profile } from '../../models/Profile'
import { getActionCost, requireCreditBalance, chargeCredit } from '../../utils/credits'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  // Rate Limit: 10 requests per 1 minute for general generation
  await checkRateLimit(event, { max: 10, windowMs: 60 * 1000, keyPrefix: 'ai-generate' })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })
  }

  // Verificação de saldo de créditos
  const cost = await getActionCost('generate')
  const isAdmin = (session.user as any).role === 'admin'
  requireCreditBalance(profile, cost, isAdmin, 'Saldo de créditos insuficiente. Adquira créditos para usar a IA.')

  const { prompt } = await readBody(event)
  if (!prompt) {
    throw createError({ statusCode: 400, statusMessage: 'Prompt é obrigatório' })
  }

  try {
    const text = await AIService.generateDescription(prompt)

    // Dedução de crédito SOMENTE após geração bem-sucedida (atômica — previne race condition)
    await chargeCredit(profile._id, cost, isAdmin, {
      aiUsageField: 'aiUsage.proposals',
      errorMessage: 'Saldo de créditos insuficiente. Adquira créditos para usar a IA.'
    })

    return { text }
  } catch (e: any) {
    if (e.statusCode) throw e
    console.error('AI Generation Error:', e)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao gerar texto com IA. Tente novamente.'
    })
  }
})
