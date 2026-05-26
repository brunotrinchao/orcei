<script setup lang="ts">
import { 
  Sparkles, Loader2, ArrowUpRight, CheckCircle2, Clock, DollarSign, 
  TrendingUp, BarChart3, Users, FileText, ChevronRight, Activity, 
  Calendar, Award, Zap, ShieldCheck, Share2, MessageSquare, AlertCircle 
} from 'lucide-vue-next'
import { Line, Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, ArcElement } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, ArcElement)

const period = ref('last_30_days')
const { loggedIn, user } = useUserSession()
const { notify } = useAlerts()

const fetchQuery = computed(() => {
  const now = new Date()
  let start = new Date()
  
  if (period.value === 'last_7_days') start.setDate(now.getDate() - 7)
  else if (period.value === 'last_30_days') start.setDate(now.getDate() - 30)
  else if (period.value === 'last_90_days') start.setDate(now.getDate() - 90)
  else if (period.value === 'year') start = new Date(now.getFullYear(), 0, 1)
  else return {}

  return {
    start: start.toISOString(),
    end: now.toISOString()
  }
})

const { data: stats, refresh, status } = useLazyFetch<any>('/api/dashboard/stats', {
  key: 'dashboard-stats',
  query: fetchQuery,
  watch: [period]
})

