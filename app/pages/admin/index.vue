<script setup lang="ts">
import { TrendingUp, Users, FileText, CreditCard, ArrowUpRight, DollarSign, Activity, Settings, ShieldAlert, BarChart3, PieChart } from 'lucide-vue-next'
import { Line, Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, ArcElement } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, ArcElement)

const { data: stats, pending } = useFetch<any>('/api/admin/stats')

const { user } = useUserSession()
if (process.client && user.value?.role !== 'admin') {
  navigateTo('/dashboard')
}

const metrics = computed(() => [
  { 
    label: 'Faturamento (30d)', 
    value: stats.value?.revenue?.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00',
    icon: DollarSign,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  },
  { 
    label: 'MRR Atual', 
    value: (stats.value?.revenue?.mrr || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    icon: TrendingUp,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  { 
    label: 'Total de Usuários', 
    value: stats.value?.users?.total || 0,
    subValue: `+${stats.value?.users?.newMonth || 0} este mês`,
    icon: Users,
    color: 'text-purple-600',
    bg: 'bg-purple-50'
  },
  { 
    label: 'Conversão Média', 
    value: `${stats.value?.proposals?.conversionRate?.toFixed(1) || 0}%`,
    subValue: `${stats.value?.proposals?.total || 0} orçamentos`,
    icon: FileText,
    color: 'text-orange-600',
    bg: 'bg-orange-50'
  }
])

const breakdownChartData = computed(() => {
  if (!stats.value?.revenue?.breakdown) return { labels: [], datasets: [] }
  const b = stats.value.revenue.breakdown
  return {
    labels: ['Anual', 'Mensal', 'Créditos'],
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
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
    }]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const, labels: { usePointStyle: true, font: { weight: 'bold' as const, size: 10 } } }
  }
}
const { data: systemInfo } = useFetch<any>('/api/system/status')
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-10">
    <PageHeader title="Painel de Administração" :subtitle="`Visão geral e controle global da plataforma ${systemInfo?.landingPage?.appName || 'Orcei'}.`" >
      <div class="flex gap-3">
        <NuxtLink to="/admin/settings" class="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-all">
          <Settings class="w-4 h-4 mr-2" />
          Configurações
        </NuxtLink>
        <NuxtLink to="/admin/users" class="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-gray-200">
          <Users class="w-4 h-4 mr-2" />
          Gerenciar Usuários
        </NuxtLink>
      </div>
    </PageHeader>

    <!-- Loading State -->
    <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="i in 4" :key="i" class="h-32 bg-gray-100 animate-pulse rounded-[2rem]"></div>
    </div>

    <!-- Metrics Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="m in metrics" :key="m.label" class="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div class="flex justify-between items-start">
          <div :class="[m.bg, m.color]" class="p-3 rounded-2xl">
            <component :is="m.icon" class="w-6 h-6" />
          </div>
          <ArrowUpRight class="w-4 h-4 text-gray-300 group-hover:text-gray-900 transition-colors" />
        </div>
        <div>
          <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">{{ m.label }}</p>
          <h3 class="text-2xl font-black text-gray-900 tracking-tight mt-1">{{ m.value }}</h3>
          <p v-if="m.subValue" class="text-xs font-bold text-gray-500 mt-1">{{ m.subValue }}</p>
        </div>
      </div>
    </div>

    <!-- Financial Analysis Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <BarChart3 class="w-5 h-5 text-blue-600" />
          </div>
          <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Previsibilidade Financeira</h2>
        </div>
        <div class="h-72 relative">
          <Line :data="forecastChartData" :options="chartOptions" />
        </div>
      </div>

      <div class="lg:col-span-1 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <PieChart class="w-5 h-5 text-emerald-600" />
          </div>
          <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Origem</h2>
        </div>
        <div class="h-72 relative">
          <Doughnut :data="breakdownChartData" :options="chartOptions" />
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="md:col-span-2 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Activity class="w-5 h-5 text-blue-600" />
          </div>
          <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Status do Sistema</h2>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <NuxtLink to="/admin/settings" class="p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:border-blue-200 transition-all group">
            <ShieldAlert class="w-6 h-6 text-red-500 mb-4" />
            <h4 class="font-black text-gray-900 uppercase text-xs tracking-widest mb-1">Modo Manutenção</h4>
            <p class="text-xs text-gray-500 font-medium leading-relaxed">Coloque a plataforma offline para usuários comuns.</p>
          </NuxtLink>
          <NuxtLink to="/admin/audit-logs" class="p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:border-blue-200 transition-all group">
            <CreditCard class="w-6 h-6 text-emerald-500 mb-4" />
            <h4 class="font-black text-gray-900 uppercase text-xs tracking-widest mb-1">Logs de Auditoria</h4>
            <p class="text-xs text-gray-500 font-medium leading-relaxed">Histórico de ações administrativas.</p>
          </NuxtLink>
        </div>
      </div>

      <div class="bg-gray-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div class="relative z-10 space-y-6">
          <h3 class="text-lg font-black uppercase tracking-tight">Administrador</h3>
          <p class="text-sm text-gray-400 font-medium">Gestão total de usuários e faturamento do sistema.</p>
          <div class="pt-6 border-t border-white/10 space-y-4">
            <NuxtLink to="/admin/users" class="block w-full text-center py-3 bg-white text-gray-900 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-gray-100 transition-all">
              Lista de Usuários
            </NuxtLink>
            <NuxtLink to="/dashboard" class="block w-full text-center py-3 border border-white/20 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-white/5 transition-all">
              Voltar ao Site
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
