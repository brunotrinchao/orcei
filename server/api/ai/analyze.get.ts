import { ProfileService } from '../../services/ProfileService'
import { Proposal } from '../../models/Proposal'
import { CatalogItem } from '../../models/CatalogItem'
import { AIService } from '../../services/AIService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404 })

  // Coletar dados para análise
  const [proposals, catalog] = await Promise.all([
    Proposal.find({ profileId: profile._id }).sort({ createdAt: -1 }).limit(50),
    CatalogItem.find({ profileId: profile._id })
  ])

  if (proposals.length === 0) {
    return { text: "Você ainda não possui orçamentos suficientes para uma análise estratégica. Gere pelo menos 3 orçamentos para começar." }
  }

  const context = {
    totalProposals: proposals.length,
    acceptedCount: proposals.filter(p => p.status === 'accepted').length,
    averageValue: proposals.reduce((acc, p) => acc + (p.totals?.final || 0), 0) / proposals.length,
    catalogItems: catalog.map(i => ({ name: i.name, price: i.price, type: i.type })),
    recentHistory: proposals.slice(0, 10).map(p => ({
      title: p.title,
      value: p.totals?.final,
      status: p.status,
      date: p.createdAt
    }))
  }

  const prompt = `Analise os dados comerciais deste profissional freelancer/empresa e forneça um relatório estratégico de crescimento.
  
DADOS DO NEGÓCIO:
- Total de Orçamentos: ${context.totalProposals}
- Taxa de Conversão Atual: ${Math.round((context.acceptedCount / context.totalProposals) * 100)}%
- Ticket Médio: R$ ${context.averageValue.toFixed(2)}
- Itens no Catálogo: ${context.catalogItems.length}

ITENS DO CATÁLOGO:
${JSON.stringify(context.catalogItems)}

ÚLTIMOS 10 ORÇAMENTOS:
${JSON.stringify(context.recentHistory)}

SUA TAREFA:
Escreva um relatório em formato Markdown (com títulos e tópicos) contendo:
1. **Análise de Performance**: O que os dados dizem sobre a saúde do negócio.
2. **Oportunidades de Upsell**: Sugira como aumentar o ticket médio baseado no catálogo.
3. **Ajuste de Preço**: Se a taxa de conversão for alta (>70%), sugira aumento. Se for baixa (<30%), sugira revisão de proposta ou valor.
4. **Insight Estratégico**: Uma dica "fora da caixa" para este usuário específico.

O tom deve ser de um consultor sênior de negócios. Seja direto e prático.`

  const analysis = await AIService.generateDescription(prompt)
  
  return { text: analysis }
})
