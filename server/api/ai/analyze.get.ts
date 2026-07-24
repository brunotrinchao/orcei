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

  const prompt = `Você é um consultor de inteligência de negócios sênior especializado em freelancers e pequenas empresas brasileiras. Analise com máxima precisão técnica os dados comerciais fornecidos abaixo e produza um relatório estratégico estruturado.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DADOS DO NEGÓCIO — PERÍODO ATUAL: ${start && end ? `${start} a ${end}` : 'Todo o período'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Total de Orçamentos Cadastrados: ${context.totalProposals} (Rascunhos: ${context.draftCount})
- Orçamentos Válidos Analisados: ${context.nonDraftCount}
- Orçamentos Aceitos: ${context.acceptedCount}
- Orçamentos Pendentes: ${context.pendingCount}
- Orçamentos Recusados / Expirados: ${context.rejectedCount}
- Taxa de Aprovação Atual: ${context.approvalRate}%
- Faturamento Realizado (Aceitos): R$ ${context.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Receita Potencial Perdida (Recusados/Expirados): R$ ${context.rejectedTotalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Ticket Médio dos Aceitos: R$ ${context.averageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Ticket Médio dos Recusados: R$ ${context.rejectedAverage.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- SCORE COMERCIAL CALCULADO PELO SISTEMA: ${commercialScore}/100

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DADOS DO PERÍODO ANTERIOR COMPARATIVO (Mês/Período Anterior):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Orçamentos Válidos Enviados Anteriormente: ${context.previousPeriod.nonDraftCount}
- Orçamentos Aceitos Anteriormente: ${context.previousPeriod.acceptedCount}
- Taxa de Aprovação Anterior: ${context.previousPeriod.approvalRate}%
- Faturamento Realizado Anterior: R$ ${context.previousPeriod.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Ticket Médio Anterior: R$ ${context.previousPeriod.averageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

CATÁLOGO DE SERVIÇOS (${context.catalogItems.length} itens):
- Item de Menor Preço (Produto de Entrada): ${context.lowestCatalogItem ? `${context.lowestCatalogItem.name} (R$ ${context.lowestCatalogItem.price.toLocaleString('pt-BR')})` : 'N/A'}
- Item de Maior Preço (Ancoragem Premium): ${context.highestCatalogItem ? `${context.highestCatalogItem.name} (R$ ${context.highestCatalogItem.price.toLocaleString('pt-BR')})` : 'N/A'}
- Lista de Itens do Catálogo:
${JSON.stringify(context.catalogItems, null, 2)}

HISTÓRICO RECENTE (últimos 10 orçamentos):
${JSON.stringify(context.recentHistory, null, 2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIRETRIZES DE ANÁLISE E FORMATO DE SAÍDA (OBRIGATÓRIO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sua resposta DEVE seguir EXATAMENTE a estrutura de 6 seções abaixo em Markdown.

1. **Amostra de Dados e Nível de Confiança**:
   ${context.nonDraftCount < 5 
     ? '⚠️ ATENÇÃO: A amostra de dados é REDUZIDA (' + context.nonDraftCount + ' orçamentos válidos). Defina a análise inicial como "Nível de Confiança: Baixo (Amostra Insuficiente)". NUNCA invente tendências de longo prazo ou sazonalidade inexistentes. Destaque claramente que a prioridade primária do negócio deve ser aumentar o volume de propostas enviadas.' 
     : 'A amostra possui volume adequado (' + context.nonDraftCount + ' orçamentos válidos). Defina o "Nível de Confiança: Médio/Alto".'
   }

2. **Taxonomia das Conclusões**:
   Para cada ponto analisado, explicite a classificação usando os marcadores:
   - 📌 **[Fato]**: Dado extraído diretamente dos números do sistema.
   - 💡 **[Hipótese]**: Interpretação lógica provável.
   - 🎯 **[Recomendação]**: Ação prática sugerida.

--- ESTRUTURA DAS SEÇÕES ---

## 📋 Resumo Executivo & Score Comercial (Score: ${commercialScore}/100)
- Apresente o **Score Comercial de ${commercialScore}/100** e faça a leitura sintética da pontuação.
- Crie uma tabela síntese com:
  | Indicador | Atual | Anterior | Nível |
  | Conversão | ${context.approvalRate}% | ${context.previousPeriod.approvalRate}% | [Baixo/Saudável/Excelente] |
  | Ticket Médio | R$ ${context.averageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | R$ ${context.previousPeriod.averageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | [Baixo/Saudável/Excelente] |
  | Saúde do Catálogo | ${context.catalogItems.length} itens | - | [Risco/Regular/Ótimo] |
- Destaque em 3 bullets curtos: Principal Oportunidade, Principal Risco e Ação Prioritária.

## 📊 1. Diagnóstico de Saúde Comercial & Comparativo de Períodos
- Compare o desempenho do período atual com o período anterior (variação percentual no faturamento, evolução da taxa de conversão e variação no ticket médio).
- Analise a discrepância entre o ticket médio dos aceitos (R$ ${context.averageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) e dos recusados (R$ ${context.rejectedAverage.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).
- Detalhe o impacto financeiro da receita perdida de R$ ${context.rejectedTotalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.

## 💰 2. Estratégia de Precificação & Escada de Valor
- Avalie o catálogo do profissional: identifique o produto de entrada, o item de ancoragem e lacunas de oferta no portfólio.
- Sugira ajustes percentuais específicos para itens avulsos.
- Proponha a criação de uma Escada de Valor (Produto de Entrada → Oferta Principal → Oferta Premium).

## 🚀 3. Mix de Vendas, Upsell e Impacto Financeiro
- Crie ao menos 2 pacotes comerciais otimizados com Nome, Composição, Preço Avulso Somado, Preço Sugerido do Pacote e Desconto Estratégico.
- **Cálculo de Impacto Financeiro**: Simule numericamente o ganho mensal e anual caso 30% dos clientes migrem para o pacote sugerido de maior valor.

## ⚡ 4. Plano de Ação Priorizado — Próximas 2 Semanas
Crie a tabela priorizada de ações:
| Ação | Impacto | Esforço | Prioridade | Ganho Esperado |
|------|---------|---------|------------|----------------|
(Liste 5 ações concretas com prazo e estimativa de retorno).

## ⚠️ 5. Principais Riscos Comerciais
- Liste de 2 a 4 riscos críticos identificados (ex: dependência de poucos clientes, baixa conversão em propostas de alto valor, falta de follow-up).

## 🎯 6. Dica de Ouro
- Um insight estratégico profundo e acionável que um consultor de R$ 500/hora forneceria. Finalize a recomendação com clareza total.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRAS GERAIS DE EXECUÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- NUNCA invente números ou assuma dados não fornecidos.
- Mantenha tom de consultor sênior de negócios, direto e focado em resultados.
- Garanta que TODAS as 6 seções sejam integralmente concluídas sem interrupção de texto.`

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
