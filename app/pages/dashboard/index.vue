<script setup lang="ts">
import { 
  Sparkles, Loader2, ArrowUpRight, CheckCircle2, Clock, DollarSign, 
  TrendingUp, BarChart3, Users, FileText, ChevronRight, Activity, 
  Calendar, Award, Zap, ShieldCheck, Share2, MessageSquare, AlertCircle, Coins,
  UserPlus, Wand2, BookOpen, ReceiptText
} from 'lucide-vue-next'
import { Line, Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, ArcElement } from 'chart.js'
import GenerateReportDrawer from '~/components/reports/GenerateReportDrawer.vue'

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, ArcElement)

const period = ref('last_30_days')
const { loggedIn, user } = useUserSession()
const { openSetupWizard } = useOnboarding()
const { notify } = useAlerts()
const { isDark } = useDarkMode()
const { getCost, creditLabel } = useCreditCosts()
const config = useRuntimeConfig()
const publicProposalUrl = config.public.publicProposalUrl || ''

const { data: profile } = useLazyFetch<any>('/api/profile', { key: 'profile' })
const isCostTableModalOpen = ref(false)

function costText(action: string): string {
  const cost = getCost(action)
  return cost === 0 ? 'Grátis' : `${cost} ${cost === 1 ? 'crédito' : 'créditos'}`
}

const actionCostsList = computed(() => [
  {
    key: 'proposalSend',
    name: 'Envio de Proposta Comercial',
    description: 'Notificação por e-mail e disponibilização de link público rastreável com notificações em tempo real',
    icon: FileText,
    badge: 'Comercial',
    badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-100 dark:border-blue-900/40'
  },
  {
    key: 'proposalSuggest',
    name: 'Assistente de Orçamentos IA',
    description: 'Criação assistida de propostas comerciais completas e personalizadas a partir de texto livre',
    icon: Sparkles,
    badge: 'Inteligência Artificial',
    badgeColor: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-violet-100 dark:border-violet-900/40'
  },
  {
    key: 'clientExtract',
    name: 'Extração de Leads / Clientes',
    description: 'Identificação e cadastro automático de dados de contatos a partir de mensagens brutas de clientes',
    icon: UserPlus,
    badge: 'Inteligência Artificial',
    badgeColor: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-violet-100 dark:border-violet-900/40'
  },
  {
    key: 'generate',
    name: 'Gerador de Descrições de Itens',
    description: 'Redação profissional de escopos e descrições técnicas detalhadas para produtos ou serviços',
    icon: Wand2,
    badge: 'Inteligência Artificial',
    badgeColor: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-violet-100 dark:border-violet-900/40'
  },
  {
    key: 'catalogSuggest',
    name: 'Sugestão para Catálogo por IA',
    description: 'Enriquecimento de itens e sugestão inteligente de precificação para seu catálogo de serviços',
    icon: BookOpen,
    badge: 'Inteligência Artificial',
    badgeColor: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-violet-100 dark:border-violet-900/40'
  },
  {
    key: 'analyzeReport',
    name: 'Relatório Estratégico de IA',
    description: 'Análise avançada de métricas do funil comercial, projeções de receita e recomendações acionáveis',
    icon: ReceiptText,
    badge: 'Análise Estratégica',
    badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40'
  }
])

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

const chartOptions = computed(() => {
  const textColor = isDark.value ? '#9CA3AF' : '#4B5563'
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          font: { weight: 'bold' as const, size: 10 },
          color: textColor
        }
      }
    }
  }
})

const lineChartOptions = computed(() => {
  const textColor = isDark.value ? '#9CA3AF' : '#4B5563'
  const gridColor = isDark.value ? '#1e293b' : '#F1F5F9' // slate-800 no dark, slate-100 no light
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: gridColor
        },
        ticks: {
          color: textColor,
          font: { weight: 'bold', size: 9 }
        }
      },
      y: {
        grid: {
          color: gridColor
        },
        ticks: {
          color: textColor,
          font: { weight: 'bold', size: 9 }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  }
})

const aiReport = ref<string | null>(null)
const isAnalyzing = ref(false)
const isPaywallOpen = ref(false)
const paywallReason = ref('')
const isReportDrawerOpen = ref(false)

