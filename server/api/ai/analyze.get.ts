import { ProfileService } from '../../services/ProfileService'
import { Proposal } from '../../models/Proposal'
import { CatalogItem } from '../../models/CatalogItem'
import { AIService } from '../../services/AIService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404 })

  const { start, end } = getQuery(event)
  const query: any = { profileId: profile._id }

  if (start && end) {
    query.createdAt = {
      $gte: new Date(start as string),
      $lte: new Date(end as string)
    }
  }

  // Coletar dados para análise
  const [proposals, catalog] = await Promise.all([
    Proposal.find(query).sort({ createdAt: -1 }).limit(50),
    CatalogItem.find({ profileId: profile._id })
  ])

  if (proposals.length === 0) {
    return { text: "Você ainda não possui orçamentos suficientes para uma análise estratégica. Gere pelo menos 3 orçamentos para começar." }
  }

  const acceptedProposals = proposals.filter(p => p.status === 'accepted')
  const totalRevenue = acceptedProposals.reduce((acc, p) => acc + (p.totals?.final || 0), 0)
  const averageValue = acceptedProposals.length > 0 ? totalRevenue / acceptedProposals.length : 0

  const context = {
    totalProposals: proposals.length,
    acceptedCount: acceptedProposals.length,
    pendingCount: proposals.filter(p => ['pending', 'created'].includes(p.status)).length,
    totalRevenue,
    averageValue,
    catalogItems: catalog.map(i => ({ name: i.name, price: i.price, type: i.type })),
    recentHistory: proposals.slice(0, 10).map(p => ({
      title: p.title,
      value: p.totals?.final,
      status: p.status,
      date: p.createdAt
    }))
  }

  const prompt = `Analise os dados comerciais deste profissional/empresa e forneça um relatório estratégico de crescimento.
  
DADOS DO NEGÓCIO (${start && end ? `Período: ${start} a ${end}` : 'Todo o período'}):
- Total de Orçamentos: ${context.totalProposals}
- Orçamentos Aceitos: ${context.acceptedCount}
- Orçamentos Pendentes: ${context.pendingCount}
- Taxa de Aprovação: ${Math.round((context.acceptedCount / (context.totalProposals || 1)) * 100)}%
- Faturamento Total: R$ ${context.totalRevenue.toFixed(2)}
- Ticket Médio: R$ ${context.averageValue.toFixed(2)}
- Itens no Catálogo: ${context.catalogItems.length}

ITENS DO CATÁLOGO (Sugira combinações para Upsell):
${JSON.stringify(context.catalogItems.map(i => ({ nome: i.name, preco: i.price, tipo: i.type })))}

HISTÓRICO RECENTE:
${JSON.stringify(context.recentHistory)}

SUA TAREFA:
Escreva um relatório Markdown estruturado com:
1.  **Diagnóstico de Saúde**: Analise a taxa de aprovação e o ticket médio.
2.  **Estratégia de Precificação**: Com base na taxa de aprovação, sugira ajustes (ex: aumentar se > 70%, rever se < 30%).
3.  **Mix de Vendas (Upsell/Cross-sell)**: Sugira como combinar itens do catálogo para aumentar o valor de cada venda.
4.  **Dica de Ouro**: Um insight prático e imediato para escalar o faturamento.

Tom: Consultor sênior, direto, prático e motivador.`

  const analysis = await AIService.generateDescription(prompt)
  
  return { text: analysis }
})
