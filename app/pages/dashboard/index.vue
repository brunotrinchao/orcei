<script setup lang="ts">
import { Sparkles, Loader2, ArrowUpRight, CheckCircle2, Clock, DollarSign, TrendingUp, BarChart3, Users, FileText } from 'lucide-vue-next'
import { Line, Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, ArcElement } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, ArcElement)

const period = ref('last_30_days')
const { loggedIn } = useUserSession()
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

const { data: stats, refresh, status } = useFetch<any>('/api/dashboard/stats', {
  key: 'dashboard-stats',
  query: fetchQuery,
  watch: [period]
})

// Status Distribution Chart
const statusChartData = computed(() => {
  if (!stats.value?.statusDistribution) return { labels: [], datasets: [] }
  
  const labels = Object.keys(stats.value.statusDistribution).map(s => s.toUpperCase())
  const data = Object.values(stats.value.statusDistribution) as number[]
  
  return {
    labels,
    datasets: [{
      data,
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'],
      borderWidth: 0
    }]
  }
})

// Revenue Evolution Chart
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
      pointBackgroundColor: '#fff',
      pointBorderWidth: 2,
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
        font: { weight: 'bold' as const, size: 10 }
      }
    }
  }
}

const aiReport = ref<string | null>(null)
const isAnalyzing = ref(false)

async function generateAIReport() {
  isAnalyzing.value = true
  try {
    const data: any = await $fetch('/api/ai/analyze')
    aiReport.value = data.text
  } catch (e) {
    notify('Erro', 'Erro ao gerar relatório estratégico')
  } finally {
    isAnalyzing.value = false
  }
}
</script>

