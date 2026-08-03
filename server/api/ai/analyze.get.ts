import { all } from 'better-all'
import { ProfileService } from '../../services/ProfileService'
import { Proposal } from '../../models/Proposal'
import { CatalogItem } from '../../models/CatalogItem'
import { QueueService } from '../../services/QueueService'
import { ReportGeneratorService } from '../../services/ReportGeneratorService'
import { checkRateLimit } from '../../utils/rate-limit'
import { getActionCost, requireCreditBalance } from '../../utils/credits'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  // Rate Limit: 5 requests per 1 minute for AI
  await checkRateLimit(event, { max: 5, windowMs: 60 * 1000, keyPrefix: 'ai-analyze' })

  const isAdmin = (session.user as any).role === 'admin'
  const { start, end } = getQuery(event)

  const { profile, cost, proposals, previousProposals, catalog } = await all({
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
    async previousProposals() {
      const p = await this.$.profile
      if (!p) throw createError({ statusCode: 404 })
      
      let startDateObj = start ? new Date(start as string) : new Date(Date.now() - 30 * 86400000)
      let endDateObj = end ? new Date(end as string) : new Date()

      if (isNaN(startDateObj.getTime())) startDateObj = new Date(Date.now() - 30 * 86400000)
      if (isNaN(endDateObj.getTime())) endDateObj = new Date()

      const durationMs = Math.max(86400000, endDateObj.getTime() - startDateObj.getTime())
      const prevStartObj = new Date(startDateObj.getTime() - durationMs)
      const prevEndObj = new Date(startDateObj.getTime() - 1)

      return await Proposal.find({
        profileId: p._id,
        createdAt: { $gte: prevStartObj, $lte: prevEndObj }
      })
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

  // Período Atual
  const acceptedProposals = proposals.filter(p => p.status === 'accepted')
  const rejectedProposals = proposals.filter(p => ['rejected', 'expired'].includes(p.status))
  const pendingProposals = proposals.filter(p => ['pending', 'created'].includes(p.status))

  const totalRevenue = acceptedProposals.reduce((acc, p) => acc + (p.totals?.final || 0), 0)
  const rejectedTotalRevenue = rejectedProposals.reduce((acc, p) => acc + (p.totals?.final || 0), 0)

  const averageValue = acceptedProposals.length > 0 ? totalRevenue / acceptedProposals.length : 0
  const rejectedAverage = rejectedProposals.length > 0 ? rejectedTotalRevenue / rejectedProposals.length : 0

  const draftCount = proposals.filter(p => p.status === 'draft').length
  const nonDraftCount = proposals.length - draftCount
  const approvalRate = nonDraftCount > 0 ? Math.round((acceptedProposals.length / nonDraftCount) * 100) : 0

  // Período Anterior Comparativo
  const prevAccepted = previousProposals.filter(p => p.status === 'accepted')
  const prevTotalRevenue = prevAccepted.reduce((acc, p) => acc + (p.totals?.final || 0), 0)
  const prevAverageValue = prevAccepted.length > 0 ? prevTotalRevenue / prevAccepted.length : 0
  const prevDraftCount = previousProposals.filter(p => p.status === 'draft').length
  const prevNonDraftCount = previousProposals.length - prevDraftCount
  const prevApprovalRate = prevNonDraftCount > 0 ? Math.round((prevAccepted.length / prevNonDraftCount) * 100) : 0

  // Análise de catálogo (preço mais baixo e mais alto)
  const sortedCatalog = [...catalog].sort((a, b) => a.price - b.price)
  const lowestCatalogItem = sortedCatalog[0] ? { name: sortedCatalog[0].name, price: sortedCatalog[0].price } : null
  const highestCatalogItem = sortedCatalog.length > 0 ? { name: sortedCatalog[sortedCatalog.length - 1].name, price: sortedCatalog[sortedCatalog.length - 1].price } : null

  // Cálculo objetivo do Score Comercial (0 a 100)
  const conversionFactor = approvalRate * 0.4
  const highestPrice = highestCatalogItem?.price || 1
  const ticketRatio = Math.min(1, averageValue / highestPrice)
  const ticketFactor = (ticketRatio * 100) * 0.3
  const proposalVolumeRatio = Math.min(1, nonDraftCount / 10)
  const catalogRatio = Math.min(1, catalog.length / 5)
  const volumeFactor = ((proposalVolumeRatio * 0.5 + catalogRatio * 0.5) * 100) * 0.3
  const commercialScore = Math.min(100, Math.max(0, Math.round(conversionFactor + ticketFactor + volumeFactor)))

  const context = {
    commercialScore,
    totalProposals: proposals.length,
    acceptedCount: acceptedProposals.length,
    pendingCount: pendingProposals.length,
    rejectedCount: rejectedProposals.length,
    draftCount,
    nonDraftCount,
    approvalRate,
    totalRevenue,
    rejectedTotalRevenue,
    averageValue,
    rejectedAverage,
    catalogItems: catalog.map(i => ({ name: i.name, price: i.price, type: i.type })),
    lowestCatalogItem,
    highestCatalogItem,
    previousPeriod: {
      totalProposals: previousProposals.length,
      nonDraftCount: prevNonDraftCount,
      acceptedCount: prevAccepted.length,
      approvalRate: prevApprovalRate,
      totalRevenue: prevTotalRevenue,
      averageValue: prevAverageValue
    },
    recentHistory: proposals.slice(0, 10).map(p => ({
      title: p.title,
      value: p.totals?.final,
      status: p.status,
      date: p.createdAt,
      clientName: p.client?.name || 'Cliente',
      paymentMethod: p.paymentConfig?.method || 'N/I'
    }))
  }

  // Catálogo: nomes únicos (dedup por nome) pro prompt — contagem real fica em context.catalogItems.length
  const uniqueCatalogEntries = Array.from(new Map(context.catalogItems.map(i => [i.name, i])).values())
  const catalogCompact = uniqueCatalogEntries
    .map(i => `${i.name} (R$${i.price.toLocaleString('pt-BR')})`)
    .join(', ')

  // Histórico: status abreviado + cliente consolidado quando repetido em todos os itens
  const STATUS_LABELS: Record<string, string> = {
    accepted: 'Aceito', rejected: 'Recusado', expired: 'Expirado',
    pending: 'Pendente', created: 'Criado', clicked: 'Clicado',
    draft: 'Rascunho', bounced: 'Retornado'
  }
  const historyClients = [...new Set(context.recentHistory.map(h => h.clientName))]
  const singleClient = historyClients.length === 1 ? historyClients[0] : null
  const historyCompact = context.recentHistory
    .map(h => {
      const statusTxt = STATUS_LABELS[h.status] || h.status
      const clientTxt = singleClient ? '' : `, ${h.clientName}`
      return `${h.title} (R$${(h.value || 0).toLocaleString('pt-BR')}, ${statusTxt}${clientTxt})`
    })
    .join(', ')
  const historyClientNote = singleClient ? ` Cliente em todos: ${singleClient}.` : ''

  const prompt = `Atue como consultor de negócios sênior para freelancers e pequenas empresas brasileiras. Analise os dados comerciais abaixo e produza o relatório estruturado estritamente nas seções solicitadas em Markdown.

DADOS:
- Período: ${start && end ? `${start} a ${end}` : 'Todo o período'} | Orçamentos: ${context.nonDraftCount} (${context.acceptedCount} aceitos, ${context.pendingCount} pendentes, ${context.rejectedCount} recusados${context.draftCount ? `, ${context.draftCount} rascunhos` : ''})
- Taxa Aprovação: ${context.approvalRate}% | Faturamento Realizado: R$ ${context.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Receita Perdida: R$ ${context.rejectedTotalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Ticket Médio: R$ ${context.averageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (recusados: R$ ${context.rejectedAverage.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) | Score: ${commercialScore}/100
- Período Anterior: Faturamento R$ ${context.previousPeriod.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Conversão ${context.previousPeriod.approvalRate}% | Ticket Médio R$ ${context.previousPeriod.averageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Catálogo (${context.catalogItems.length} itens${uniqueCatalogEntries.length !== context.catalogItems.length ? `, ${uniqueCatalogEntries.length} únicos` : ''}): ${catalogCompact}
- Histórico Recente: ${historyCompact}.${historyClientNote}

DIRETRIZES DE SAÍDA (obrigatório seguir em Markdown; use a taxonomia 📌[Fato] / 💡[Hipótese] / 🎯[Recomendação] nos pontos analisados):

1. **Amostra e Confiança**: ${context.nonDraftCount < 5
    ? `⚠️ Amostra REDUZIDA (${context.nonDraftCount} orçamentos válidos) — defina "Nível de Confiança: Baixo (Amostra Insuficiente)", nunca invente tendências/sazonalidade inexistentes, e destaque que a prioridade é aumentar o volume de propostas enviadas.`
    : `Amostra com volume adequado (${context.nonDraftCount} orçamentos válidos) — defina "Nível de Confiança: Médio/Alto".`
  }

## 📋 Resumo Executivo & Score Comercial (Score: ${commercialScore}/100)
Apresente o Score de ${commercialScore}/100 com leitura sintética; tabela (Conversão ${context.approvalRate}% vs ${context.previousPeriod.approvalRate}%; Ticket R$ ${context.averageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} vs R$ ${context.previousPeriod.averageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}; Catálogo ${context.catalogItems.length} itens); 3 bullets: Oportunidade, Risco, Ação Prioritária.

## 📊 1. Diagnóstico de Saúde Comercial & Comparativo de Períodos
Compare o período atual com o anterior (faturamento, conversão, ticket médio) e detalhe o impacto financeiro da receita perdida.

## 💰 2. Estratégia de Precificação & Escada de Valor
Identifique produto de entrada, item de ancoragem e lacunas no catálogo; sugira ajustes de preço e uma Escada de Valor (Entrada → Principal → Premium).

## 🚀 3. Mix de Vendas, Upsell e Impacto Financeiro
Crie ao menos 2 pacotes (Nome, Composição, Preço Avulso Somado, Preço do Pacote, Desconto Estratégico) e simule o ganho mensal/anual com 30% dos clientes migrando para o pacote de maior valor.

## ⚡ 4. Plano de Ação Priorizado — Próximas 2 Semanas
Tabela com 5 ações: | Ação | Impacto | Esforço | Prioridade | Ganho Esperado |, com prazo e estimativa de retorno.

## ⚠️ 5. Principais Riscos Comerciais
Liste de 2 a 4 riscos críticos (ex: dependência de poucos clientes, baixa conversão em propostas de alto valor, falta de follow-up).

## 🎯 6. Dica de Ouro
Um insight estratégico profundo e acionável, no nível de um consultor de R$ 500/hora.

REGRAS: use somente os dados reais informados acima (nunca invente números), mantenha tom consultivo sênior direto e focado em resultados, e entregue as 7 seções acima completas sem interrupção de texto.`

  const formatPeriodText = (s?: any, e?: any) => {
    if (!s || !e) return 'todo o período'
    try {
      const startDate = new Date(s as string)
      const endDate = new Date(e as string)
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 'período selecionado'
      const startFmt = startDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      const endFmt = endDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      if (startFmt === endFmt) return `dia ${startFmt}`
      return `período de ${startFmt} a ${endFmt}`
    } catch {
      return 'período selecionado'
    }
  }

  const periodFormatted = formatPeriodText(start, end)
  const payload = {
    profileId: profile._id.toString(),
    prompt,
    context,
    cost,
    isAdmin,
    start: start ? String(start) : undefined,
    end: end ? String(end) : undefined,
    periodFormatted
  }

  // Publicar job na fila do QStash (mesmo padrão de e-mails/backups)
  const queueRes = await QueueService.publish('GENERATE_REPORT', payload)

  // Em desenvolvimento local ou sem QStash token, executa via setImmediate
  if (queueRes?.messageId === 'local-dev-id' || !queueRes) {
    setImmediate(() => {
      ReportGeneratorService.handleGenerateReport(payload).catch(err => console.error('[Local Dev AI Report Error]:', err))
    })
  }

  return {
    success: true,
    background: true,
    message: 'Seu relatório estratégico está sendo gerado em segundo plano. Assim que estiver pronto, você será notificado na Central de Notificações.'
  }
})
