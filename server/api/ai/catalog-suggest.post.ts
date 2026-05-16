import { CatalogItem } from '../../models/CatalogItem'
import { AIService } from '../../services/AIService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  const { name, type, context } = await readBody(event)
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
    const regexParts = keywords.map((k: string) => `(?=.*${k})`).join('')
    const regex = new RegExp(regexParts, 'i')

    similarItems = await CatalogItem.find({
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
    const firstKeyword = new RegExp(keywords[0], 'i')
    similarItems = await CatalogItem.find({
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

    return {
      description: json.description || '',
      price: typeof json.price === 'number' && json.price > 0 ? json.price : null,
      unit: ['UN', 'H', 'DIA', 'MES', 'KG', 'CM', 'ML'].includes(json.unit) ? json.unit : null,
      similarCount: similarItems.length
    }
  } catch (e: any) {
    throw createError({
      statusCode: 500,
      statusMessage: e.message || 'Erro ao gerar sugestão com IA'
    })
  }
})
