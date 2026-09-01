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

    <!-- Filtros de Período e Título -->
    <PageHeader title="Cockpit Comercial" subtitle="Acompanhe suas conversões, produtividade IA e receitas acumuladas.">
      
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

      <!-- Cartão Premium Glowing ROI de Inteligência Artificial -->
       <BaseCard class="lg:col-span-1" color="ia" >

        <div class="relative flex flex-col lg:flex-row justify-between items-stretch gap-4 sm:gap-6 z-10">
          <!-- Textos e ROI Geral -->
          <div class="space-y-3 flex-1">
            <div class="flex flex-col md:flex-row items-start md:items-center gap-2 sm:gap-4">
              <div
                class="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-500/20 backdrop-blur-md rounded-full text-indigo-200 text-[9px] font-semibold tracking-wide border border-indigo-500/30">
                <Sparkles class="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Inteligência Artificial Orcei Fácil
              </div>
              <p class="text-slate-400 font-bold text-xs  hidden sm:inline">
                Sua IA Copilot está ativa economizando trabalho manual.
              </p>
            </div>

            <div class="space-y-2">
              <h2 class="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                Você poupou <span class="text-indigo-400 font-extrabold">{{ stats.aiRoi?.timeSavedHours }}h {{
                  stats.aiRoi?.timeSavedMinutes }}m</span> de redação comercial!
              </h2>
              <p class="text-slate-400 text-sm max-w-2xl leading-relaxed hidden sm:inline">
                Cada proposta assistida e item do catálogo otimizado com IA economiza em média 12 minutos de digitação,
                correção e formatação burocrática de contratos.
              </p>
            </div>

            <!-- Barras de Adoção de IA -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div class="space-y-2 bg-slate-950/40 p-4 rounded-[.5rem] border border-white/5">
                <div class="flex justify-between text-xs font-bold text-slate-300">
                  <span class="tracking-wide text-[11px] text-slate-400">Adoção em Propostas</span>
                  <span class="text-indigo-400">{{ Math.round(stats.aiRoi?.adoptionRates?.proposals || 0) }}%</span>
                </div>
                <BaseProgressBar color="bg-gradient-to-r from-blue-500 to-indigo-500"
                  :value="stats.aiRoi?.adoptionRates?.proposals || 0"></BaseProgressBar>
              </div>

              <div class="space-y-2 bg-slate-950/40 p-4 rounded-[.5rem] border border-white/5">
                <div class="flex justify-between text-xs font-bold text-slate-300">
                  <span class="tracking-wide text-[11px] text-slate-400">Adoção no Catálogo</span>
                  <span class="text-emerald-400">{{ Math.round(stats.aiRoi?.adoptionRates?.catalog || 0) }}%</span>
                </div>
                <BaseProgressBar color="bg-gradient-to-r from-indigo-500 to-emerald-500"
                  :value="stats.aiRoi?.adoptionRates?.catalog || 0"></BaseProgressBar>
              </div>
            </div>
          </div>

          <!-- Painel Reformulado de Créditos e Ações de IA -->
          <div
            class="flex flex-col justify-between items-stretch gap-6 bg-slate-950/60 p-4 rounded-[.5rem] border border-white/10 lg:w-80 shrink-0 shadow-inner">
            <!-- Mini Cards de Saldo e Consumo -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <baseButton @click="isCostTableModalOpen = true" size="sm"
                  class="text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20 transition-all flex items-center gap-1 cursor-pointer active:scale-95 w-full">
                  Tabela de Custos
                  <ChevronRight class="w-3 h-3" />
                </baseButton>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <!-- Saldo Atual -->
                <div class="bg-slate-900/80 p-3 rounded-[.5rem] border border-white/5 space-y-1">
                  <div class="flex items-center gap-1.5 text-blue-400">
                    <Coins class="w-3.5 h-3.5 animate-pulse" />
                    <span class="text-[9px] font-black tracking-wider text-slate-400">Saldo</span>
                  </div>
                  <p class="text-xl font-black text-white leading-none">
                    {{ profile?.creditsBalance ?? 0 }} <span
                      class="text-[9px] font-bold text-slate-500 ml-1">Créditos</span>
                  </p>

                </div>

                <!-- Créditos Consumidos -->
                <div class="bg-slate-900/80 p-3 rounded-[.5rem] border border-white/5 space-y-1">
                  <div class="flex items-center gap-1.5 text-violet-400">
                    <Zap class="w-3.5 h-3.5" />
                    <span class="text-[9px] font-black tracking-wider text-slate-400">Utilizados</span>
                  </div>
                  <p class="text-xl font-black text-white leading-none">
                    {{ stats.aiRoi?.creditsUsed || 0 }}<span class="text-[9px] font-bold text-slate-500 ml-1">Total
                      geral</span>
                  </p>

                </div>
              </div>
              <!-- Ação Principal + Atalho para Recarga -->
              <div class="">
                <BaseButton data-tour="dashboard-ai-report" @click="isReportDrawerOpen = true" :disabled="isAnalyzing"
                  variant="primary"
                  class="w-full">
                  <template v-if="isAnalyzing">
                    <Loader2 class="w-4 h-4 animate-spin mr-2" /> Analisando Dados...
                  </template>
                  <template v-else>
                    <Sparkles class="w-4 h-4 text-indigo-200" /> Gerar relatório
                  </template>
                </BaseButton>

                <div class="flex items-center justify-between text-[9px] font-bold mt-2">
                  <span class="text-slate-500 tracking-wider">Período: {{ periodLabel }}</span>
                  <NuxtLink to="/planos"
                    class="text-indigo-400 hover:text-indigo-300 font-black tracking-wider hover:underline flex items-center gap-0.5">
                    Recarregar
                    <ChevronRight class="w-3 h-3" />
                  </NuxtLink>
                </div>
              </div>
            </div>



          </div>

        </div>
      </BaseCard>

      <!-- Funil Comercial & Opcionais de Upsell -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        <!-- Funil Comercial Horizontal -->
       <BaseCard title="Funil Comercial e Conversão" class="lg:col-span-2">
        <div class="space-y-4">
              <!-- Em Aberto / Enviados -->
              <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <span
                  class="w-full md:w-20 text-[10px] font-black text-gray-400 dark:text-gray-500 text-left md:text-right">Em
                  Aberto</span>
                <BaseProgressBar height="h-10" color="bg-blue-100 dark:bg-blue-900/50"
                  :value="stats.proposalsCount > 0 ? (stats.pendingCount / stats.proposalsCount * 100) : 0">
                  <template #footer>
                     <span
                    class="text-xs font-bold text-blue-800 dark:text-blue-300">
                    {{ stats.pendingCount }} orçamentos<span class="hidden sm:inline"> aguardando resposta do cliente</span>
                  </span>
                  </template>
                </BaseProgressBar>
              </div>

              <!-- Aceitos (Finalizados) -->
              <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <span
                  class="w-full md:w-20 text-[10px] font-black text-gray-400 dark:text-gray-500 text-left md:text-right">Aceitos</span>
                  <BaseProgressBar height="h-10" color="bg-emerald-100 dark:bg-emerald-900/50"
                  :value="stats.proposalsCount > 0 ? (stats.pendingCount / stats.proposalsCount * 100) : 0">
                  <template #footer>
                     <span
                    class="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    {{ stats.acceptedCount }} orçamentos<span class="hidden sm:inline"> fechados</span> ({{ Math.round(stats.approvalRate) }}% conversão)
                  </span>
                  </template>
                </BaseProgressBar>
              </div>
            </div>

            <div
            class="mt-8 p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-[.5rem] flex flex-col sm:flex-row justify-between items-center gap-4">
            <div class="space-y-1 text-center sm:text-left">
              <span
                class="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest bg-emerald-100/60 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">Exclusivo
                Upsell</span>
              <h4 class="font-black text-gray-900 dark:text-white text-xs ">Receita de Itens
                Opcionais</h4>
              <p class="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">Faturamento extra trazido
                por
                opcionais aceitos pelos clientes nas propostas.</p>
            </div>

            <div
              class="text-center sm:text-right shrink-0 bg-white dark:bg-gray-950 px-6 py-3 rounded-[.5rem] border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
              <p class="text-[8px] font-black text-gray-400 dark:text-gray-500 ">Valor
                Adicional</p>
              <p class="text-xl font-black text-emerald-600 dark:text-emerald-400">R$ {{ (stats.upsellRevenue ??
                0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
            </div>
          </div>
      </BaseCard>

        <!-- Alertas de Follow-ups Inteligentes -->
        <BaseCard title="Ações e Follow-ups" class="lg:col-span-1">

          <div class="space-y-4">

            <BaseCard v-for="alert in stats.followUpAlerts" :key="alert.id" noPadding color="slate" compact>
              <template #header>
                <div class="flex justify-between w-full">
                <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500">{{ alert.code }}</span>
                  <BaseBadge variant="warning" light>
                  {{ alert.daysAgo === 0 ? 'Pendente hoje' : `Pendente há ${alert.daysAgo}d` }}
                  </BaseBadge>
              </div>
              </template>
             <div class="px-6">
                <!-- <h4 class="text-xs font-black text-gray-800 dark:text-white truncate ">{{ alert.title }}</h4> -->
                <p class="text-xs text-gray-800 dark:text-gray-400 font-bold">Cliente: {{ alert.clientName }}</p>
              </div>
              <template #footer>
                  <div class="flex flex-1 flex-row items-center gap-2 pt-1">
                  <BaseButton type="link" :href="`https://wa.me/${alert.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${alert.clientName}, gostaria de confirmar se conseguiu visualizar a proposta comercial que enviei? Qualquer dúvida fico à disposição!`)}`"
                    target="_blank" variant="whatsapp" size="sm" class="w-full">
                    <img :src="'/images/icons/whatsapp-svg.svg'" class="w-3.5 h-3.5 mr-1" alt="WhatsApp" loading="lazy" />
                    WhatsApp</BaseButton>

                    <BaseButton type="link" :href="`${publicProposalUrl}/p/${alert.slug}?t=${alert.token}`" target="_blank" variant="outline" size="sm" class="w-full">Ver Proposta</BaseButton>
                </div>
              </template>
            </BaseCard>

            <div v-if="!stats.followUpAlerts?.length" class="text-center py-8 space-y-3">
              <div
                class="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-[.5rem] flex items-center justify-center mx-auto">
                <CheckCircle2 class="w-6 h-6" />
              </div>
              <p class="text-xs text-gray-400 dark:text-gray-500 font-semibold">Tudo em ordem! Nenhuma proposta pendente
                presa
                no funil.</p>
            </div>
          </div>
        </BaseCard>

      </section>

      <!-- Gráficos de Evolução de Faturamento e Status -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        <!-- Gráfico de Evolução de Faturamento -->
        <BaseCard title="Evolução do Faturamentos" class="lg:col-span-2">
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
                <div class="font-bold text-gray-900 dark:text-white">
                  {{ item.proposalCode }}
                  <span
                    class="block text-[9px] text-gray-400 dark:text-gray-500 font-bold truncate max-w-[250px] md:max-w-[150px] mt-0.5 md:mt-0"
                  >
                    {{ item.proposalTitle }}
                  </span>
                </div>
              </template>

              <template #cell-clientName="{ item }">
                <div class="font-bold text-gray-700 dark:text-gray-300">
                  {{ item.clientName }}
                  <span
                    class="block text-[9px] text-gray-400 dark:text-gray-500 font-semibold tracking-wider mt-0.5 md:mt-0"
                  >
                    {{ item.location }}
                  </span>
                </div>
              </template>

              <template #cell-minutesAgo="{ value }">
                <span class="font-semibold text-gray-900 dark:text-white font-sm">
                  {{ formatRelativeTime(value) }}
                </span>
              </template>
            </BaseTable>
          </div>
        </BaseCard>

        <!-- Ranking de Clientes (Faturamento)-->
         <BaseCard title="Top Clientes" class="lg:col-span-1">

          <div class="space-y-4">
            <BaseCard v-for="(client, idx) in stats.clientRanking" :key="idx" color="slate" compact>
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-center text-[10px] font-black text-gray-400 dark:text-gray-500 group-hover:border-blue-200 dark:group-hover:border-blue-900 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all">
                  #{{ (idx as number) + 1 }}
                </div>
                <div>
                  <p class="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{{ client.name }}
                  </p>
                  <p class="text-[8px] font-black text-gray-400 dark:text-gray-500 tracking-wider">Faturamento
                    total
                  </p>
                </div>
              </div>

              <div class="text-right">
                <p class="text-xs font-black text-gray-900 dark:text-white">R$ {{ (client.revenue as
                  number).toLocaleString('pt-BR') }}</p>
                  <BaseProgressBar color="bg-blue-600 dark:bg-blue-500" height="h-1" :value="((client.revenue as number) / stats.totalRevenue * 100)"></BaseProgressBar>
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
            class="bg-gray-50/60 dark:bg-gray-800/60 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex flex-col justify-between space-y-4">
            <div class="space-y-2.5">
              <div class="flex items-center justify-between gap-2">
                <div
                  class="w-8 h-8 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center text-gray-900 dark:text-white border border-gray-100 dark:border-gray-600 shadow-sm shrink-0">
                  <component :is="item.icon" class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span
                  :class="['text-[8px] font-black px-2 py-0.5 rounded-md border', item.badgeColor]">
                  {{ item.badge }}
                </span>
              </div>
              <div>
                <h4 class="text-sm font-black text-gray-900 dark:text-white tracking-tight">{{ item.name }}
                </h4>
                <p class="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{{
                  item.description
                  }}</p>
              </div>
            </div>

            <div class="pt-3 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
              <span class="text-[9px] font-black text-gray-400 ">Custo</span>
              <span
                class="text-xs font-black text-gray-900 dark:text-white bg-white dark:bg-gray-900 px-3 py-1 rounded-xl border border-gray-200/60 dark:border-gray-700">
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