async function confirmAndGenerateReport(payload?: { period?: string }) {
  if (payload?.period && payload.period !== period.value) {
    period.value = payload.period
  }
  executeWithCreditCheck('analyzeReport', async () => {
    isAnalyzing.value = true
    try {
      const query: any = { ...fetchQuery.value, background: 'true' }
      const res: any = await $fetch('/api/ai/analyze', { query })
      notify('Relatório em Segundo Plano', res.message || 'Seu relatório estratégico está sendo gerado em segundo plano. Assim que estiver pronto, você será notificado na Central!')
      isReportDrawerOpen.value = false
    } catch (e: any) {
      if (e.statusCode === 402) {
        paywallReason.value = 'gerar relatório estratégico de IA'
        isPaywallOpen.value = true
      } else if (e.statusCode === 429) {
        notify('Limite Atingido', 'Você fez muitas requisições seguidas. Tente novamente em um minuto.')
      } else if (e.statusCode === 400) {
        notify('Orçamento aprovado necessário', e.data?.statusMessage || 'É necessário ter pelo menos 1 orçamento aprovado para gerar um relatório estratégico.')
      } else {
        notify('Erro', e.data?.statusMessage || 'Erro ao gerar relatório estratégico')
      }
    } finally {
      isAnalyzing.value = false
    }
  }, { title: 'Gerar Relatório Estratégico com IA' })
}

const periodLabels: Record<string, string> = {
  last_7_days: 'Últimos 7 dias',
  last_30_days: 'Últimos 30 dias',
  last_90_days: 'Últimos 90 dias',
  year: 'Este Ano',
  all: 'Todo o período'
}
const periodLabel = computed(() => periodLabels[period.value] || 'Todo o período')

const { 
  isCreditConfirmOpen, 
  confirmTitle, 
  confirmDescription, 
  executeWithCreditCheck, 
  handleCreditConfirm, 
  handleCreditCancel 
} = useConfirmCreditAction()

