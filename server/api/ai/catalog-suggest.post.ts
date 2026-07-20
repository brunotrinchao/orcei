import { all } from 'better-all'
import { CatalogItem } from '../../models/CatalogItem'
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

  // Rate Limit: 5 requests per 1 minute for AI
  await checkRateLimit(event, { max: 5, windowMs: 60 * 1000, keyPrefix: 'ai-catalog' })

  const isAdmin = (session.user as any).role === 'admin'

  const { profile, cost, body } = await all({
    async profile() {
      return await ProfileService.getByUserId((session.user as any).id)
    },
    async cost() {
      return isAdmin ? 0 : await getActionCost('catalogSuggest')
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

  const { name, type, context } = body as any
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Nome é obrigatório' })
  }

  // Buscar itens similares no MongoDB (todos os perfis = referência de mercado)
  const keywords = name
    .split(/\s+/)
    .filter((w: string) => w.length >= 3)
    .slice(0, 5)

  let similarItems: any[] = []

  if (keywords.length > 0) {
    // Escape keywords to prevent ReDoS
    const escapedKeywords = keywords.map((k: string) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const regexParts = escapedKeywords.map((k: string) => `(?=.*${k})`).join('')
    const regex = new RegExp(regexParts, 'i')

    similarItems = await CatalogItem.find({
      profileId: profile._id,
      type,
      name: { $regex: regex },
      price: { $gt: 0 }
    })
      .select('name description price unit -_id')
      .limit(8)
      .lean()
  }

  // Fallback: busca mais ampla se não achou nada
  if (similarItems.length === 0 && keywords.length > 0) {
    const escapedFirst = keywords[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const firstKeyword = new RegExp(escapedFirst, 'i')
    similarItems = await CatalogItem.find({
      profileId: profile._id,
      type,
      name: { $regex: firstKeyword },
      price: { $gt: 0 }
    })
      .select('name description price unit -_id')
      .limit(6)
      .lean()
  }

  // Montar seção de exemplos reais para o prompt
  let examplesSection = ''
  if (similarItems.length > 0) {
    const examples = similarItems
      .map(item =>
        `- Nome: ${item.name} | Preço: R$${item.price} | Unidade: ${item.unit}${item.description ? ` | Desc: ${item.description}` : ''}`
      )
      .join('\n')

    examplesSection = `\nExemplos reais cadastrados na plataforma (use como referência de mercado brasileiro):
${examples}\n`
  }

  const typeLabel = type === 'product' ? 'Produto' : 'Serviço'
  const prompt = `Você é especialista em precificação e marketing para freelancers e pequenas empresas brasileiras.
${examplesSection}
Com base nos exemplos acima (se houver), sugira para o ${typeLabel.toLowerCase()} abaixo:

Nome: ${name}
Tipo: ${typeLabel}${context ? `\nContexto adicional: ${context}` : ''}

Retorne SOMENTE um JSON válido, sem texto extra, sem markdown:
{"description":"descrição comercial persuasiva em até 150 caracteres","price":0,"unit":"UN"}

Regras:
- description: foque em valor e benefícios, tom direto e premium
- price: número em reais baseado no mercado brasileiro e nos exemplos reais acima
- unit: escolha a mais adequada entre UN, H, DIA, MES, KG, CM, ML`

  try {
    const text = await AIService.generateDescription(prompt)
    const raw = text.trim().replace(/```json|```/g, '').trim()
    const json = JSON.parse(raw)

    // Dedução de crédito SOMENTE após a IA retornar sugestão válida (atômica)
    await chargeCredit(profile._id, cost, isAdmin, {
      aiUsageField: 'aiUsage.catalog',
      errorMessage: 'Saldo de créditos insuficiente. Adquira créditos para usar a IA.'
    })

    return {
      description: json.description || '',
      price: typeof json.price === 'number' && json.price > 0 ? json.price : null,
      unit: ['UN', 'H', 'DIA', 'MES', 'KG', 'CM', 'ML'].includes(json.unit) ? json.unit : null,
      similarCount: similarItems.length
    }
  } catch (e: any) {
    if (e.statusCode) throw e
    console.error('AI Catalog Suggest Error:', e)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao processar sugestão com IA. Tente novamente.'
    })
  }
})
