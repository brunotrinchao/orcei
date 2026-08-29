import { 
  Sparkles, Loader2, ArrowUpRight, CheckCircle2, Clock, DollarSign, 
  TrendingUp, BarChart3, Users, FileText, ChevronRight, Activity, 
  Calendar, Award, Zap, ShieldCheck, Share2, MessageSquare, AlertCircle, Coins,
  UserPlus, Wand2, BookOpen, ReceiptText
} from 'lucide-vue-next'
import { Line, Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, ArcElement } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, ArcElement)

export function useDashboardPage() {
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
    else return { period: period.value }

    return {
      period: period.value,
      start: start.toISOString(),
      end: now.toISOString()
    }
  })

  const { data: stats, refresh, status } = useLazyFetch<any>('/api/dashboard/stats', {
    key: 'dashboard-stats',
    query: fetchQuery,
    watch: [period]
  })

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
    const gridColor = isDark.value ? '#1e293b' : '#F1F5F9'
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { weight: 'bold', size: 9 } }
        },
        y: {
          min: 0,
          beginAtZero: true,
          grid: { color: gridColor },
          ticks: { color: textColor, font: { weight: 'bold', size: 9 } }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  })

  const aiReport = ref<string | null>(null)
  const isAnalyzing = ref(false)
  const isPaywallOpen = ref(false)
  const paywallReason = ref('')
  const isReportDrawerOpen = ref(false)

  const { 
    isCreditConfirmOpen, 
    confirmTitle, 
    confirmDescription, 
    executeWithCreditCheck, 
    handleCreditConfirm, 
    handleCreditCancel 
  } = useConfirmCreditAction()

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
    year: 'Este ano',
    all: 'Todo o período'
  }
  const periodLabel = computed(() => periodLabels[period.value] || 'Todo o período')

  const periodDays = computed(() => {
    if (period.value === 'last_7_days') return 7
    if (period.value === 'last_30_days') return 30
    if (period.value === 'last_90_days') return 90
    if (period.value === 'year') {
      const now = new Date()
      const start = new Date(now.getFullYear(), 0, 1)
      const diffDays = Math.ceil(Math.abs(now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      return diffDays || 365
    }
    return 30
  })

  const tmaPercentage = computed(() => {
    if (!stats.value || !stats.value.tmaHours || periodDays.value <= 0) return 0
    const tmaDays = stats.value.tmaHours / 24
    const percentage = (tmaDays / periodDays.value) * 100
    return Math.min(100, Math.max(0, Number(percentage.toFixed(1))))
  })

  async function generateAIReport() {
    executeWithCreditCheck('analyzeReport', async () => {
      isAnalyzing.value = true
      try {
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

  function formatRelativeTime(minutesAgo: number) {
    if (minutesAgo < 60) return `há ${minutesAgo} min`
    const hours = Math.floor(minutesAgo / 60)
    if (hours < 24) return `há ${hours}h`
    return `há ${Math.floor(hours / 24)} dias`
  }

  return {
    period,
    loggedIn,
    user,
    profile,
    stats,
    status,
    periodLabel,
    periodDays,
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
  }
}
