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

  const config = useRuntimeConfig(event)
  const maxNameLength = Number(config.aiMaxCatalogSuggestName || config.public?.aiMaxCatalogSuggestName) || 150
  const maxContextLength = Number(config.aiMaxCatalogSuggestContext || config.public?.aiMaxCatalogSuggestContext) || 1000

  const { name, type, context } = body as any
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Nome é obrigatório' })
  }
  if (name.length > maxNameLength) {
    throw createError({ statusCode: 400, statusMessage: `O nome ultrapassou o limite máximo de ${maxNameLength} caracteres.` })
  }
  if (context && typeof context === 'string' && context.length > maxContextLength) {
    throw createError({ statusCode: 400, statusMessage: `A descrição/contexto ultrapassou o limite máximo de ${maxContextLength} caracteres.` })
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
      .select('name price unit -_id')
      .limit(3)
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
      .select('name price unit -_id')
      .limit(3)
      .lean()
  }

  // Remove metragem/quantidade/peso do nome — medida é específica de cada
  // cliente/projeto e não deve ser copiada pro item de catálogo sugerido
  function stripMeasurement(name: string): string {
    return name
      .replace(/\(?\s*\d+[\d.,]*\s*(m²|m2|cm²?|cm2|mm²?|kg|g|l|ml|un\.?|unid\.?)\s*\)?/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
  }

  // Montar seção de exemplos reais para o prompt (JSON compacto, sem description)
  let examplesSection = ''
  if (similarItems.length > 0) {
    const examples = similarItems.map(item => ({
      n: stripMeasurement(item.name),
      p: item.price,
      u: item.unit
    }))

    examplesSection = `\nExemplos de mercado BR (nome/preço/unidade de referência, JSON): ${JSON.stringify(examples)}\n`
  }

  const typeLabel = type === 'product' ? 'Produto' : 'Serviço'
  const prompt = `Especialista em precificação e marketing para freelancers/pequenas empresas do Brasil.
${examplesSection}
Sugira para: ${typeLabel} "${name}"${context ? ` | contexto: ${context}` : ''}

Responda APENAS este JSON, sem markdown: {"description":"até 150 caracteres, tom direto/premium, foco em valor/benefícios","price":0,"unit":"UN"}
Regras: price = número BRL baseado no mercado e exemplos acima; unit ∈ [UN,H,DIA,MES,KG,CM,ML].

REGRA CRÍTICA: nunca inclua metragem, área (m²), quantidade, peso ou qualquer medida no description/nome — mesmo que os exemplos tenham, ignore esse padrão (medida é específica de cada cliente/projeto).`

  try {
    const text = await AIService.generateDescription(prompt, 8192, { profileId: profile._id.toString(), action: 'catalogSuggest' })
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