<template>
  <div class="space-y-12 relative">
    <div v-if="status === 'pending' && !stats" class="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-[3rem]">
      <div class="flex flex-col items-center gap-4">
        <Loader2 class="w-10 h-10 animate-spin text-blue-600" />
        <p class="text-xs font-black text-gray-400 uppercase tracking-widest">Carregando Dados...</p>
      </div>
    </div>

    <!-- Filtros de Período -->
    <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button 
        v-for="p in [
          { label: 'Últimos 7 dias', value: 'last_7_days' },
          { label: 'Últimos 30 dias', value: 'last_30_days' },
          { label: 'Últimos 90 dias', value: 'last_90_days' },
          { label: 'Este Ano', value: 'year' },
          { label: 'Todo Período', value: 'all' }
        ]" 
        :key="p.value"
        @click="period = p.value"
        :class="period === p.value ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'"
        class="px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
      >
        {{ p.label }}
      </button>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group">
        <div class="flex justify-between items-start mb-6">
          <div class="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
            <FileText class="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
          </div>
          <span class="text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-50 px-2 py-1 rounded-lg">+12%</span>
        </div>
        <p class="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Orçamentos</p>
        <h3 class="text-3xl font-black text-gray-900">{{ stats?.proposalsCount ?? 0 }}</h3>
      </div>

      <div class="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group">
        <div class="flex justify-between items-start mb-6">
          <div class="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center group-hover:bg-green-600 transition-colors">
            <DollarSign class="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
          </div>
          <span class="text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-50 px-2 py-1 rounded-lg">+R$ 2.4k</span>
        </div>
        <p class="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Receita Confirmada</p>
        <h3 class="text-3xl font-black text-gray-900">R$ {{ (stats?.totalRevenue as number)?.toLocaleString('pt-BR') ?? '0,00' }}</h3>
      </div>

      <div class="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group">
        <div class="flex justify-between items-start mb-6">
          <div class="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center group-hover:bg-purple-600 transition-colors">
            <TrendingUp class="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
          </div>
          <span class="text-[10px] font-black text-purple-500 uppercase tracking-widest bg-purple-50 px-2 py-1 rounded-lg">Top 5%</span>
        </div>
        <p class="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Taxa de Aprovação</p>
        <h3 class="text-3xl font-black text-gray-900">{{ Math.round(stats?.approvalRate ?? 0) }}%</h3>
      </div>

      <div class="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group">
        <div class="flex justify-between items-start mb-6">
          <div class="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center group-hover:bg-orange-600 transition-colors">
            <Users class="w-6 h-6 text-orange-600 group-hover:text-white transition-colors" />
          </div>
        </div>
        <p class="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Ticket Médio</p>
        <h3 class="text-3xl font-black text-gray-900">R$ {{ Math.round(stats?.ticketMedia ?? 0).toLocaleString('pt-BR') }}</h3>
      </div>
    </div>

    <!-- Banner IA (Abaixo das Stats, altura reduzida) -->
    <div class="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-8 rounded-[2.5rem] shadow-2xl">
      <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      <div class="relative flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="space-y-2 text-center md:text-left">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-[9px] font-black uppercase tracking-widest border border-white/10">
            <Sparkles class="w-3 h-3 text-blue-200" /> Consultoria de IA Ativa
          </div>
          <h1 class="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">Otimize seu negócio com inteligência.</h1>
          <p class="text-blue-100 font-medium text-sm max-w-xl">Análise baseada em seus dados comerciais para sugerir estratégias de conversão.</p>
        </div>
        <BaseButton 
          @click="generateAIReport"
          :disabled="isAnalyzing"
          variant="secondary" 
          class="bg-white text-blue-700 hover:bg-blue-50 px-10 py-4 rounded-2xl text-[10px] shadow-2xl shrink-0"
        >
          <Loader2 v-if="isAnalyzing" class="w-3.5 h-3.5 animate-spin mr-2" />
          {{ isAnalyzing ? 'Analisando...' : 'Gerar Relatório IA' }}
        </BaseButton>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Gráfico de Evolução de Faturamento -->
      <div class="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
        <h3 class="text-sm font-black text-gray-900 uppercase tracking-widest mb-8">Evolução do Faturamento</h3>
        <div class="h-80 relative">
          <Line :data="revenueChartData" :options="{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }" />
        </div>
      </div>

      <!-- Gráfico de Status -->
      <div class="lg:col-span-1 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
        <h3 class="text-sm font-black text-gray-900 uppercase tracking-widest mb-8">Distribuição de Status</h3>
        <div class="h-80 relative">
          <Doughnut :data="statusChartData" :options="chartOptions" />
        </div>
      </div>

      <!-- Ranking de Clientes -->
      <div class="lg:col-span-3 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
        <div class="flex justify-between items-center mb-8">
          <h3 class="text-sm font-black text-gray-900 uppercase tracking-widest">Maiores Clientes (Receita)</h3>
          <NuxtLink to="/dashboard/clients" class="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800">Ver Todos</NuxtLink>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="(client, idx) in stats?.clientRanking" :key="idx" class="flex items-center justify-between p-5 bg-gray-50/50 rounded-3xl border border-gray-100 hover:bg-gray-50 transition-colors group">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-xs font-black text-gray-400 group-hover:border-blue-200 group-hover:text-blue-600 transition-all">
                #{{ (idx as number) + 1 }}
              </div>
              <div>
                <p class="font-bold text-gray-900">{{ client.name }}</p>
                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Faturamento Acumulado</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-black text-gray-900">R$ {{ (client.revenue as number).toLocaleString('pt-BR') }}</p>
              <div class="w-24 h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                <div class="h-full bg-blue-600 rounded-full" :style="{ width: ((client.revenue as number) / stats.totalRevenue * 100) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="!stats?.clientRanking?.length" class="text-center py-12">
          <p class="text-gray-400 font-medium">Nenhum dado de faturamento disponível.</p>
        </div>
      </div>
    </div>

    <!-- Modal do Relatório IA -->
    <BaseDialog :open="!!aiReport" @update:open="(val) => !val ? aiReport = null : null" title="Relatório Estratégico IA" size="lg" @close="aiReport = null">
      <div class="prose prose-blue max-w-none p-4 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-p:font-medium prose-p:text-gray-600 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
        <div v-html="aiReport ? $md.render(aiReport) : ''"></div>
      </div>
      <template #footer>
        <BaseButton @click="aiReport = null">Entendido</BaseButton>
      </template>
    </BaseDialog>
  </div>
</template>