async function generateAIReport() {
  executeWithCreditCheck('analyzeReport', async () => {
    isAnalyzing.value = true
    try {
      // Relatório usa o mesmo filtro de período selecionado no dashboard
      const data: any = await $fetch('/api/ai/analyze', { query: fetchQuery.value })
      aiReport.value = data.text
      refresh()
    } catch (e: any) {
      if (e.statusCode === 402) {
        paywallReason.value = 'gerar relatório estratégico de IA'
        isPaywallOpen.value = true
      } else if (e.statusCode === 429) {
        notify('Limite Atingido', 'Você fez muitas requisições seguidas. Tente novamente em um minuto.')
      } else if (e.statusCode === 400) {
        notify('Orçamento aprovado necessário', e.data?.statusMessage || 'É necessário ter pelo menos 1 orçamento aprovado para gerar um relatório estratégico.')
      } else {
        notify('Erro', e.data?.statusMessage || 'Erro ao gerar relatório estratégico')
      }
    } finally {
      isAnalyzing.value = false
    }
  }, { title: 'Gerar Relatório Estratégico com IA' })
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
        <h1 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Cockpit Comercial</h1>
        <p class="text-gray-500 dark:text-gray-400 font-medium">Acompanhe suas conversões, produtividade IA e receitas acumuladas.</p>
      </div>

      <div v-if="stats && stats.proposalsCount > 0" data-tour="dashboard-period-filter" class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide bg-gray-100/80 dark:bg-gray-800 p-1.5 rounded-[0.5rem] border border-gray-200/50 dark:border-gray-700 md:w-auto w-full">
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
          :class="period === p.value ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 border border-gray-200/60 dark:border-gray-700 shadow-sm font-black' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-bold hover:bg-gray-200/40 dark:hover:bg-gray-700/40'"
          class="md:px-5 px-3 py-2 rounded-[0.5rem] text-[10px] uppercase tracking-widest transition-all whitespace-nowrap"
        >
          {{ p.label }}
        </button>
      </div>
    </header>

    <!-- Loading State Geral -->
    <template v-if="status === 'pending' && !stats">

      <!-- KPI Cards -->
      <section class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <div v-for="i in 4" :key="i" class="bg-white p-4 md:p-8 rounded-[0.5rem] border border-gray-100 shadow-sm space-y-3">
          <div class="flex justify-between items-start">
            <BaseSkeleton width="2.75rem" height="2.75rem" borderRadius="0.75rem" />
            <BaseSkeleton width="4rem" height="1.2rem" borderRadius="0.5rem" customClass="hidden md:block" />
          </div>
          <div class="space-y-2">
            <BaseSkeleton width="45%" height="0.65rem" />
            <BaseSkeleton width="65%" height="1.75rem" />
            <BaseSkeleton width="80%" height="0.65rem" customClass="hidden md:block" />
          </div>
        </div>
      </section>

      <!-- AI ROI Card -->
      <section class="bg-slate-900 p-8 rounded-[0.5rem] border border-slate-800">
        <div class="flex flex-col lg:flex-row gap-8">
          <div class="space-y-6 flex-1">
            <BaseSkeleton width="12rem" height="1.5rem" borderRadius="9999px" customClass="bg-slate-700" />
            <div class="space-y-2">
              <BaseSkeleton width="80%" height="2rem" customClass="bg-slate-700" />
              <BaseSkeleton width="55%" height="2rem" customClass="bg-slate-700" />
            </div>
            <BaseSkeleton width="90%" height="0.85rem" customClass="bg-slate-700" />
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <BaseSkeleton width="100%" height="0.65rem" customClass="bg-slate-700" />
                <BaseSkeleton width="100%" height="0.5rem" borderRadius="9999px" customClass="bg-slate-700" />
              </div>
              <div class="space-y-2">
                <BaseSkeleton width="100%" height="0.65rem" customClass="bg-slate-700" />
                <BaseSkeleton width="100%" height="0.5rem" borderRadius="9999px" customClass="bg-slate-700" />
              </div>
            </div>
          </div>
          <div class="bg-slate-950/40 p-6 rounded-[0.5rem] border border-slate-800 lg:w-80 shrink-0 space-y-4">
            <BaseSkeleton width="100%" height="4rem" borderRadius="1rem" customClass="bg-slate-700" />
            <BaseSkeleton width="100%" height="3rem" borderRadius="1rem" customClass="bg-slate-700" />
            <BaseSkeleton width="50%" height="0.65rem" borderRadius="9999px" customClass="bg-slate-700 mx-auto" />
          </div>
        </div>
      </section>

      <!-- Funil + Follow-ups -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 bg-white p-8 rounded-[0.5rem] border border-gray-100 shadow-sm space-y-6">
          <BaseSkeleton width="10rem" height="1rem" />
          <div class="space-y-4">
            <BaseSkeleton v-for="j in 3" :key="j" width="100%" height="2.5rem" borderRadius="0.75rem" />
          </div>
          <BaseSkeleton width="100%" height="5.5rem" borderRadius="1.5rem" />
        </div>
        <div class="lg:col-span-1 bg-white p-8 rounded-[0.5rem] border border-gray-100 shadow-sm space-y-6">
          <BaseSkeleton width="8rem" height="1rem" />
          <div class="space-y-4">
            <BaseSkeleton v-for="j in 3" :key="j" width="100%" height="5.5rem" borderRadius="1.5rem" />
          </div>
        </div>
      </section>

      <!-- Gráficos -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 bg-white p-8 rounded-[0.5rem] border border-gray-100 shadow-sm space-y-6">
          <BaseSkeleton width="12rem" height="1rem" />
          <BaseSkeleton width="100%" height="20rem" borderRadius="1rem" />
        </div>
        <div class="lg:col-span-1 bg-white p-8 rounded-[0.5rem] border border-gray-100 shadow-sm space-y-6 flex flex-col items-center">
          <BaseSkeleton width="10rem" height="1rem" customClass="self-start" />
          <BaseSkeleton width="14rem" height="14rem" borderRadius="9999px" customClass="mt-4" />
        </div>
      </section>

      <!-- Tracking + Top Clientes -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 bg-white p-8 rounded-[0.5rem] border border-gray-100 shadow-sm space-y-6">
          <BaseSkeleton width="14rem" height="1rem" />
          <div class="space-y-3">
            <BaseSkeleton v-for="j in 5" :key="j" width="100%" height="2.25rem" borderRadius="0.5rem" />
          </div>
        </div>
        <div class="lg:col-span-1 bg-white p-8 rounded-[0.5rem] border border-gray-100 shadow-sm space-y-6">
          <BaseSkeleton width="8rem" height="1rem" />
          <div class="space-y-3">
            <BaseSkeleton v-for="j in 5" :key="j" width="100%" height="3.5rem" borderRadius="1rem" />
          </div>
        </div>
      </section>

    </template>

    <template v-else-if="stats">
      <template v-if="stats.proposalsCount > 0">

      <!-- Seção Principal de Métricas Claves -->
      <section class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        
        <!-- Receita Confirmada -->
        <div class="bg-white dark:bg-gray-900 p-4 md:p-8 rounded-[0.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group flex flex-row md:flex-col items-center md:items-start gap-2 md:gap-0">
          <div class="flex flex-col md:flex-row justify-between w-auto md:w-full items-center md:items-start mb-0 md:mb-4">
            <div class="w-10 h-10 md:w-12 md:h-12 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
              <DollarSign class="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <span class="hidden md:inline-block text-[9px] font-black text-green-500 dark:text-green-400 uppercase tracking-widest bg-green-50 dark:bg-green-950/30 px-2.5 py-1 rounded-lg">Faturado</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[8px] md:text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0 md:mb-1 truncate">Faturamento</p>
            <h3 class="text-base md:text-3xl font-black text-gray-900 dark:text-white tracking-tight truncate">
              R$ {{ (stats.totalRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }}
            </h3>
            <p class="hidden md:block text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-semibold truncate">{{ stats.acceptedCount }} orçamentos convertidos</p>
          </div>
        </div>

        <!-- Conversão Geral -->
        <div class="bg-white dark:bg-gray-900 p-4 md:p-8 rounded-[0.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group flex flex-row md:flex-col items-center md:items-start gap-2 md:gap-0">
          <div class="flex flex-col md:flex-row justify-between w-auto md:w-full items-center md:items-start mb-0 md:mb-4">
            <div class="w-10 h-10 md:w-12 md:h-12 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <TrendingUp class="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <span class="hidden md:inline-block text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1 rounded-lg">Sucesso</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[8px] md:text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0 md:mb-1 truncate">Conversão</p>
            <h3 class="text-base md:text-3xl font-black text-gray-900 dark:text-white tracking-tight truncate">
              {{ Math.round(stats.approvalRate ?? 0) }}%
            </h3>
            <p class="hidden md:block text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-semibold truncate">{{ stats.proposalsCount }} orçamentos totais</p>
          </div>
        </div>

        <!-- TMA (Tempo Médio de Atendimento/Fechamento) -->
        <div class="bg-white dark:bg-gray-900 p-4 md:p-8 rounded-[0.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group flex flex-row md:flex-col items-center md:items-start gap-2 md:gap-0">
          <div class="flex flex-col md:flex-row justify-between w-auto md:w-full items-center md:items-start mb-0 md:mb-4">
            <div class="w-10 h-10 md:w-12 md:h-12 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Clock class="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <span class="hidden md:inline-block text-[9px] font-black text-purple-500 dark:text-purple-400 uppercase tracking-widest bg-purple-50 dark:bg-purple-950/30 px-2.5 py-1 rounded-lg">Agilidade</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[8px] md:text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0 md:mb-1 truncate">TMA</p>
            <h3 class="text-base md:text-3xl font-black text-gray-900 dark:text-white tracking-tight truncate">
              {{ stats.tmaHours > 24 ? `${Math.round(stats.tmaHours / 24)}d` : `${Math.round(stats.tmaHours || 0)}h` }}
            </h3>
            <p class="hidden md:block text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-semibold truncate">tempo médio p/ aceite</p>
          </div>
        </div>

        <!-- SLA Comercial (Fechados em < 48h) -->
        <div class="bg-white dark:bg-gray-900 p-4 md:p-8 rounded-[0.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group flex flex-row md:flex-col items-center md:items-start gap-2 md:gap-0">
          <div class="flex flex-col md:flex-row justify-between w-auto md:w-full items-center md:items-start mb-0 md:mb-4">
            <div class="w-10 h-10 md:w-12 md:h-12 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <ShieldCheck class="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <span class="hidden md:inline-block text-[9px] font-black text-orange-500 dark:text-orange-400 uppercase tracking-widest bg-orange-50 dark:bg-orange-950/30 px-2.5 py-1 rounded-lg">Meta</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[8px] md:text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0 md:mb-1 truncate">SLA 48h</p>
            <h3 class="text-base md:text-3xl font-black text-gray-900 dark:text-white tracking-tight truncate">
              {{ Math.round(stats.slaRate ?? 0) }}%
            </h3>
            <p class="hidden md:block text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-semibold truncate">fechados na meta</p>
          </div>
        </div>

      </section>

      <!-- Cartão Premium Glowing ROI de Inteligência Artificial -->
      <section class="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-[0.5rem] shadow-2xl border border-indigo-500/20 shadow-indigo-500/5 group">
        <!-- Glow decorativo de IA -->
        <div class="absolute -top-10 -right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl opacity-60 group-hover:bg-indigo-500/20 transition-all duration-700"></div>
        <div class="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl opacity-60"></div>
        
        <div class="relative flex flex-col lg:flex-row justify-between items-stretch gap-8 z-10">
          <!-- Textos e ROI Geral -->
          <div class="space-y-6 flex-1">
            <div class="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div class="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-500/20 backdrop-blur-md rounded-full text-indigo-200 text-[9px] font-black uppercase tracking-widest border border-indigo-500/30">
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
              <div class="space-y-2 bg-slate-950/40 p-4 rounded-[0.5rem] border border-white/5">
                <div class="flex justify-between text-xs font-bold text-slate-300">
                  <span class="uppercase tracking-widest text-[9px] text-slate-400">Adoção em Propostas</span>
                  <span class="text-indigo-400">{{ Math.round(stats.aiRoi?.adoptionRates?.proposals || 0) }}%</span>
                </div>
                <div class="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" :style="{ width: (stats.aiRoi?.adoptionRates?.proposals || 0) + '%' }"></div>
                </div>
              </div>
              
              <div class="space-y-2 bg-slate-950/40 p-4 rounded-[0.5rem] border border-white/5">
                <div class="flex justify-between text-xs font-bold text-slate-300">
                  <span class="uppercase tracking-widest text-[9px] text-slate-400">Adoção no Catálogo</span>
                  <span class="text-emerald-400">{{ Math.round(stats.aiRoi?.adoptionRates?.catalog || 0) }}%</span>
                </div>
                <div class="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full" :style="{ width: (stats.aiRoi?.adoptionRates?.catalog || 0) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Painel Reformulado de Créditos e Ações de IA -->
          <div class="flex flex-col justify-between items-stretch gap-6 bg-slate-950/60 p-6 rounded-[0.5rem] border border-white/10 lg:w-80 shrink-0 shadow-inner">
            <!-- Mini Cards de Saldo e Consumo -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Painel de Créditos</span>
                <button 
                  @click="isCostTableModalOpen = true"
                  class="text-[9px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded-lg border border-indigo-500/20 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                  title="Ver Tabela Completa de Custos"
                >
                  Tabela de Custos <ChevronRight class="w-3 h-3" />
                </button>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <!-- Saldo Atual -->
                <div class="bg-slate-900/80 p-3.5 rounded-[0.5rem] border border-white/5 space-y-1">
                  <div class="flex items-center gap-1.5 text-blue-400">
                    <Coins class="w-3.5 h-3.5 animate-pulse" />
                    <span class="text-[8px] font-black uppercase tracking-wider text-slate-400">Saldo Atual</span>
                  </div>
                  <p class="text-xl font-black text-white">
                    {{ profile?.creditsBalance ?? 0 }}
                  </p>
                  <p class="text-[8px] font-bold text-slate-500 uppercase">Créditos</p>
                </div>

                <!-- Créditos Consumidos -->
                <div class="bg-slate-900/80 p-3.5 rounded-[0.5rem] border border-white/5 space-y-1">
                  <div class="flex items-center gap-1.5 text-violet-400">
                    <Zap class="w-3.5 h-3.5" />
                    <span class="text-[8px] font-black uppercase tracking-wider text-slate-400">Utilizados</span>
                  </div>
                  <p class="text-xl font-black text-white">
                    {{ stats.aiRoi?.creditsUsed || 0 }}
                  </p>
                  <p class="text-[8px] font-bold text-slate-500 uppercase">Total Geral</p>
                </div>
              </div>
            </div>
            
            <!-- Ação Principal + Atalho para Recarga -->
            <div class="space-y-3 pt-2 border-t border-white/5">
              <BaseButton
                data-tour="dashboard-ai-report"
                @click="isReportDrawerOpen = true"
                :disabled="isAnalyzing"
                variant="primary" 
                class="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-2xl py-4 text-xs font-black tracking-widest uppercase shadow-xl shadow-indigo-600/20 transition-all border border-indigo-400/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <template v-if="isAnalyzing">
                  <Loader2 class="w-4 h-4 animate-spin mr-2" /> Analisando Dados...
                </template>
                <template v-else>
                  <Sparkles class="w-4 h-4 text-indigo-200" /> Gerar Relatório
                </template>
              </BaseButton>

              <div class="flex items-center justify-between text-[9px] font-bold">
                <span class="text-slate-500 uppercase tracking-wider">Período: {{ periodLabel }}</span>
                <NuxtLink 
                  to="/planos"
                  class="text-indigo-400 hover:text-indigo-300 font-black tracking-wider uppercase hover:underline flex items-center gap-0.5"
                >
                  Recarregar <ChevronRight class="w-3 h-3" />
                </NuxtLink>
              </div>
            </div>

          </div>

        </div>
      </section>

      <!-- Funil Comercial & Opcionais de Upsell -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Funil Comercial Horizontal -->
        <div class="lg:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-[0.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-md md:text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Funil Comercial e Conversão</h3>
              <span class="hidden md:block text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-[0.5rem]">Passos de Vendas</span>
            </div>
            
            <div class="space-y-4">
              <!-- Em Aberto / Enviados -->
              <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <span class="w-full md:w-20 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-left md:text-right">Em Aberto</span>
                <div class="w-full md:flex-1 h-10 bg-blue-50/50 dark:bg-blue-950/20 rounded-[0.5rem] relative overflow-hidden">
                  <div class="h-full bg-blue-100 dark:bg-blue-900/50" :style="{ width: stats.proposalsCount > 0 ? (stats.pendingCount / stats.proposalsCount * 100) + '%' : '0%' }"></div>
                  <span class="absolute inset-y-0 left-4 flex items-center text-xs font-bold text-blue-800 dark:text-blue-300">
                    {{ stats.pendingCount }} orçamentos aguardando resposta do cliente
                  </span>
                </div>
              </div>

              <!-- Aceitos (Finalizados) -->
              <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <span class="w-full md:w-20 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-left md:text-right">Aceitos</span>
                <div class="w-full md:flex-1 h-10 bg-emerald-50 dark:bg-emerald-950/20 rounded-[0.5rem] relative overflow-hidden">
                  <div class="h-full bg-emerald-100 dark:bg-emerald-900/50" :style="{ width: stats.proposalsCount > 0 ? (stats.acceptedCount / stats.proposalsCount * 100) + '%' : '0%' }"></div>
                  <span class="absolute inset-y-0 left-4 flex items-center text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    {{ stats.acceptedCount }} orçamentos fechados ({{ Math.round(stats.approvalRate) }}% conversão)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Receita de Opcionais (Upsell) -->
          <div class="mt-8 p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-[0.5rem] flex flex-col sm:flex-row justify-between items-center gap-4">
            <div class="space-y-1 text-center sm:text-left">
              <span class="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest bg-emerald-100/60 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">Exclusivo Upsell</span>
              <h4 class="font-black text-gray-900 dark:text-white uppercase text-xs tracking-widest">Receita de Itens Opcionais</h4>
              <p class="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">Faturamento extra trazido por opcionais aceitos pelos clientes nas propostas.</p>
            </div>
            
            <div class="text-center sm:text-right shrink-0 bg-white dark:bg-gray-950 px-6 py-3 rounded-[0.5rem] border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
              <p class="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Valor Adicional</p>
              <p class="text-xl font-black text-emerald-600 dark:text-emerald-400">R$ {{ (stats.upsellRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
            </div>
          </div>

        </div>

        <!-- Alertas de Follow-ups Inteligentes -->
        <div class="lg:col-span-1 bg-white dark:bg-gray-900 p-8 rounded-[0.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
          <div class="flex justify-between items-center">
            <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Ações e Follow-ups</h3>
            <AlertCircle class="w-5 h-5 text-indigo-500" />
          </div>
          
          <div class="space-y-4">
            <div 
              v-for="alert in stats.followUpAlerts" 
              :key="alert.id" 
              class="p-5 bg-orange-50/40 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/30 rounded-[0.5rem] space-y-3 hover:border-orange-200 dark:hover:border-orange-850/50 transition-colors"
            >
              <div class="flex justify-between items-start">
                <span class="text-[8px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest bg-orange-100/50 dark:bg-orange-950/40 px-2 py-0.5 rounded-full">
                  {{ alert.daysAgo === 0 ? 'Pendente hoje' : `Pendente há ${alert.daysAgo}d` }}
                </span>
                <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500">{{ alert.code }}</span>
              </div>
              
              <div class="space-y-1">
                <h4 class="text-xs font-black text-gray-800 dark:text-white truncate uppercase">{{ alert.title }}</h4>
                <p class="text-[10px] text-gray-500 dark:text-gray-400 font-bold">Cliente: {{ alert.clientName }}</p>
              </div>

              <div class="flex items-center gap-2 pt-1">
                <a 
                  v-if="alert.clientPhone"
                  :href="`https://wa.me/${alert.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${alert.clientName}, gostaria de confirmar se conseguiu visualizar a proposta comercial que enviei? Qualquer dúvida fico à disposição!`)}`"
                  target="_blank"
                  class="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-[0.5rem] text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  <img :src="'/images/icons/whatsapp-svg.svg'" class="w-3.5 h-3.5" alt="WhatsApp" loading="lazy"/> WhatsApp
                </a>
                
                <a
                  :href="`${publicProposalUrl}/p/${alert.slug}?t=${alert.token}`"
                  target="_blank"
                  class="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-[0.5rem] text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  Ver Proposta
                </a>
              </div>
            </div>
            
            <div v-if="!stats.followUpAlerts?.length" class="text-center py-8 space-y-3">
              <div class="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-[0.5rem] flex items-center justify-center mx-auto">
                <CheckCircle2 class="w-6 h-6" />
              </div>
              <p class="text-xs text-gray-400 dark:text-gray-500 font-semibold">Tudo em ordem! Nenhuma proposta pendente presa no funil.</p>
            </div>
          </div>
        </div>

      </section>

      <!-- Gráficos de Evolução de Faturamento e Status -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Gráfico de Evolução de Faturamento -->
        <div data-tour="dashboard-revenue-chart" class="lg:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-[0.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
          <div class="flex justify-between items-center">
            <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Evolução do Faturamento</h3>
            <BarChart3 class="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div class="h-80 relative">
            <Line :data="revenueChartData" :options="lineChartOptions" />
          </div>
        </div>

        <!-- Distribuição de Status -->
        <div class="lg:col-span-1 bg-white dark:bg-gray-900 p-8 rounded-[0.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
          <div class="flex justify-between items-center">
            <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Status dos Orçamentos</h3>
            <Activity class="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div class="h-80 relative flex items-center justify-center">
            <Doughnut :data="statusChartData" :options="chartOptions" />
          </div>
        </div>

      </section>

      <!-- Tracking de Abertura & Ranking de Clientes -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Tracking de Aberturas em Tempo Real -->
        <div class="lg:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-[0.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Visualizações Recentes (Tracking)</h3>
              <span class="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
            </div>
            
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-gray-100 dark:border-gray-800">
                    <th class="pb-4 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Orçamento</th>
                    <th class="pb-4 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Cliente</th>
                    <th class="pb-4 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Navegador</th>
                    <th class="pb-4 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Quando</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
                  <tr v-for="(view, idx) in stats.trackingViews" :key="idx" class="hover:bg-gray-50/40 dark:hover:bg-gray-800/30 transition-colors">
                    <td class="py-4 text-xs font-bold text-gray-900 dark:text-white">
                      {{ view.proposalCode }}
                      <span class="block text-[9px] text-gray-400 dark:text-gray-500 font-bold truncate max-w-[150px]">{{ view.proposalTitle }}</span>
                    </td>
                    <td class="py-4 text-xs font-bold text-gray-650 dark:text-gray-300">
                      {{ view.clientName }}
                      <span class="block text-[8px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-wider">{{ view.location }}</span>
                    </td>
                    <td class="py-4 text-[10px] text-gray-400 dark:text-gray-500 font-bold">{{ view.browser }}</td>
                    <td class="py-4 text-xs font-black text-gray-900 dark:text-white text-right">
                      {{ formatRelativeTime(view.minutesAgo) }}
                    </td>
                  </tr>
                  <tr v-if="!stats.trackingViews?.length">
                    <td colspan="4" class="py-12 text-center text-gray-400 dark:text-gray-500 text-xs font-semibold">
                      Nenhuma visualização de proposta registrada ainda.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Ranking de Clientes (Faturamento) -->
        <div class="lg:col-span-1 bg-white dark:bg-gray-900 p-8 rounded-[0.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
          <div class="flex justify-between items-center">
            <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Top Clientes</h3>
            <NuxtLink to="/clientes" class="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:text-blue-800 dark:hover:text-blue-300">Ver Todos</NuxtLink>
          </div>
          
          <div class="space-y-4">
            <div 
              v-for="(client, idx) in stats.clientRanking" 
              :key="idx" 
              class="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/40 rounded-[0.5rem] border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850 transition-colors group"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-center text-[10px] font-black text-gray-400 dark:text-gray-500 group-hover:border-blue-200 dark:group-hover:border-blue-900 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all">
                  #{{ (idx as number) + 1 }}
                </div>
                <div>
                  <p class="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{{ client.name }}</p>
                  <p class="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Faturamento total</p>
                </div>
              </div>
              
              <div class="text-right">
                <p class="text-xs font-black text-gray-900 dark:text-white">R$ {{ (client.revenue as number).toLocaleString('pt-BR') }}</p>
                <div class="w-16 h-1 bg-gray-100 dark:bg-gray-850 rounded-full mt-1.5 overflow-hidden">
                  <div class="h-full bg-blue-600 dark:bg-blue-500 rounded-full" :style="{ width: ((client.revenue as number) / stats.totalRevenue * 100) + '%' }"></div>
                </div>
              </div>
            </div>
            
            <div v-if="!stats.clientRanking?.length" class="text-center py-12 text-gray-400 dark:text-gray-500 text-xs font-semibold">
              Nenhum dado de receita disponível.
            </div>
          </div>
        </div>

      </section>

      </template>
      <template v-else>
        <!-- Onboarding: conta sem nenhum orçamento ainda -->
        <section class="flex flex-col items-center justify-center py-12 px-4">
          <div class="max-w-3xl w-full space-y-8">
            <div class="text-center space-y-2">
              <h2 class="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Vamos começar!</h2>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Siga os passos abaixo para criar seu primeiro orçamento.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <!-- Passo 1 -->
              <div class="bg-white dark:bg-gray-900 rounded-[0.5rem] border border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-4">
                <div class="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                  <UserPlus class="w-6 h-6" />
                </div>
                <div class="flex-1 space-y-1">
                  <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Cadastre seu primeiro cliente</h3>
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Adicione os dados de quem receberá o orçamento.</p>
                </div>
                <NuxtLink to="/clientes">
                  <BaseButton variant="secondary" class="w-full">Ir para Clientes</BaseButton>
                </NuxtLink>
              </div>

              <!-- Passo 2 -->
              <div class="bg-white dark:bg-gray-900 rounded-[0.5rem] border border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-4">
                <div class="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                  <BookOpen class="w-6 h-6" />
                </div>
                <div class="flex-1 space-y-1">
                  <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Adicione um serviço ao catálogo</h3>
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Defina os serviços que você oferece e seus preços.</p>
                </div>
                <NuxtLink to="/catalogo">
                  <BaseButton variant="secondary" class="w-full">Ir para Catálogo</BaseButton>
                </NuxtLink>
              </div>

              <!-- Passo 3 -->
              <div class="bg-white dark:bg-gray-900 rounded-[0.5rem] border border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-4">
                <div class="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                  <FileText class="w-6 h-6" />
                </div>
                <div class="flex-1 space-y-1">
                  <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Crie seu primeiro orçamento</h3>
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Monte e envie seu primeiro orçamento para um cliente.</p>
                </div>
                <NuxtLink to="/orcamentos?new=true">
                  <BaseButton variant="primary" class="w-full">Criar Orçamento</BaseButton>
                </NuxtLink>
              </div>
            </div>

            <div class="text-center">
              <button
                type="button"
                class="text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 underline underline-offset-2 transition-colors"
                @click="openSetupWizard"
              >
                Refazer configuração inicial (empresa, endereço, contatos, visual, integrações)
              </button>
            </div>
          </div>
        </section>
      </template>

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

    <!-- Modal de Confirmação de Consumo de Crédito IA -->
    <ConfirmCreditDialog
      v-model:open="isCreditConfirmOpen"
      :title="confirmTitle"
      :description="confirmDescription"
      @confirm="handleCreditConfirm"
      @cancel="handleCreditCancel"
    />

    <!-- Modal da Tabela Transparente de Custos por Ação -->
    <BaseDialog
      v-model:open="isCostTableModalOpen"
      title="Tabela de Custos por Ação"
      size="xl"
    >
      <div class="space-y-6 py-2">
        <p class="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed">
          Confira abaixo a relação completa de funcionalidades comerciais e de inteligência artificial da plataforma com os respectivos custos em créditos.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="item in actionCostsList" 
            :key="item.key"
            class="bg-gray-50/60 dark:bg-gray-800/60 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex flex-col justify-between space-y-4"
          >
            <div class="space-y-2.5">
              <div class="flex items-center justify-between gap-2">
                <div class="w-8 h-8 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center text-gray-900 dark:text-white border border-gray-100 dark:border-gray-600 shadow-sm shrink-0">
                  <component :is="item.icon" class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span :class="['text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border', item.badgeColor]">
                  {{ item.badge }}
                </span>
              </div>
              <div>
                <h4 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ item.name }}</h4>
                <p class="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{{ item.description }}</p>
              </div>
            </div>

            <div class="pt-3 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
              <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Custo</span>
              <span class="text-xs font-black text-gray-900 dark:text-white bg-white dark:bg-gray-900 px-3 py-1 rounded-xl border border-gray-200/60 dark:border-gray-700">
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
    <GenerateReportDrawer
      v-model:open="isReportDrawerOpen"
      :period="period"
      :period-label="periodLabel"
      :stats="stats"
      :credits-balance="profile?.creditsBalance || 0"
      :credit-cost="getCost('analyzeReport')"
      :loading="isAnalyzing"
      :allow-change-period="true"
      @confirm="confirmAndGenerateReport"
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
