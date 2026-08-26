import { computed } from 'vue'
import {
  TrendingUp, Users, FileText, CreditCard, ArrowUpRight, DollarSign,
  Activity, Settings, ShieldAlert, BarChart3, PieChart, Database,
  Cpu, Zap, Calendar, AlertTriangle, ShieldCheck, Terminal, Ticket
} from 'lucide-vue-next'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, ArcElement } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, ArcElement)

export function useAdminPage() {
  const { data: stats, pending } = useFetch<any>('/api/admin/stats')
  const { user } = useUserSession()
  const { isDark } = useDarkMode()

  if (process.client && user.value?.role !== 'admin') {
    navigateTo('/dashboard')
  }

  const metrics = computed(() => [
    { 
      label: 'Faturamento Geral (30d)', 
      value: stats.value?.revenue?.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00',
      subValue: stats.value?.revenue?.failedInvoicesCount > 0 ? `${stats.value.revenue.failedInvoicesCount} faturas com falha (Stripe)` : 'Sem falhas de cobrança',
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30'
    },
    { 
      label: 'MRR Atual Recorrente', 
      value: (stats.value?.revenue?.mrr || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      subValue: `ARR Estimado: ${((stats.value?.revenue?.mrr || 0) * 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      icon: TrendingUp,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/30'
    },
    { 
      label: 'Total de Usuários', 
      value: stats.value?.users?.total || 0,
      subValue: `+${stats.value?.users?.newMonth || 0} este mês | Churn: ${stats.value?.users?.churnRate ?? 0}%`,
      icon: Users,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/30'
    },
    { 
      label: 'Conversão Comercial', 
      value: `${stats.value?.proposals?.conversionRate?.toFixed(1) || 0}%`,
      subValue: `${stats.value?.proposals?.accepted || 0} de ${stats.value?.proposals?.total || 0} propostas aprovadas`,
      icon: FileText,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950/30'
    }
  ])

  const breakdownChartData = computed(() => {
    if (!stats.value?.revenue?.breakdown) return { labels: [], datasets: [] }
    const b = stats.value.revenue.breakdown
    return {
      labels: ['Anual', 'Mensal', 'Créditos Avulsos'],
      datasets: [{
        data: [b.annual, b.monthly, b.credits],
        backgroundColor: ['#10B981', '#3B82F6', '#F59E0B'],
        borderWidth: 0
      }]
    }
  })

  const forecastChartData = computed(() => {
    if (!stats.value?.revenue?.forecast) return { labels: [], datasets: [] }
    return {
      labels: stats.value.revenue.forecast.map((f: any) => f.month),
      datasets: [{
        label: 'Previsão de Receita (R$)',
        data: stats.value.revenue.forecast.map((f: any) => f.projected),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
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
          labels: { usePointStyle: true, font: { weight: 'bold' as const, size: 10 }, color: textColor } 
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
          grid: { color: gridColor },
          ticks: { color: textColor, font: { weight: 'bold', size: 9 } }
        }
      },
      plugins: {
        legend: { 
          position: 'bottom' as const, 
          labels: { usePointStyle: true, font: { weight: 'bold' as const, size: 10 }, color: textColor } 
        }
      }
    }
  })

  const { data: systemInfo } = useFetch<any>('/api/system/status', { key: 'system-status' })

  function formatLogTime(isoString: string) {
    const date = new Date(isoString)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return {
    stats,
    pending,
    metrics,
    breakdownChartData,
    forecastChartData,
    chartOptions,
    lineChartOptions,
    systemInfo,
    formatLogTime,
    TrendingUp,
    Users,
    FileText,
    CreditCard,
    ArrowUpRight,
    DollarSign,
    Activity,
    Settings,
    ShieldAlert,
    BarChart3,
    PieChart,
    Database,
    Cpu,
    Zap,
    Calendar,
    AlertTriangle,
    ShieldCheck,
    Terminal,
    Ticket,
  }
}
