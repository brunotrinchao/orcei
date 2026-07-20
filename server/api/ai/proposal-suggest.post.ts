import { all } from 'better-all'
import { CatalogItem } from '../../models/CatalogItem'
import { AIService } from '../../services/AIService'
import { CatalogMatchingService } from '../../services/CatalogMatchingService'
import { ProfileService } from '../../services/ProfileService'
import { Profile } from '../../models/Profile'
import { checkRateLimit } from '../../utils/rate-limit'
import { getActionCost, requireCreditBalance, chargeCredit } from '../../utils/credits'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  // Rate Limit: 5 requests per 1 minute for AI
  await checkRateLimit(event, { max: 5, windowMs: 60 * 1000, keyPrefix: 'ai-proposal' })

  const { prompt } = await readBody(event)
  if (!prompt) {
    throw createError({ statusCode: 400, statusMessage: 'Prompt é obrigatório' })
  }

  const isAdmin = (session.user as any).role === 'admin'

  try {
    const { profile, cost, responseText } = await all({
      async profile() {
        return await ProfileService.getByUserId((session.user as any).id)
      },
      async cost() {
        return isAdmin ? 0 : await getActionCost('proposalSuggest')
      },
      async creditCheck() {
        const p = await this.$.profile
        const c = await this.$.cost
        if (!p) {
          throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })
        }
        requireCreditBalance(p, c, isAdmin, 'Saldo de créditos insuficiente. Adquira créditos para usar a IA.')
        return true
      },
      async fullCatalog() {
        await this.$.creditCheck
        const p = await this.$.profile
        return await CatalogItem.find({ profileId: p!._id }).lean()
      },
      async relevantCatalogItems() {
        const catalog = await this.$.fullCatalog
        return await CatalogMatchingService.findRelevantItems(prompt, catalog)
      },
      async responseText() {
        const items = await this.$.relevantCatalogItems
        const catalogContext = items.map(item => ({
          id: item._id.toString(),
          name: item.name,
          description: item.description,
          price: item.price,
          unit: item.unit
        }))
        const res = await AIService.suggestProposalItems(prompt, catalogContext)
        if (!res) throw new Error('IA retornou resposta vazia')
        return res
      }
    })

    const aiResult = JSON.parse(responseText)

    // Dedução de crédito SOMENTE após a IA retornar sugestão válida (atômica)
    await chargeCredit(profile._id, cost, isAdmin, {
      aiUsageField: 'aiUsage.proposals',
      errorMessage: 'Saldo de créditos insuficiente. Adquira créditos para usar a IA.'
    })

    // Mapear para o formato que o frontend (AIProposalWizard.vue) espera
    const hasNewItems = aiResult.items.some((i: any) => i.source === 'new')

    return {
      type: hasNewItems ? 'suggested' : 'existing',
      reasoning: aiResult.reasoning,
      items: aiResult.items.map((item: any) => ({
        catalogItemId: item.source === 'catalog' ? item.id : undefined,
        name: item.name,
        description: item.description,
        price: item.price,
        unit: item.unit,
        quantity: item.quantity || 1
      }))
    }
  } catch (e: any) {
    if (e.statusCode) throw e
    console.error('AI Proposal Suggest Error:', e)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao processar pedido com IA. Tente novamente.'
    })
  }
})
