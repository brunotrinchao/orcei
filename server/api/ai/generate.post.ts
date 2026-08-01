import { all } from 'better-all'
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

  const isAdmin = (session.user as any).role === 'admin'

  const { profile, cost, body } = await all({
    async profile() {
      return await ProfileService.getByUserId((session.user as any).id)
    },
    async cost() {
      return isAdmin ? 0 : await getActionCost('generate')
    },
    async body() {
      return await readBody(event)
    },
    async creditCheck() {
      const p = await this.$.profile
      const c = await this.$.cost
      if (!p) {
        throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })
      }
      requireCreditBalance(p, c, isAdmin, 'Saldo de créditos insuficiente. Adquira créditos para usar a IA.')
      return true
    }
  })

  const { prompt } = body as any
  if (!prompt) {
    throw createError({ statusCode: 400, statusMessage: 'Prompt é obrigatório' })
  }

  try {
    const text = await AIService.generateDescription(prompt, 8192, { profileId: profile._id.toString(), action: 'generate' })

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
