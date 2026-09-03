<script setup lang="ts">
import {
  Sparkles, Loader2, ArrowUpRight, CheckCircle2, Clock, DollarSign,
  TrendingUp, BarChart3, Users, FileText, ChevronRight, Activity,
  Calendar, Award, Zap, ShieldCheck, Share2, MessageSquare, AlertCircle, Coins,
  UserPlus, Wand2, BookOpen, ReceiptText
} from 'lucide-vue-next'
import GenerateReportDrawer from '~/components/reports/GenerateReportDrawer/index.vue'
import { useDashboardPage } from '~/composables/pages/useDashboardPage'

const {
  period,
  loggedIn,
  user,
  profile,
  stats,
  status,
  periodLabel,
  tmaPercentage,
  statusChartData,
  revenueChartData,
  chartOptions,
  lineChartOptions,
  aiReport,
  isAnalyzing,
  isPaywallOpen,
  paywallReason,
  isReportDrawerOpen,
  isCostTableModalOpen,
  actionCostsList,
  costText,
  getCost,
  creditLabel,
  publicProposalUrl,
  isCreditConfirmOpen,
  confirmTitle,
  confirmDescription,
  confirmAndGenerateReport,
  generateAIReport,
  handleCreditConfirm,
  handleCreditCancel,
  formatRelativeTime,
  openSetupWizard,
  Line,
  Doughnut
} = useDashboardPage()
</script>

