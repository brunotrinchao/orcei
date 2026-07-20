import { all } from 'better-all'
import { AIService } from '../../services/AIService'
import { checkRateLimit } from '../../utils/rate-limit'
import { ProfileService } from '../../services/ProfileService'
import { Profile } from '../../models/Profile'
import { getActionCost, requireCreditBalance, chargeCredit } from '../../utils/credits'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  // Rate Limit: 5 requests per 1 minute for AI
  await checkRateLimit(event, { max: 5, windowMs: 60 * 1000, keyPrefix: 'ai-client-extract' })

  const isAdmin = (session.user as any).role === 'admin'

  const { profile, cost, body } = await all({
    async profile() {
      return await ProfileService.getByUserId((session.user as any).id)
    },
    async cost() {
      return isAdmin ? 0 : await getActionCost('clientExtract')
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

  const { text } = body as any
  if (!text) {
    throw createError({ statusCode: 400, statusMessage: 'Texto do lead é obrigatório' })
  }

  try {
    const responseText = await AIService.extractClientInfo(text)
    if (!responseText) throw new Error('IA retornou resposta vazia')

    const cleanJson = responseText.replace(/```json|```/g, '').trim()
    const extractedData = JSON.parse(cleanJson)

    // Dedução de crédito SOMENTE após extração bem-sucedida (atômica)
    await chargeCredit(profile._id, cost, isAdmin, {
      aiUsageField: 'aiUsage.leads',
      errorMessage: 'Saldo de créditos insuficiente. Adquira créditos para usar a IA.'
    })

    return {
      name: extractedData.name || '',
      email: extractedData.email || '',
      phone: extractedData.phone || '',
      segment: extractedData.segment || '',
      companySize: extractedData.companySize || ''
    }
  } catch (e: any) {
    if (e.statusCode) throw e
    console.error('AI Client Extraction Error:', e)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao extrair dados do cliente com IA. Tente novamente.'
    })
  }
})