// Status Distribution Chart (Safira Theme)
const statusChartData = computed(() => {
  if (!stats.value?.statusDistribution) return { labels: [], datasets: [] }
  
  const labels = Object.keys(stats.value.statusDistribution)
  const data = Object.values(stats.value.statusDistribution) as number[]
  
  return {
    labels,
    datasets: [{
      data,
      backgroundColor: ['#6366F1', '#10B981', '#3B82F6', '#EF4444', '#6B7280'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  }
})

// Revenue Evolution Chart (Gradient Sapphire Area)
const revenueChartData = computed(() => {
  if (!stats.value?.revenueHistory) return { labels: [], datasets: [] }

  return {
    labels: stats.value.revenueHistory.map((h: any) => h.date),
    datasets: [{
      label: 'Faturamento R$',
      data: stats.value.revenueHistory.map((h: any) => h.amount),
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#3B82F6',
      pointBorderWidth: 2,
      pointBorderColor: '#ffffff'
    }]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        font: { weight: 'bold' as const, size: 10 },
        color: '#4B5563'
      }
    }
  }
}

const aiReport = ref<string | null>(null)
const isAnalyzing = ref(false)
const isPaywallOpen = ref(false)
const paywallReason = ref('')

async function generateAIReport() {
  isAnalyzing.value = true
  try {
    const data: any = await $fetch('/api/ai/analyze')
    aiReport.value = data.text
    refresh()
  } catch (e: any) {
    if (e.statusCode === 402) {
      paywallReason.value = 'gerar relatório estratégico de IA'
      isPaywallOpen.value = true
    } else if (e.statusCode === 429) {
      notify('Limite Atingido', 'Você fez muitas requisições seguidas. Tente novamente em um minuto.')
    } else {
      notify('Erro', e.data?.statusMessage || 'Erro ao gerar relatório estratégico')
    }
  } finally {
    isAnalyzing.value = false
  }
}


// Auxiliar de formato de data relativa
function formatRelativeTime(minutesAgo: number) {
  if (minutesAgo < 60) return `há ${minutesAgo} min`
  const hours = Math.floor(minutesAgo / 60)
  if (hours < 24) return `há ${hours}h`
  return `há ${Math.floor(hours / 24)} dias`
}
</script>

<template>
  <div class="space-y-10 relative">
    
    <!-- Filtros de Período e Título -->
    <header class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div>
        <h1 class="text-3xl font-black text-gray-900 tracking-tight uppercase">Cockpit Comercial</h1>
        <p class="text-gray-500 font-medium">Acompanhe suas conversões, produtividade IA e receitas acumuladas.</p>
      </div>

      <div class="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide bg-gray-100/80 p-1.5 rounded-3xl border border-gray-200/50">
        <button 
          v-for="p in [
            { label: '7D', value: 'last_7_days' },
            { label: '30D', value: 'last_30_days' },
            { label: '90D', value: 'last_90_days' },
            { label: 'Este Ano', value: 'year' },
            { label: 'Total', value: 'all' }
          ]" 
          :key="p.value"
          @click="period = p.value"
          :class="period === p.value ? 'bg-white text-blue-600 shadow-sm font-black' : 'text-gray-500 hover:text-gray-900 font-bold'"
          class="px-5 py-2 rounded-2xl text-[10px] uppercase tracking-widest transition-all whitespace-nowrap"
        >
          {{ p.label }}
        </button>
      </div>
    </header>

    <!-- Loading State Geral -->
    <div v-if="status === 'pending' && !stats" class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div v-for="i in 4" :key="i" class="h-36 bg-gray-100 animate-pulse rounded-[2.5rem]"></div>
    </div>

    <template v-else-if="stats">
      
      <!-- Seção Principal de Métricas Claves -->
      <section class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        
        <!-- Receita Confirmada -->
        <div class="bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group flex flex-col justify-between">
          <div class="flex justify-between items-start mb-3 md:mb-4">
            <div class="w-8 h-8 md:w-12 md:h-12 bg-green-50 text-green-600 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
              <DollarSign class="w-4 h-4 md:w-6 md:h-6" />
            </div>
            <span class="hidden md:inline-block text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-50 px-2.5 py-1 rounded-lg">Faturado</span>
          </div>
          <div>
            <p class="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">Faturamento</p>
            <h3 class="text-lg md:text-3xl font-black text-gray-900 tracking-tight truncate">
              R$ {{ (stats.totalRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }}
            </h3>
            <p class="hidden md:block text-[10px] text-gray-400 mt-1 font-semibold truncate">{{ stats.acceptedCount }} orçamentos convertidos</p>
          </div>
        </div>

        <!-- Conversão Geral -->
        <div class="bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group flex flex-col justify-between">
          <div class="flex justify-between items-start mb-3 md:mb-4">
            <div class="w-8 h-8 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <TrendingUp class="w-4 h-4 md:w-6 md:h-6" />
            </div>
            <span class="hidden md:inline-block text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-lg">Sucesso</span>
          </div>
          <div>
            <p class="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">Conversão</p>
            <h3 class="text-xl md:text-3xl font-black text-gray-900 tracking-tight">
              {{ Math.round(stats.approvalRate ?? 0) }}%
            </h3>
            <p class="hidden md:block text-[10px] text-gray-400 mt-1 font-semibold truncate">{{ stats.proposalsCount }} orçamentos totais</p>
          </div>
        </div>

        <!-- TMA (Tempo Médio de Atendimento/Fechamento) -->
        <div class="bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group flex flex-col justify-between">
          <div class="flex justify-between items-start mb-3 md:mb-4">
            <div class="w-8 h-8 md:w-12 md:h-12 bg-purple-50 text-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Clock class="w-4 h-4 md:w-6 md:h-6" />
            </div>
            <span class="hidden md:inline-block text-[9px] font-black text-purple-500 uppercase tracking-widest bg-purple-50 px-2.5 py-1 rounded-lg">Agilidade</span>
          </div>
          <div>
            <p class="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">TMA</p>
            <h3 class="text-xl md:text-3xl font-black text-gray-900 tracking-tight">
              {{ stats.tmaHours > 24 ? `${Math.round(stats.tmaHours / 24)}d` : `${Math.round(stats.tmaHours || 0)}h` }}
            </h3>
            <p class="hidden md:block text-[10px] text-gray-400 mt-1 font-semibold truncate">tempo médio p/ aceite</p>
          </div>
        </div>

        <!-- SLA Comercial (Fechados em < 48h) -->
        <div class="bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group flex flex-col justify-between">
          <div class="flex justify-between items-start mb-3 md:mb-4">
            <div class="w-8 h-8 md:w-12 md:h-12 bg-orange-50 text-orange-600 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <ShieldCheck class="w-4 h-4 md:w-6 md:h-6" />
            </div>
            <span class="hidden md:inline-block text-[9px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-2.5 py-1 rounded-lg">Meta</span>
          </div>
          <div>
            <p class="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">SLA 48h</p>
            <h3 class="text-xl md:text-3xl font-black text-gray-900 tracking-tight">
              {{ Math.round(stats.slaRate ?? 0) }}%
            </h3>
            <p class="hidden md:block text-[10px] text-gray-400 mt-1 font-semibold truncate">fechados na meta</p>
          </div>
        </div>

      </section>

      <!-- Cartão Premium Glowing ROI de Inteligência Artificial -->
      <section class="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-[3rem] shadow-2xl border border-indigo-500/20 shadow-indigo-500/5 group">
        <!-- Glow decorativo de IA -->
        <div class="absolute -top-10 -right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl opacity-60 group-hover:bg-indigo-500/20 transition-all duration-700"></div>
        <div class="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl opacity-60"></div>
        
        <div class="relative flex flex-col lg:flex-row justify-between items-stretch gap-8 z-10">
          <!-- Textos e ROI Geral -->
          <div class="space-y-6 flex-1">
            <div class="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 backdrop-blur-md rounded-full text-indigo-200 text-[9px] font-black uppercase tracking-widest border border-indigo-500/30">
                <Sparkles class="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Inteligência Artificial Orcei Fácil
              </div>
              <p class="text-slate-400 font-bold text-xs">
                Sua IA Copilot está ativa economizando trabalho manual.
              </p>
            </div>
            
            <div class="space-y-2">
              <h2 class="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                Você poupou <span class="text-indigo-400 font-extrabold">{{ stats.aiRoi?.timeSavedHours }}h {{ stats.aiRoi?.timeSavedMinutes }}m</span> de redação comercial!
              </h2>
              <p class="text-slate-400 text-sm max-w-2xl leading-relaxed">
                Cada proposta assistida e item do catálogo otimizado com IA economiza em média 12 minutos de digitação, correção e formatação burocrática de contratos.
              </p>
            </div>

            <!-- Barras de Adoção de IA -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div class="space-y-2">
                <div class="flex justify-between text-xs font-bold text-slate-300">
                  <span class="uppercase tracking-widest text-[9px] text-slate-400">Adoção IA em Propostas</span>
                  <span>{{ Math.round(stats.aiRoi?.adoptionRates?.proposals || 0) }}%</span>
                </div>
                <div class="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" :style="{ width: (stats.aiRoi?.adoptionRates?.proposals || 0) + '%' }"></div>
                </div>
              </div>
              
              <div class="space-y-2">
                <div class="flex justify-between text-xs font-bold text-slate-300">
                  <span class="uppercase tracking-widest text-[9px] text-slate-400">Adoção IA em Catálogo</span>
                  <span>{{ Math.round(stats.aiRoi?.adoptionRates?.catalog || 0) }}%</span>
                </div>
                <div class="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full" :style="{ width: (stats.aiRoi?.adoptionRates?.catalog || 0) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Créditos Consumidos & Botão de Geração -->
          <div class="flex flex-col justify-between items-center lg:items-end gap-6 bg-slate-950/40 p-6 rounded-[2rem] border border-white/5 lg:w-80 shrink-0">
            <div class="w-full text-center lg:text-right">
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Créditos de IA Usados</p>
              <p class="text-3xl font-black text-white">
                {{ stats.aiRoi?.creditsUsed }} <span class="text-xs font-bold text-slate-500">/ {{ stats.aiRoi?.creditsLimit }}</span>
              </p>
            </div>
            
            <div class="w-full space-y-3">
              <BaseButton 
                @click="generateAIReport"
                :disabled="isAnalyzing"
                variant="primary" 
                class="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-4 text-xs font-black tracking-widest uppercase shadow-xl shadow-indigo-600/10"
              >
                <template v-if="isAnalyzing">
                  <Loader2 class="w-4 h-4 animate-spin mr-2" /> Analisando Dados...
                </template>
                <template v-else>
                  Gerar Relatório IA (1 Crédito)
                </template>
              </BaseButton>


              <NuxtLink 
                to="/planos"
                class="block w-full text-center py-2 text-[9px] font-black text-indigo-400 hover:text-indigo-300 tracking-[0.15em] uppercase hover:underline"
              >
                Obter Créditos Premium
              </NuxtLink>
            </div>
          </div>

        </div>
      </section>

      <!-- Funil Comercial & Opcionais de Upsell -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Funil Comercial Horizontal -->
        <div class="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-sm font-black text-gray-900 uppercase tracking-widest">Funil Comercial e Conversão</h3>
              <span class="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">Passos de Vendas</span>
            </div>
            
            <div class="space-y-4">
              <!-- Rascunho -->
              <div class="flex items-center gap-4">
                <span class="w-20 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Rascunhos</span>
                <div class="flex-1 h-10 bg-slate-50 rounded-xl relative overflow-hidden">
                  <div class="h-full bg-slate-200/70" :style="{ width: stats.proposalsCount > 0 ? (stats.draftCount / stats.proposalsCount * 100) + '%' : '0%' }"></div>
                  <span class="absolute inset-y-0 left-4 flex items-center text-xs font-bold text-gray-700">
                    {{ stats.draftCount }} rascunhos em elaboração
                  </span>
                </div>
              </div>

              <!-- Criado/Pendente (Enviado) -->
              <div class="flex items-center gap-4">
                <span class="w-20 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Enviados</span>
                <div class="flex-1 h-10 bg-blue-50/50 rounded-xl relative overflow-hidden">
                  <div class="h-full bg-blue-100" :style="{ width: stats.proposalsCount > 0 ? (stats.pendingCount / stats.proposalsCount * 100) + '%' : '0%' }"></div>
                  <span class="absolute inset-y-0 left-4 flex items-center text-xs font-bold text-blue-800">
                    {{ stats.pendingCount }} orçamentos aguardando resposta
                  </span>
                </div>
              </div>

              <!-- Aceitos (Finalizados) -->
              <div class="flex items-center gap-4">
                <span class="w-20 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aceitos</span>
                <div class="flex-1 h-10 bg-emerald-50 rounded-xl relative overflow-hidden">
                  <div class="h-full bg-emerald-100" :style="{ width: stats.proposalsCount > 0 ? (stats.acceptedCount / stats.proposalsCount * 100) + '%' : '0%' }"></div>
                  <span class="absolute inset-y-0 left-4 flex items-center text-xs font-bold text-emerald-800">
                    {{ stats.acceptedCount }} orçamentos fechados ({{ Math.round(stats.approvalRate) }}% conversão)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Receita de Opcionais (Upsell) -->
          <div class="mt-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50/20 border border-emerald-100 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4">
            <div class="space-y-1 text-center sm:text-left">
              <span class="text-[9px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-100/60 px-2 py-0.5 rounded-full">Exclusivo Upsell</span>
              <h4 class="font-black text-gray-900 uppercase text-xs tracking-widest">Receita de Itens Opcionais</h4>
              <p class="text-xs text-gray-500 font-medium leading-relaxed">Faturamento extra trazido por opcionais aceitos pelos clientes nas propostas.</p>
            </div>
            
            <div class="text-center sm:text-right shrink-0 bg-white px-6 py-3 rounded-2xl border border-emerald-100 shadow-sm">
              <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest">Valor Adicional</p>
              <p class="text-xl font-black text-emerald-600">R$ {{ (stats.upsellRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
            </div>
          </div>

        </div>

        <!-- Alertas de Follow-ups Inteligentes -->
        <div class="lg:col-span-1 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
          <div class="flex justify-between items-center">
            <h3 class="text-sm font-black text-gray-900 uppercase tracking-widest">Ações e Follow-ups</h3>
            <AlertCircle class="w-5 h-5 text-indigo-500" />
          </div>
          
          <div class="space-y-4">
            <div 
              v-for="alert in stats.followUpAlerts" 
              :key="alert.id" 
              class="p-5 bg-orange-50/40 border border-orange-100 rounded-3xl space-y-3 hover:border-orange-200 transition-colors"
            >
              <div class="flex justify-between items-start">
                <span class="text-[8px] font-black text-orange-600 uppercase tracking-widest bg-orange-100/50 px-2 py-0.5 rounded-full">
                  Pendente {{ alert.daysAgo }} dias
                </span>
                <span class="text-[10px] font-bold text-gray-400">{{ alert.code }}</span>
              </div>
              
              <div class="space-y-1">
                <h4 class="text-xs font-black text-gray-800 truncate uppercase">{{ alert.title }}</h4>
                <p class="text-[10px] text-gray-500 font-bold">Cliente: {{ alert.clientName }}</p>
              </div>

              <div class="flex items-center gap-2 pt-1">
                <a 
                  v-if="alert.clientPhone"
                  :href="`https://wa.me/${alert.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${alert.clientName}, gostaria de confirmar se conseguiu visualizar a proposta comercial que enviei? Qualquer dúvida fico à disposição!`)}`"
                  target="_blank"
                  class="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  <img :src="'/images/icons/whatsapp-svg.svg'" class="w-3.5 h-3.5" alt="WhatsApp" /> Chamar WhatsApp
                </a>
                <NuxtLink 
                  to="/orcamentos"
                  class="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  Ver Proposta
                </NuxtLink>
              </div>
            </div>
            
            <div v-if="!stats.followUpAlerts?.length" class="text-center py-10 space-y-3">
              <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 class="w-6 h-6" />
              </div>
              <p class="text-xs text-gray-400 font-semibold">Tudo em ordem! Nenhuma proposta pendente presa no funil.</p>
            </div>
          </div>
        </div>

      </section>

      <!-- Gráficos de Evolução de Faturamento e Status -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Gráfico de Evolução de Faturamento -->
        <div class="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
          <div class="flex justify-between items-center">
            <h3 class="text-sm font-black text-gray-900 uppercase tracking-widest">Evolução do Faturamento</h3>
            <BarChart3 class="w-5 h-5 text-gray-400" />
          </div>
          <div class="h-80 relative">
            <Line :data="revenueChartData" :options="{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }" />
          </div>
        </div>

        <!-- Distribuição de Status -->
        <div class="lg:col-span-1 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
          <div class="flex justify-between items-center">
            <h3 class="text-sm font-black text-gray-900 uppercase tracking-widest">Status dos Orçamentos</h3>
            <Activity class="w-5 h-5 text-gray-400" />
          </div>
          <div class="h-80 relative flex items-center justify-center">
            <Doughnut :data="statusChartData" :options="chartOptions" />
          </div>
        </div>

      </section>

      <!-- Tracking de Abertura & Ranking de Clientes -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Tracking de Aberturas em Tempo Real -->
        <div class="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-sm font-black text-gray-900 uppercase tracking-widest">Visualizações Recentes (Tracking)</h3>
              <span class="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
            </div>
            
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-gray-100">
                    <th class="pb-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Orçamento</th>
                    <th class="pb-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                    <th class="pb-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Navegador</th>
                    <th class="pb-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Quando</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr v-for="(view, idx) in stats.trackingViews" :key="idx" class="hover:bg-gray-50/40 transition-colors">
                    <td class="py-4 text-xs font-bold text-gray-900">
                      {{ view.proposalCode }}
                      <span class="block text-[9px] text-gray-400 font-bold truncate max-w-[150px]">{{ view.proposalTitle }}</span>
                    </td>
                    <td class="py-4 text-xs font-bold text-gray-600">
                      {{ view.clientName }}
                      <span class="block text-[8px] text-gray-400 uppercase font-black tracking-wider">{{ view.location }}</span>
                    </td>
                    <td class="py-4 text-[10px] text-gray-400 font-bold">{{ view.browser }}</td>
                    <td class="py-4 text-xs font-black text-gray-900 text-right">
                      {{ formatRelativeTime(view.minutesAgo) }}
                    </td>
                  </tr>
                  <tr v-if="!stats.trackingViews?.length">
                    <td colspan="4" class="py-12 text-center text-gray-400 text-xs font-semibold">
                      Nenhuma visualização de proposta registrada ainda.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Ranking de Clientes (Faturamento) -->
        <div class="lg:col-span-1 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
          <div class="flex justify-between items-center">
            <h3 class="text-sm font-black text-gray-900 uppercase tracking-widest">Top Clientes</h3>
            <NuxtLink to="/clientes" class="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800">Ver Todos</NuxtLink>
          </div>
          
          <div class="space-y-4">
            <div 
              v-for="(client, idx) in stats.clientRanking" 
              :key="idx" 
              class="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors group"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:border-blue-200 group-hover:text-blue-600 transition-all">
                  #{{ (idx as number) + 1 }}
                </div>
                <div>
                  <p class="text-xs font-bold text-gray-900 truncate max-w-[120px]">{{ client.name }}</p>
                  <p class="text-[8px] font-black text-gray-400 uppercase tracking-wider">Faturamento total</p>
                </div>
              </div>
              
              <div class="text-right">
                <p class="text-xs font-black text-gray-900">R$ {{ (client.revenue as number).toLocaleString('pt-BR') }}</p>
                <div class="w-16 h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                  <div class="h-full bg-blue-600 rounded-full" :style="{ width: ((client.revenue as number) / stats.totalRevenue * 100) + '%' }"></div>
                </div>
              </div>
            </div>
            
            <div v-if="!stats.clientRanking?.length" class="text-center py-12 text-gray-400 text-xs font-semibold">
              Nenhum dado de receita disponível.
            </div>
          </div>
        </div>

      </section>

    </template>

    <!-- Modal do Relatório IA -->
    <BaseDialog :open="!!aiReport" @update:open="(val) => !val ? aiReport = null : null" title="Relatório Estratégico IA" size="lg" @close="aiReport = null">
      <div class="prose prose-blue max-w-none p-4 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-p:font-medium prose-p:text-gray-600 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
        <div v-html="aiReport ? $md.render(aiReport) : ''"></div>
      </div>
      <template #footer>
        <div class="flex justify-between w-full items-center">
          <NuxtLink to="/relatorios" class="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">
            Ver todos os relatórios
          </NuxtLink>
          <BaseButton @click="aiReport = null">Entendido</BaseButton>
        </div>
      </template>
    </BaseDialog>

    <!-- Modal de Paywall Express -->
    <PaywallExpressModal 
      v-model:open="isPaywallOpen" 
      :reason="paywallReason" 
    />


  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
