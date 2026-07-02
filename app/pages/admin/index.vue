<script setup lang="ts">
import {
  TrendingUp, Users, FileText, CreditCard, ArrowUpRight, DollarSign,
  Activity, Settings, ShieldAlert, BarChart3, PieChart, Database,
  Cpu, Zap, Calendar, AlertTriangle, ShieldCheck, Terminal, Ticket
} from 'lucide-vue-next'
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
    label: 'Faturamento Geral (30d)', 
    value: stats.value?.revenue?.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00',
    subValue: stats.value?.revenue?.failedInvoicesCount > 0 ? `${stats.value.revenue.failedInvoicesCount} faturas com falha (Stripe)` : 'Sem falhas de cobrança',
    icon: DollarSign,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  },
  { 
    label: 'MRR Atual Recorrente', 
    value: (stats.value?.revenue?.mrr || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    subValue: `ARR Estimado: ${((stats.value?.revenue?.mrr || 0) * 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
    icon: TrendingUp,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  { 
    label: 'Total de Usuários', 
    value: stats.value?.users?.total || 0,
    subValue: `+${stats.value?.users?.newMonth || 0} este mês | Churn: ${stats.value?.users?.churnRate ?? 0}%`,
    icon: Users,
    color: 'text-purple-600',
    bg: 'bg-purple-50'
  },
  { 
    label: 'Conversão Comercial', 
    value: `${stats.value?.proposals?.conversionRate?.toFixed(1) || 0}%`,
    subValue: `${stats.value?.proposals?.accepted || 0} de ${stats.value?.proposals?.total || 0} propostas aprovadas`,
    icon: FileText,
    color: 'text-orange-600',
    bg: 'bg-orange-50'
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

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { 
      position: 'bottom' as const, 
      labels: { usePointStyle: true, font: { weight: 'bold' as const, size: 10 } } 
    }
  }
}

const { data: systemInfo } = useFetch<any>('/api/system/status')

// Formatação de data/hora nos logs do console
function formatLogTime(isoString: string) {
  const date = new Date(isoString)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-10">
    
    <!-- Cabeçalho Principal -->
    <PageHeader title="Painel de Administração" :subtitle="`Visão geral e telemetria global da plataforma ${systemInfo?.landingPage?.appName || 'Orcei Fácil'}.`" >
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
      <div v-for="i in 4" :key="i" class="h-36 bg-gray-100 animate-pulse rounded-[2rem]"></div>
    </div>

    <template v-else-if="stats">
      
      <!-- Metrics Grid -->
      <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          v-for="m in metrics" 
          :key="m.label" 
          class="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
        >
          <div class="flex justify-between items-start">
            <div :class="[m.bg, m.color]" class="p-3 rounded-2xl">
              <component :is="m.icon" class="w-6 h-6" />
            </div>
            <ArrowUpRight class="w-4 h-4 text-gray-300 group-hover:text-gray-900 transition-colors" />
          </div>
          <div>
            <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest">{{ m.label }}</p>
            <h3 class="text-2xl font-black text-gray-900 tracking-tight mt-1">{{ m.value }}</h3>
            <p v-if="m.subValue" class="text-[10px] font-bold text-gray-400 mt-1 truncate">{{ m.subValue }}</p>
          </div>
        </div>
      </section>

      <!-- Seção Adicional: Telemetria de Infraestrutura e Custos de IA -->
      <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- Custo do Gemini -->
        <div class="bg-slate-900 text-white p-6 rounded-[2rem] border border-white/5 shadow-inner flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Custo de API</span>
            <h4 class="text-xs font-black uppercase text-slate-300">Inteligência Artificial (Gemini)</h4>
            <p class="text-2xl font-black text-white">
              U$ {{ (stats.telemetry?.geminiCostUsd ?? 0).toFixed(2) }}
            </p>
          </div>
          <div class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400">
            <Cpu class="w-6 h-6" />
          </div>
        </div>

        <!-- Latência do Puppeteer -->
        <div class="bg-slate-900 text-white p-6 rounded-[2rem] border border-white/5 shadow-inner flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Servidor de PDF</span>
            <h4 class="text-xs font-black uppercase text-slate-300">Latência do Puppeteer</h4>
            <p class="text-2xl font-black text-white">
              {{ stats.telemetry?.pdfAvgLatencyMs ?? 0 }} <span class="text-xs text-slate-400">ms</span>
            </p>
          </div>
          <div class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-emerald-400">
            <Zap class="w-6 h-6" />
          </div>
        </div>

        <!-- Stickiness de Engajamento -->
        <div class="bg-slate-900 text-white p-6 rounded-[2rem] border border-white/5 shadow-inner flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-[8px] font-black text-purple-400 uppercase tracking-widest">Engajamento SaaS</span>
            <h4 class="text-xs font-black uppercase text-slate-300">Métrica Stickiness (DAU/MAU)</h4>
            <p class="text-2xl font-black text-white">
              {{ (stats.users?.stickiness ?? 0).toFixed(1) }}%
            </p>
          </div>
          <div class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-purple-400">
            <Activity class="w-6 h-6" />
          </div>
        </div>

      </section>

      <!-- Financial Analysis Charts -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Previsibilidade de Receita Stripe -->
        <div class="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <BarChart3 class="w-5 h-5 text-blue-600" />
            </div>
            <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Previsibilidade Financeira</h2>
          </div>
          <div class="h-80 relative">
            <Line :data="forecastChartData" :options="chartOptions" />
          </div>
        </div>

        <!-- Distribuição de Faturamento por Origem -->
        <div class="lg:col-span-1 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <PieChart class="w-5 h-5 text-emerald-600" />
            </div>
            <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Origem da Receita</h2>
          </div>
          <div class="h-80 relative flex items-center justify-center">
            <Doughnut :data="breakdownChartData" :options="chartOptions" />
          </div>
        </div>

      </section>

      <!-- Quick Actions, Server Status & Audit Logs Terminal Console -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Ações Administrativas e Status do Sistema -->
        <div class="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Activity class="w-5 h-5 text-blue-600" />
            </div>
            <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Status do Sistema</h2>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <NuxtLink to="/admin/settings" class="p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:border-blue-200 transition-all group flex flex-col justify-between">
              <div>
                <ShieldAlert class="w-6 h-6 text-red-500 mb-4" />
                <h4 class="font-black text-gray-900 uppercase text-xs tracking-widest mb-1">Modo Manutenção</h4>
                <p class="text-xs text-gray-500 font-medium leading-relaxed">Coloque a plataforma offline para usuários comuns.</p>
              </div>
            </NuxtLink>
            <NuxtLink to="/admin/audit-logs" class="p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:border-blue-200 transition-all group flex flex-col justify-between">
              <div>
                <CreditCard class="w-6 h-6 text-emerald-500 mb-4" />
                <h4 class="font-black text-gray-900 uppercase text-xs tracking-widest mb-1">Logs de Auditoria</h4>
                <p class="text-xs text-gray-500 font-medium leading-relaxed">Histórico detalhado de ações administrativas.</p>
              </div>
            </NuxtLink>
            <NuxtLink to="/admin/coupons" class="p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:border-blue-200 transition-all group flex flex-col justify-between">
              <div>
                <Ticket class="w-6 h-6 text-blue-500 mb-4" />
                <h4 class="font-black text-gray-900 uppercase text-xs tracking-widest mb-1">Cupons Promocionais</h4>
                <p class="text-xs text-gray-500 font-medium leading-relaxed">Crie e gerencie cupons de créditos via Stripe.</p>
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- Terminal de Logs de Auditoria Embutido Compacto -->
        <div class="lg:col-span-1 bg-slate-950 text-slate-300 p-8 rounded-[3.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-between h-[360px] border border-white/5">
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b border-white/5 pb-3">
              <div class="flex items-center gap-2">
                <Terminal class="w-4 h-4 text-indigo-400" />
                <span class="text-[9px] font-black uppercase tracking-widest text-indigo-400 font-mono">Audit System Log</span>
              </div>
              <div class="flex gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              </div>
            </div>

            <!-- Terminal Stream Screen -->
            <div class="font-mono text-[9px] space-y-3 max-h-[220px] overflow-y-auto scrollbar-hide select-none leading-relaxed">
              <div v-for="(log, idx) in stats.auditConsoleLogs" :key="idx" class="space-y-0.5">
                <div class="flex items-center gap-1.5 text-slate-500">
                  <span>[{{ formatLogTime(log.timestamp) }}]</span>
                  <span class="text-indigo-300 font-bold">{{ log.adminName }}</span>
                  <span class="text-slate-400">➔</span>
                  <span class="text-green-400 font-bold">{{ log.action }}</span>
                </div>
                <div class="pl-4 text-slate-400 truncate max-w-xs">
                  {{ log.details }}
                </div>
              </div>
            </div>
          </div>

          <NuxtLink 
            to="/admin/users" 
            class="block w-full text-center py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-black uppercase text-[8px] tracking-[0.2em] hover:text-white transition-all font-mono"
          >
            Acessar Console de Usuários
          </NuxtLink>
        </div>

      </section>

    </template>
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