<template>
  <div class="space-y-10 relative">

    <!-- Filtros de Período e Saudação -->
    <PageHeader
      :title="(() => {
        const h = new Date().getHours()
        const greeting = h >= 6 && h < 12 ? 'Bom dia' : h >= 12 && h < 18 ? 'Boa tarde' : h >= 18 && h < 24 ? 'Boa noite' : 'Boa madrugada'
        const name = user?.name || user?.firstName || ''
        return name ? `${greeting}, ${name}!` : `${greeting}!`
      })()"
      subtitle="Acompanhe suas conversões, produtividade IA e receitas acumuladas."
    >
      
      <BaseCard compact v-if="stats" data-tour="dashboard-period-filter">
        
      <div class="flex items-center gap-2 overflow-x-auto w-full">
        
        <BaseButton size="sm" v-for="p in [
          { label: '7D', value: 'last_7_days' },
          { label: '30D', value: 'last_30_days' },
          { label: '90D', value: 'last_90_days' },
          { label: (new Date().getFullYear()), value: 'year' },
          { label: 'TOTAL', value: 'all' }
        ]" :key="p.value" @click="period = p.value"
        :variant="period === p.value ? 'primary' : 'ghost'">
          {{ p.label }}
        </BaseButton>
      </div>
      </BaseCard>
    </PageHeader>

    <!-- Loading State Geral -->
    <template v-if="status === 'pending' || !stats">

      <!-- KPI Cards Skeleton -->
      <section class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <BaseMetricCard v-for="i in 4" :key="i" :loading="true" />
      </section>

      <!-- AI ROI Card -->
      <section class="bg-slate-900 p-8 rounded-[.5rem] border border-slate-800">
        <div class="flex flex-col lg:flex-row gap-8">
          <div class="space-y-6 flex-1">
            <BaseSkeleton width="12rem" height="1.5rem" borderRadius="9999px" />
            <div class="space-y-2">
              <BaseSkeleton width="80%" height="2rem" />
              <BaseSkeleton width="55%" height="2rem" />
            </div>
            <BaseSkeleton width="90%" height="0.85rem" />
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <BaseSkeleton width="100%" height="0.65rem" />
                <BaseSkeleton width="100%" height="0.5rem" borderRadius="9999px" />
              </div>
              <div class="space-y-2">
                <BaseSkeleton width="100%" height="0.65rem" />
                <BaseSkeleton width="100%" height="0.5rem" borderRadius="9999px" />
              </div>
            </div>
          </div>
          <div class="bg-slate-950/40 p-6 rounded-[.5rem] border border-slate-800 lg:w-80 shrink-0 space-y-4">
            <BaseSkeleton width="100%" height="4rem" borderRadius="1rem" />
            <BaseSkeleton width="100%" height="3rem" borderRadius="1rem" />
            <BaseSkeleton width="50%" height="0.65rem" borderRadius="9999px" customClass="mx-auto" />
          </div>
        </div>
      </section>

      <!-- Funil + Follow-ups -->
      <section class="grid grid-cols-1 lg:grid-cols-3  gap-4 sm:gap-6">
        <div
          class="lg:col-span-2 bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-[.5rem] border border-slate-200 dark:border-gray-800 shadow-sm space-y-6">
          <BaseSkeleton width="10rem" height="1rem" />
          <div class="space-y-4">
            <BaseSkeleton v-for="j in 3" :key="j" width="100%" height="2.5rem" borderRadius="0.75rem" />
          </div>
          <BaseSkeleton width="100%" height="5.5rem" borderRadius="1.5rem" />
        </div>
        <div
          class="lg:col-span-1 bg-white dark:bg-gray-900 p-8 rounded-[.5rem] border border-slate-200 dark:border-gray-800 shadow-sm space-y-6">
          <BaseSkeleton width="8rem" height="1rem" />
          <div class="space-y-4">
            <BaseSkeleton v-for="j in 3" :key="j" width="100%" height="5.5rem" borderRadius="1.5rem" />
          </div>
        </div>
      </section>

      <!-- Gráficos -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div
          class="lg:col-span-2 bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-[.5rem] border border-slate-200 dark:border-gray-800 shadow-sm space-y-6">
          <BaseSkeleton width="12rem" height="1rem" />
          <BaseSkeleton width="100%" height="20rem" borderRadius="1rem" />
        </div>
        <div
          class="lg:col-span-1 bg-white dark:bg-gray-900 p-8 rounded-[.5rem] border border-slate-200 dark:border-gray-800 shadow-sm space-y-6 flex flex-col items-center">
          <BaseSkeleton width="10rem" height="1rem" customClass="self-start" />
          <BaseSkeleton width="14rem" height="14rem" borderRadius="9999px" customClass="mt-4" />
        </div>
      </section>

      <!-- Tracking + Top Clientes -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div
          class="lg:col-span-2 bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-[.5rem] border border-slate-200 dark:border-gray-800 shadow-sm space-y-6">
          <BaseSkeleton width="14rem" height="1rem" />
          <div class="space-y-3">
            <BaseSkeleton v-for="j in 5" :key="j" width="100%" height="2.25rem" borderRadius="0.5rem" />
          </div>
        </div>
        <div
          class="lg:col-span-1 bg-white dark:bg-gray-900 p-8 rounded-[.5rem] border border-slate-200 dark:border-gray-800 shadow-sm space-y-6">
          <BaseSkeleton width="8rem" height="1rem" />
          <div class="space-y-3">
            <BaseSkeleton v-for="j in 5" :key="j" width="100%" height="3.5rem" borderRadius="1rem" />
          </div>
        </div>
      </section>

    </template>

    <template v-else-if="stats">

      <!-- Seção Principal de Métricas Claves -->
      <section class="grid grid-cols-1 lg:grid-cols-4 gap-2 md:gap-6">

        <!-- Receita Confirmada -->
        <BaseMetricCard title="Faturamento" :subtitle="`${stats.acceptedCount} orçamentos convertidos`"
          :icon="DollarSign" color="green"
          :value="`R$ ${(stats.totalRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`">
          <template #footer>
            <BaseProgressBar color="green"
              :value="stats.proposalsCount ? Math.min(100, Math.round((stats.acceptedCount / stats.proposalsCount) * 100)) : 0" />
          </template>
        </BaseMetricCard>

        <!-- Conversão Geral -->
        <BaseMetricCard title="Conversão" :subtitle="`${stats.proposalsCount} orçamentos totais`" :icon="TrendingUp"
          color="blue" :value="`${Math.round(stats.approvalRate ?? 0)}%`">
          <template #footer>
            <BaseProgressBar color="blue" :value="Math.round(stats.approvalRate ?? 0)" />
          </template>
        </BaseMetricCard>

        <!-- TMA (Tempo Médio de Atendimento/Fechamento) -->
        <BaseMetricCard title="TMA" subtitle="tempo médio p/ aceite" :icon="Clock" color="purple"
          :value="stats.tmaHours > 24 ? `${Math.round(stats.tmaHours / 24)}d` : `${Math.round(stats.tmaHours || 0)}h`">
          <template #footer>
            <BaseProgressBar color="purple" :value="tmaPercentage" />
          </template>
        </BaseMetricCard>

        <!-- SLA Comercial (Fechados em < 48h) -->
        <BaseMetricCard title="SLA 48h" subtitle="fechados na meta" :icon="ShieldCheck" color="orange"
          :value="`${Math.round(stats.slaRate ?? 0)}%`">
          <template #footer>
            <BaseProgressBar color="orange" :value="Math.round(stats.slaRate ?? 0)" />
          </template>
        </BaseMetricCard>

      </section>

      <!-- Cartão IA Orcei Fácil -->
      <BaseCard class="lg:col-span-1" color="ia">
        <div class="relative z-10 flex flex-col lg:flex-row justify-between items-stretch gap-5 sm:gap-7">
          <!-- Lado esquerdo: valor + prova -->
          <div class="space-y-4 flex-1 min-w-0">
            <div class="flex items-center gap-3 flex-wrap">
              <div
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/20 text-indigo-200 text-xs font-medium">
                <Sparkles class="w-3.5 h-3.5 text-indigo-300" /> IA Orcei Fácil
              </div>
              <span class="text-xs text-indigo-200/60 hidden sm:inline">Copilot ativa</span>
            </div>

            <div class="space-y-1.5">
              <h2 class="text-2xl md:text-[1.75rem] font-semibold text-white leading-snug tracking-tight">
                Você já economizou <span class="text-indigo-300 font-bold">{{ stats.aiRoi?.timeSavedHours }}h {{
                  stats.aiRoi?.timeSavedMinutes }}m</span> de trabalho manual
              </h2>
              <p class="text-sm text-slate-400 leading-relaxed max-w-xl">
                Sua IA prepara propostas, otimiza catálogo e analisa seu funil. Gere o relatório e descubra onde crescer.
              </p>
            </div>

            <!-- KPIs de Adoção -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1.5 bg-white/[0.04] border border-white/10 rounded-[.5rem] p-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs text-slate-400">Propostas com IA</span>
                  <span class="text-sm font-semibold text-white">{{ Math.round(stats.aiRoi?.adoptionRates?.proposals || 0) }}%</span>
                </div>
                <BaseProgressBar color="bg-gradient-to-r from-brand to-indigo-400"
                  :value="stats.aiRoi?.adoptionRates?.proposals || 0" />
              </div>
              <div class="space-y-1.5 bg-white/[0.04] border border-white/10 rounded-[.5rem] p-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs text-slate-400">Itens do catálogo com IA</span>
                  <span class="text-sm font-semibold text-white">{{ Math.round(stats.aiRoi?.adoptionRates?.catalog || 0) }}%</span>
                </div>
                <BaseProgressBar color="bg-gradient-to-r from-indigo-400 to-emerald-400"
                  :value="stats.aiRoi?.adoptionRates?.catalog || 0" />
              </div>
            </div>
          </div>

          <!-- Lado direito: custo + ação -->
          <div class="flex flex-col lg:w-72 shrink-0 gap-4 rounded-[.5rem] border border-white/10 bg-white/[0.04] p-4">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <div class="w-9 h-9 rounded-[.5rem] bg-white/[0.06] border border-white/10 flex items-center justify-center text-indigo-300">
                  <Coins class="w-4 h-4" />
                </div>
                <div>
                  <p class="text-xs text-slate-400 leading-none">Seu saldo</p>
                  <p class="text-lg font-semibold text-white leading-tight">{{ profile?.creditsBalance ?? 0 }} <span class="text-xs font-medium text-slate-400">créditos</span></p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-xs text-slate-400 leading-tight">Custo da análise</p>
                <p class="text-sm font-semibold text-white leading-tight">{{ getCost('analyzeReport') }} créditos</p>
              </div>
            </div>

            <BaseButton data-tour="dashboard-ai-report" @click="isReportDrawerOpen = true" :disabled="isAnalyzing"
              variant="primary"
              class="w-full bg-gradient-to-r from-brand to-indigo-500 hover:from-brand-dark hover:to-indigo-600 border-0 shadow-lg shadow-indigo-900/40">
              <template v-if="isAnalyzing">
                <Loader2 class="w-5 h-5 animate-spin mr-2" /> Analisando dados...
              </template>
              <template v-else>
                <Sparkles class="w-5 h-5 mr-2" /> Gerar relatório IA
              </template>
            </BaseButton>

            <div class="flex items-center justify-between text-xs">
              <button type="button" @click="isCostTableModalOpen = true"
                class="text-slate-400 hover:text-white transition-colors font-medium flex items-center gap-1 cursor-pointer">
                Tabela de custos <ChevronRight class="w-3.5 h-3.5" />
              </button>
              <NuxtLink to="/planos"
                class="text-indigo-300 hover:text-indigo-200 font-medium flex items-center gap-1">
                Recarregar <Coins class="w-3.5 h-3.5" />
              </NuxtLink>
            </div>
            <p class="text-[11px] text-slate-500">{{ periodLabel }}</p>
          </div>
        </div>
      </BaseCard>

      <!-- Funil Comercial & Upsell -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        <!-- Funil Comercial -->
        <BaseCard title="Funil Comercial e Conversão" class="lg:col-span-2">
          <div class="space-y-5">
            <!-- Em Aberto -->
            <div class="flex items-center gap-4">
              <span class="w-24 shrink-0 text-sm font-medium text-muted">Em aberto</span>
              <BaseProgressBar height="h-2" class="flex-1" color="bg-blue-500"
                :value="stats.proposalsCount > 0 ? (stats.pendingCount / stats.proposalsCount * 100) : 0" />
              <span class="w-36 shrink-0 text-right text-sm font-medium text-ink dark:text-gray-100">
                {{ stats.pendingCount }} <span class="text-muted font-normal">aguardando</span>
              </span>
            </div>

            <!-- Aceitos -->
            <div class="flex items-center gap-4">
              <span class="w-24 shrink-0 text-sm font-medium text-muted">Aceitos</span>
              <BaseProgressBar height="h-2" class="flex-1" color="bg-emerald-500"
                :value="stats.proposalsCount > 0 ? (stats.acceptedCount / stats.proposalsCount * 100) : 0" />
              <span class="w-36 shrink-0 text-right text-sm font-medium text-ink dark:text-gray-100">
                {{ stats.acceptedCount }} <span class="text-muted font-normal">fechados</span>
              </span>
            </div>

            <!-- Enviados -->
            <div class="flex items-center gap-4">
              <span class="w-24 shrink-0 text-sm font-medium text-muted">Enviados</span>
              <BaseProgressBar height="h-2" class="flex-1" color="bg-blue-400"
                :value="stats.proposalsCount > 0 ? ((stats.sentCount ?? stats.proposalsCount) / stats.proposalsCount * 100) : 0" />
              <span class="w-36 shrink-0 text-right text-sm font-medium text-ink dark:text-gray-100">
                {{ stats.sentCount ?? stats.proposalsCount }} <span class="text-muted font-normal">no total</span>
              </span>
            </div>

            <!-- Upsell -->
            <div class="pt-5 border-t border-line dark:border-gray-800 flex items-center justify-between gap-4">
              <div>
                <h4 class="text-sm font-semibold text-ink dark:text-gray-100">Receita de itens opcionais</h4>
                <p class="helper-text mt-0.5">Faturamento extra trazido por opcionais aceitos nas propostas.</p>
              </div>
              <div class="text-right shrink-0">
                <p class="text-[10px] font-medium text-muted">Valor adicional</p>
                <p class="text-lg font-semibold text-emerald-600 dark:text-emerald-400">R$ {{ (stats.upsellRevenue ??
                  0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- Alertas de Follow-ups Inteligentes -->
        <BaseCard title="Ações e Follow-ups" class="lg:col-span-1">

          <div class="space-y-3">

            <div v-for="alert in stats.followUpAlerts" :key="alert.id"
              class="bg-soft dark:bg-gray-900 rounded-[.5rem] border border-line dark:border-gray-800 p-3.5 space-y-3">
              <div class="flex items-start justify-between gap-2">
                <span class="text-[10px] font-semibold text-muted truncate">{{ alert.code }}</span>
                <BaseBadge variant="warning" light>
                  {{ alert.daysAgo === 0 ? 'Pendente hoje' : `Pendente há ${alert.daysAgo}d` }}
                </BaseBadge>
              </div>

              <p class="text-sm font-medium text-ink dark:text-gray-100">
                Cliente: <span class="font-semibold">{{ alert.clientName }}</span>
              </p>

              <div class="flex items-center gap-2">
                <BaseButton type="link" :href="`https://wa.me/${alert.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${alert.clientName}, gostaria de confirmar se conseguiu visualizar a proposta comercial que enviei? Qualquer dúvida fico à disposição!`)}`"
                  target="_blank" variant="whatsapp" size="sm" class="w-full">
                  <img :src="'/images/icons/whatsapp-svg.svg'" class="w-3.5 h-3.5 mr-1" alt="WhatsApp" loading="lazy" />
                  WhatsApp
                </BaseButton>

                <BaseButton type="link" :href="`${publicProposalUrl}/p/${alert.slug}?t=${alert.token}`" target="_blank" variant="outline" size="sm" class="w-full">Ver Proposta</BaseButton>
              </div>
            </div>

            <div v-if="!stats.followUpAlerts?.length" class="text-center py-8 space-y-3">
              <div
                class="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 class="w-6 h-6" />
              </div>
              <p class="text-sm text-muted">Tudo em ordem! Nenhuma proposta pendente presa no funil.</p>
            </div>
          </div>
        </BaseCard>

      </section>

      <!-- Gráficos de Evolução de Faturamento e Status -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        <!-- Gráfico de Evolução de Faturamento -->
        <BaseCard title="Evolução do Faturamento" class="lg:col-span-2">
          <div class="h-80 relative">
            <Line :data="revenueChartData" :options="lineChartOptions" />
          </div>
        </BaseCard>

        <!-- Distribuição de Status -->
        <BaseCard title="Status dos Orçamentos" class="lg:col-span-1">
          
          <div class="h-80 relative flex items-center justify-center">
            <Doughnut :data="statusChartData" :options="chartOptions" />
          </div>
        </BaseCard>

      </section>

      <!-- Tracking de Abertura & Ranking de Clientes -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        <!-- Tracking de Aberturas em Tempo Real -->
        <BaseCard title="Visualizações Recentes (Tracking)" class="lg:col-span-2" noPadding>
          <div>

            <BaseTable
              :columns="[
                { key: 'proposalCode', label: 'Orçamento' },
                { key: 'clientName', label: 'Cliente' },
                { key: 'browser', label: 'Navegador' },
                { key: 'minutesAgo', label: 'Quando', align: 'right' }
              ]"
              :items="stats.trackingViews || []"
            >
              <template #cell-proposalCode="{ item }">
                <div class="text-sm font-medium text-ink dark:text-gray-100">
                  {{ item.proposalCode }}
                  <span
                    class="block text-xs text-muted truncate max-w-[250px] md:max-w-[150px]"
                  >
                    {{ item.proposalTitle }}
                  </span>
                </div>
              </template>

              <template #cell-clientName="{ item }">
                <div class="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {{ item.clientName }}
                  <span class="block text-xs text-muted truncate max-w-[180px]">
                    {{ item.location }}
                  </span>
                </div>
              </template>

              <template #cell-minutesAgo="{ value }">
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ formatRelativeTime(value) }}
                </span>
              </template>

              <template #empty>
                <div class="py-10 text-center space-y-2">
                  <div class="w-12 h-12 bg-soft dark:bg-gray-900 text-muted rounded-full flex items-center justify-center mx-auto">
                    <Activity class="w-6 h-6" />
                  </div>
                  <p class="text-sm font-medium text-muted">Nenhuma visualização recente</p>
                  <p class="text-xs text-muted/80">Quando alguém abrir sua proposta, aparece aqui.</p>
                </div>
              </template>
            </BaseTable>
          </div>
        </BaseCard>

        <!-- Ranking de Clientes (Faturamento)-->
        <BaseCard title="Top Clientes" class="lg:col-span-1">

          <div class="space-y-3">
            <BaseCard v-for="(client, idx) in stats.clientRanking" :key="idx" color="slate" compact noPadding>
              <div class="flex items-center gap-3 px-4 py-3">
                <div
                  class="w-7 h-7 bg-soft dark:bg-gray-950 rounded-[.5rem] border border-line dark:border-gray-800 flex items-center justify-center text-xs font-semibold text-muted shrink-0">
                  #{{ (idx as number) + 1 }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-ink dark:text-gray-100 truncate">{{ client.name }}</p>
                  <BaseProgressBar height="h-1" class="mt-1.5" color="bg-brand"
                    :value="stats.totalRevenue > 0 ? ((client.revenue as number) / stats.totalRevenue * 100) : 0" />
                </div>
                <div class="text-right shrink-0">
                  <p class="text-sm font-semibold text-ink dark:text-gray-100">R$ {{ (client.revenue as
                    number).toLocaleString('pt-BR') }}</p>
                </div>
              </div>
            </BaseCard>

            <div v-if="!stats.clientRanking?.length"
              class="text-center py-12 text-gray-400 dark:text-gray-500 text-xs font-semibold">
              Nenhum dado de receita disponível.
            </div>
          </div>
        </BaseCard>

      </section>

    </template>

    <!-- Modal do Relatório IA -->
    <BaseDialog :open="!!aiReport" @update:open="(val) => !val ? aiReport = null : null"
      title="Relatório Estratégico IA" size="lg" @close="aiReport = null">
      <div
        class="prose prose-blue max-w-none p-4 prose-headings:font-black prose-headings:prose-headings:tracking-tight prose-p:font-medium prose-p:text-gray-600 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
        <div v-html="aiReport ? $md.render(aiReport) : ''"></div>
      </div>
      <template #footer>
        <div class="flex justify-between w-full items-center">
          <NuxtLink to="/relatorios"
            class="text-[10px] font-black text-blue-600 hover:underline">
            Ver todos os relatórios
          </NuxtLink>
          <BaseButton @click="aiReport = null">Entendido</BaseButton>
        </div>
      </template>
    </BaseDialog>

    <!-- Modal de Paywall Express -->
    <PaywallExpressModal v-model:open="isPaywallOpen" :reason="paywallReason" />

    <!-- Modal de Confirmação de Consumo de Crédito IA -->
    <ConfirmCreditDialog v-model:open="isCreditConfirmOpen" :title="confirmTitle" :description="confirmDescription"
      @confirm="handleCreditConfirm" @cancel="handleCreditCancel" />

    <!-- Modal da Tabela Transparente de Custos por Ação -->
    <BaseDialog v-model:open="isCostTableModalOpen" title="Tabela de Custos por Ação" size="xl">
      <div class="space-y-6 py-2">
        <p class="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed">
          Confira abaixo a relação completa de funcionalidades comerciais e de inteligência artificial da plataforma com
          os
          respectivos custos em créditos.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="item in actionCostsList" :key="item.key"
            class="bg-soft dark:bg-gray-800/60 p-5 rounded-[.5rem] border border-line dark:border-gray-700/60 flex flex-col justify-between space-y-4">
            <div class="space-y-2.5">
              <div class="flex items-center justify-between gap-2">
                <div
                  class="w-8 h-8 rounded-[.5rem] bg-white dark:bg-gray-700 flex items-center justify-center text-gray-900 dark:text-white border border-line dark:border-gray-600 shadow-sm shrink-0">
                  <component :is="item.icon" class="w-4 h-4 text-brand dark:text-brand" />
                </div>
                <span
                  :class="['text-[10px] font-semibold px-2 py-0.5 rounded-[.5rem] border', item.badgeColor]">
                  {{ item.badge }}
                </span>
              </div>
              <div>
                <h4 class="text-sm font-semibold text-gray-900 dark:text-white">{{ item.name }}
                </h4>
                <p class="text-xs font-normal text-muted dark:text-gray-400 mt-1 leading-relaxed">{{
                  item.description
                  }}</p>
              </div>
            </div>

            <div class="pt-3 border-t border-line dark:border-gray-700/50 flex items-center justify-between">
              <span class="text-xs font-medium text-muted">Custo</span>
              <span
                class="text-sm font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-900 px-3 py-1 rounded-[.5rem] border border-line dark:border-gray-700">
                {{ costText(item.key) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <BaseButton variant="secondary" size="sm" @click="isCostTableModalOpen = false">Fechar</BaseButton>
      </template>
    </BaseDialog>

    <!-- Drawer de Geração de Relatório IA -->
    <GenerateReportDrawer v-model:open="isReportDrawerOpen" :period="period" :period-label="periodLabel" :stats="stats"
      :credits-balance="profile?.creditsBalance || 0" :credit-cost="getCost('analyzeReport')" :loading="isAnalyzing"
      :allow-change-period="true" @confirm="confirmAndGenerateReport" />

  </div>
</template>

<style scoped src="./index.css"></style>
