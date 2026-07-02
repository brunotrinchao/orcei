import { ProfileService } from '../../services/ProfileService'
import { Profile } from '../../models/Profile'
import { Proposal } from '../../models/Proposal'
import { CatalogItem } from '../../models/CatalogItem'
import { Report } from '../../models/Report'
import { AIService } from '../../services/AIService'
import { checkRateLimit } from '../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  // Rate Limit: 5 requests per 1 minute for AI
  await checkRateLimit(event, { max: 5, windowMs: 60 * 1000, keyPrefix: 'ai-analyze' })

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

  // Coletar dados para análise (mesmo universo do dashboard, sem truncar por limit)
  const [proposals, catalog] = await Promise.all([
    Proposal.find(query).sort({ createdAt: -1 }),
    CatalogItem.find({ profileId: profile._id })
  ])

  const acceptedProposals = proposals.filter(p => p.status === 'accepted')

  // Pré-requisito de negócio: precisa de pelo menos 1 orçamento aprovado. Verificado
  // ANTES da checagem de créditos para o cliente entender o motivo real do bloqueio.
  if (acceptedProposals.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'É necessário ter pelo menos 1 orçamento aprovado para gerar um relatório estratégico.'
    })
  }

  // Verificação de saldo de créditos para IA (Relatório Analítico)
  if (profile.creditsBalance < 1 && (session.user as any).role !== 'admin') {
    throw createError({
      statusCode: 402,
      statusMessage: 'Saldo de créditos insuficiente. Adquira créditos para gerar relatórios com IA.'
    })
  }
  const totalRevenue = acceptedProposals.reduce((acc, p) => acc + (p.totals?.final || 0), 0)
  const averageValue = acceptedProposals.length > 0 ? totalRevenue / acceptedProposals.length : 0

  const draftCount = proposals.filter(p => p.status === 'draft').length

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

  // Mesma fórmula do dashboard (exclui rascunhos do denominador) para evitar taxas divergentes entre as telas
  const nonDraftCount = context.totalProposals - draftCount
  const approvalRate = nonDraftCount > 0 ? Math.round((context.acceptedCount / nonDraftCount) * 100) : 0

  const prompt = `Você é um consultor de negócios sênior especializado em freelancers e pequenas empresas brasileiras. Analise os dados abaixo e produza um relatório estratégico COMPLETO e DETALHADO.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DADOS DO NEGÓCIO — ${start && end ? `Período: ${start} a ${end}` : 'Todo o período'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Total de Orçamentos enviados: ${context.totalProposals}
- Orçamentos Aceitos: ${context.acceptedCount}
- Orçamentos Pendentes: ${context.pendingCount}
- Orçamentos Recusados/Expirados: ${context.totalProposals - context.acceptedCount - context.pendingCount}
- Taxa de Aprovação: ${approvalRate}%
- Faturamento Total (aceitos): R$ ${context.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Ticket Médio: R$ ${context.averageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

CATÁLOGO DE SERVIÇOS:
${JSON.stringify(context.catalogItems.map(i => ({ nome: i.name, preco: i.price, tipo: i.type })), null, 2)}

HISTÓRICO RECENTE (últimos 10 orçamentos):
${JSON.stringify(context.recentHistory, null, 2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUÇÕES DE FORMATO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Produza um relatório Markdown completo com EXATAMENTE estas 5 seções. Cada seção deve ser aprofundada, com no mínimo 3 parágrafos ou bullets concretos. Use tabelas onde comparar dados fizer sentido. Cite os números reais fornecidos. Seja específico, não genérico.

## 📊 1. Diagnóstico de Saúde Comercial
- Interprete a taxa de aprovação de ${approvalRate}% com contexto (benchmark: 40-60% é saudável para o mercado BR)
- Avalie o ticket médio de R$ ${context.averageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} frente ao portfólio
- Identifique padrões no histórico recente (sazonalidade, tendência de crescimento ou queda)
- Calcule a perda de receita potencial nos orçamentos não convertidos

## 💰 2. Estratégia de Precificação
- Com base na taxa de aprovação de ${approvalRate}%, indique se os preços estão abaixo, adequados ou acima do mercado
- Sugira um percentual concreto de ajuste (ex: "aumente 15% nos serviços X e Y")
- Explique a psicologia de precificação aplicada ao contexto (ex: ancoragem, valor percebido)
- Proponha ao menos 2 estratégias de pacote/bundle usando os itens do catálogo

## 🚀 3. Mix de Vendas — Upsell e Cross-sell
- Analise cada item do catálogo e sugira combinações estratégicas
- Crie ao menos 2 pacotes comerciais com nome, composição e preço sugerido
- Explique qual perfil de cliente se beneficia de cada pacote
- Calcule o impacto potencial no ticket médio se 30% dos clientes migrarem para os pacotes

## ⚡ 4. Plano de Ação — Próximas 2 Semanas
Liste 5 ações concretas, priorizadas por impacto/esforço, no formato:
| Ação | Impacto | Esforço | Prazo |
|------|---------|---------|-------|

Cada ação deve ser específica e executável imediatamente.

## 🎯 5. Dica de Ouro
Um insight estratégico profundo e não-óbvio, específico para este negócio com base nos dados apresentados. Deve ser algo que um consultor de R$500/hora diria.

Tom: Consultor sênior, direto, baseado em dados, sem frases motivacionais vazias. Use os números reais para embasar cada recomendação.`

  try {
    const analysis = await AIService.generateDescription(prompt)

    // Save report to database
    await Report.create({
      profileId: profile._id,
      content: analysis,
      context: {
        totalProposals: context.totalProposals,
        totalRevenue: context.totalRevenue,
        period: start && end ? `${start} a ${end}` : 'Todo o período'
      }
    })

    // Dedução de 1 crédito SOMENTE após relatório gerado e salvo com sucesso (atômica)
    if ((session.user as any).role !== 'admin') {
      const updated = await Profile.findOneAndUpdate(
        { _id: profile._id, creditsBalance: { $gte: 1 } },
        { $inc: { creditsBalance: -1, creditsUsed: 1, 'aiUsage.reports': 1 } },
        { new: true }
      )
      if (!updated) {
        throw createError({ statusCode: 402, statusMessage: 'Saldo de créditos insuficiente. Adquira créditos para gerar relatórios com IA.' })
      }
    }

    return { text: analysis }
  } catch (e: any) {
    if (e.statusCode) throw e
    console.error('AI Analysis Error:', e)
    throw createError({
      statusCode: 500,
      statusMessage: 'Não foi possível gerar a análise estratégica no momento. Tente novamente em alguns minutos.'
    })
  }
})
