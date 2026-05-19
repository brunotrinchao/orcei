import { CatalogItem } from '../../models/CatalogItem'
import { AIService } from '../../services/AIService'
import { ProfileService } from '../../services/ProfileService'
import { checkRateLimit } from '../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  // Rate Limit: 5 requests per 1 minute for AI
  checkRateLimit(event, { max: 5, windowMs: 60 * 1000, keyPrefix: 'ai-proposal' })

  const { prompt } = await readBody(event)
  if (!prompt) {
    throw createError({ statusCode: 400, statusMessage: 'Prompt é obrigatório' })
  }

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })
  }

  // Get user's catalog
  const catalog = await CatalogItem.find({ profileId: profile._id })
    .select('name description price unit _id')
    .lean()

  const catalogContext = catalog.map(item => ({
    id: item._id.toString(),
    name: item.name,
    description: item.description,
    price: item.price,
    unit: item.unit
  }))

  const aiPrompt = `Você é um assistente de vendas inteligente para freelancers.
Um usuário quer criar um orçamento com o seguinte pedido: "${prompt}"

Abaixo está o catálogo atual de serviços/produtos deste usuário:
${JSON.stringify(catalogContext, null, 2)}

Sua tarefa:
1. Analise se algum item do catálogo acima atende ao pedido do usuário.
2. Se houver itens que combinam, retorne o tipo "existing" e a lista de IDs desses itens.
3. Se NÃO houver itens que combinam o suficiente, você deve sugerir novos serviços que façam sentido para o pedido. Retorne o tipo "suggested" e uma lista de novos itens (máximo 3).
4. Para itens sugeridos, crie: nome, descrição comercial persuasiva e um preço sugerido justo (baseado na média de preços do catálogo atual se houver, ou no mercado brasileiro).

Retorne APENAS um JSON válido seguindo este formato:
{
  "type": "existing" | "suggested",
  "items": [
    { "id": "id_do_item_se_existente", "name": "...", "description": "...", "price": 0, "unit": "..." }
  ]
}

Regras:
- Se type for "existing", o array items deve conter os objetos completos do catálogo que deram match.
- Se type for "suggested", o array items deve conter novos objetos (sem id).
- Não retorne markdown, apenas o JSON.`

  try {
    const responseText = await AIService.generateDescription(aiPrompt)
    if (!responseText) throw new Error('IA retornou resposta vazia')

    // Extrair JSON mesmo se houver texto conversacional em volta
    let raw = responseText.trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      raw = jsonMatch[0]
    }

    const result = JSON.parse(raw)
    return result
  } catch (e: any) {
    console.error('AI Proposal Suggest Error:', e)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao processar pedido com IA. Tente novamente.'
    })
  }
})
