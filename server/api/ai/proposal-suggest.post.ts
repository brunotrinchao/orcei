import { CatalogItem } from '../../models/CatalogItem'
import { AIService } from '../../services/AIService'
import { CatalogMatchingService } from '../../services/CatalogMatchingService'
import { ProfileService } from '../../services/ProfileService'
import { Profile } from '../../models/Profile'
import { checkRateLimit } from '../../utils/rate-limit'

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

  // Get full catalog to find relevant items via embeddings
  const fullCatalog = await CatalogItem.find({ profileId: profile._id }).lean()

  // Filter catalog using semantic matching
  const relevantCatalogItems = await CatalogMatchingService.findRelevantItems(
    prompt,
    fullCatalog
  )

  const catalogContext = relevantCatalogItems.map(item => ({
    id: item._id.toString(),
    name: item.name,
    description: item.description,
    price: item.price,
    unit: item.unit
  }))

  try {
    const responseText = await AIService.suggestProposalItems(prompt, catalogContext)
    if (!responseText) throw new Error('IA retornou resposta vazia')

    const aiResult = JSON.parse(responseText)

    // Dedução de 1 crédito SOMENTE após a IA retornar sugestão válida (atômica)
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
