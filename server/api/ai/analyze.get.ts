import { all } from 'better-all'
import { ProfileService } from '../../services/ProfileService'
import { Profile } from '../../models/Profile'
import { Proposal } from '../../models/Proposal'
import { CatalogItem } from '../../models/CatalogItem'
import { Report } from '../../models/Report'
import { AIService } from '../../services/AIService'
import { NotificationService } from '../../services/NotificationService'
import { checkRateLimit } from '../../utils/rate-limit'
import { getActionCost, requireCreditBalance, chargeCredit } from '../../utils/credits'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  // Rate Limit: 5 requests per 1 minute for AI
  await checkRateLimit(event, { max: 5, windowMs: 60 * 1000, keyPrefix: 'ai-analyze' })

  const isAdmin = (session.user as any).role === 'admin'
  const { start, end, background } = getQuery(event)

  const { profile, cost, proposals, catalog } = await all({
    async profile() {
      return await ProfileService.getByUserId((session.user as any).id)
    },
    async cost() {
      return isAdmin ? 0 : await getActionCost('analyzeReport')
    },
    async proposals() {
      const p = await this.$.profile
      if (!p) throw createError({ statusCode: 404 })
      const query: any = { profileId: p._id }
      if (start && end) {
        query.createdAt = {
          $gte: new Date(start as string),
          $lte: new Date(end as string)
        }
      }
      return await Proposal.find(query).sort({ createdAt: -1 })
    },
    async catalog() {
      const p = await this.$.profile
      if (!p) throw createError({ statusCode: 404 })
      return await CatalogItem.find({ profileId: p._id })
    },
    async creditCheck() {
      const p = await this.$.profile
      const c = await this.$.cost
      const props = await this.$.proposals

      const acceptedProps = props.filter(pr => pr.status === 'accepted')
      if (acceptedProps.length === 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'É necessário ter pelo menos 1 orçamento aprovado para gerar um relatório estratégico.'
        })
      }

      requireCreditBalance(p, c, isAdmin, 'Saldo de créditos insuficiente. Adquira créditos para gerar relatórios com IA.')
      return true
    }
  })

  const acceptedProposals = proposals.filter(p => p.status === 'accepted')
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

  const generateReportTask = async () => {
    try {
      const analysis = await AIService.generateDescription(prompt)

      // Save report to database
      const newReport = await Report.create({
        profileId: profile._id,
        content: analysis,
        context: {
          totalProposals: context.totalProposals,
          totalRevenue: context.totalRevenue,
          period: start && end ? `${start} a ${end}` : 'Todo o período'
        }
      })

      // Dedução de crédito SOMENTE após relatório gerado e salvo com sucesso (atômica)
      await chargeCredit(profile._id, cost, isAdmin, {
        aiUsageField: 'aiUsage.reports',
        errorMessage: 'Saldo de créditos insuficiente. Adquira créditos para gerar relatórios com IA.'
      })

      // Notificar usuário na Central de Notificações
      try {
        const periodText = start && end ? `${start} a ${end}` : 'todo o período'
        await NotificationService.createNotification({
          profileId: profile._id.toString(),
          type: 'report_generated',
          title: 'Relatório IA Concluído',
          summary: `Sua análise estratégica de IA (${periodText}) foi concluída com sucesso!`,
          details: {
            reportId: newReport._id.toString(),
            content: analysis,
            period: periodText,
            totalProposals: context.totalProposals,
            totalRevenue: context.totalRevenue,
            generatedAt: new Date().toISOString()
          },
          metadata: {
            reportId: newReport._id.toString()
          }
        })
      } catch (notifErr) {
        console.error('[AI Analyze] Erro ao emitir notificação de relatório gerado:', notifErr)
      }

      return { text: analysis, reportId: newReport._id }
    } catch (e: any) {
      console.error('AI Analysis Error:', e)
      throw e
    }
  }

  // Se background for solicitado ou padrão para evitar blocking da UI
  if (background === 'true' || background === true || background === undefined) {
    setImmediate(() => {
      generateReportTask().catch(err => console.error('[Background AI Report Error]:', err))
    })

    return {
      success: true,
      background: true,
      message: 'Seu relatório estratégico está sendo gerado em segundo plano. Assim que estiver pronto, você será notificado na Central de Notificações.'
    }
  }

  return await generateReportTask()
})
