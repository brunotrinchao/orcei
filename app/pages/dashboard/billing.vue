<script setup lang="ts">
import { CreditCard, History, Zap, CheckCircle2, Loader2, ArrowRight } from 'lucide-vue-next'
import type { ProfileDTO } from '../../../types'

const { data: profile, refresh: refreshProfile } = useFetch<ProfileDTO>('/api/profile')
const { notify } = useAlerts()

const plans = [
  {
    name: 'Mensal',
    price: 'R$ 19,90',
    description: 'Uso ilimitado por 30 dias',
    features: ['Orçamentos Ilimitados', 'Agenda FullCalendar', 'Relatórios IA', 'Suporte Prioritário'],
    priceId: 'price_monthly_1990',
    tier: 'premium_monthly'
  },
  {
    name: 'Anual',
    price: 'R$ 199,90',
    description: 'Economize 15% ao ano',
    features: ['Orçamentos Ilimitados', 'Agenda FullCalendar', 'Relatórios IA', 'Suporte VIP'],
    priceId: 'price_annual_19990',
    tier: 'premium_annual',
    highlight: true
  }
]

const singleBudget = {
  name: 'Orçamento Avulso',
  price: 'R$ 5,99',
  credits: 1,
  tier: 'single_credit'
}

const isLoading = ref<string | null>(null)

async function handleAction(tier: string, type: 'subscription' | 'credits' = 'subscription') {
  isLoading.value = tier
  try {
    const { url } = await $fetch('/api/stripe/checkout', {
      method: 'POST',
      body: { tier, type }
    })
    if (url) window.location.href = url
  } catch (e: any) {
    notify('Erro', e.data?.statusMessage || 'Erro ao iniciar checkout')
  } finally {
    isLoading.value = null
  }
}

const route = useRoute()
const success = computed(() => route.query.success === 'true')

const history = ref([
  { id: '1', date: '2026-05-10', amount: 'R$ 19,90', status: 'pago', method: 'Cartão final 4242' },
  { id: '2', date: '2026-04-10', amount: 'R$ 19,90', status: 'pago', method: 'Cartão final 4242' }
])
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-12">
    <header class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div>
        <h1 class="text-4xl font-black text-gray-900 tracking-tight uppercase">Plano e Faturamento</h1>
        <p class="text-gray-500 font-medium">Gerencie sua assinatura e créditos de orçamentos.</p>
      </div>
      
      <div class="bg-gray-900 text-white p-6 rounded-[2rem] shadow-2xl flex items-center gap-6">
        <div class="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
          <Zap class="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo Atual</p>
          <p class="text-2xl font-black">{{ profile?.creditsBalance || 0 }} <span class="text-xs font-bold opacity-50 uppercase">Créditos</span></p>
        </div>
      </div>
    </header>

    <div v-if="success" class="bg-green-50 border-2 border-green-100 p-6 rounded-3xl flex items-center gap-4 text-green-700 animate-in fade-in slide-in-from-top-4">
      <CheckCircle2 class="w-6 h-6 shrink-0" />
      <p class="font-bold">Pagamento processado com sucesso! Seus benefícios foram atualizados.</p>
    </div>

    <!-- Planos de Assinatura -->
    <section>
      <div class="flex items-center gap-3 mb-8">
        <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Assinatura Ilimitada</h2>
        <div class="h-px flex-1 bg-gray-100"></div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div 
          v-for="plan in plans" 
          :key="plan.tier"
          :class="{
            'bg-white p-10 rounded-[3rem] border-2 transition-all flex flex-col relative overflow-hidden': true,
            'border-blue-600 ring-8 ring-blue-50': plan.highlight,
            'border-gray-100 hover:border-gray-200': !plan.highlight
          }"
        >
          <div v-if="plan.highlight" class="absolute top-8 right-[-35px] bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-10 py-1 rotate-45 shadow-lg">
            Popular
          </div>

          <div class="mb-10">
            <h3 class="text-2xl font-black text-gray-900 uppercase tracking-tight">{{ plan.name }}</h3>
            <p class="text-gray-500 font-medium text-sm mt-1">{{ plan.description }}</p>
            <div class="mt-6 flex items-baseline gap-1">
              <span class="text-4xl font-black text-gray-900">{{ plan.price }}</span>
            </div>
          </div>

          <ul class="space-y-4 mb-10 flex-1">
            <li v-for="f in plan.features" :key="f" class="flex items-center gap-3 text-sm font-bold text-gray-600">
              <div class="w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 class="w-3.5 h-3.5" />
              </div>
              {{ f }}
            </li>
          </ul>

          <BaseButton 
            @click="handleAction(plan.tier)" 
            :disabled="isLoading === plan.tier"
            class="w-full py-5 rounded-[1.5rem]"
            :variant="plan.highlight ? 'primary' : 'secondary'"
          >
            <Loader2 v-if="isLoading === plan.tier" class="w-5 h-5 animate-spin mr-2" />
            Ativar Plano {{ plan.name }}
          </BaseButton>
        </div>
      </div>
    </section>

    <!-- Crédito Avulso -->
    <section class="bg-blue-50/50 p-10 md:p-12 rounded-[3.5rem] border border-blue-100">
      <div class="flex flex-col md:flex-row justify-between items-center gap-8">
        <div class="max-w-md text-center md:text-left">
          <h2 class="text-2xl font-black text-gray-900 uppercase tracking-tight">Precisa de apenas um orçamento?</h2>
          <p class="text-gray-600 font-medium mt-2">Compre créditos avulsos por apenas <span class="text-blue-600 font-black">R$ 5,99</span> cada. Sem assinatura, sem mensalidade.</p>
        </div>
        <BaseButton 
          @click="handleAction(singleBudget.tier, 'credits')"
          :disabled="isLoading === singleBudget.tier"
          class="px-12 py-5 rounded-[2rem] bg-gray-900 text-white hover:bg-black shadow-2xl"
        >
          <Loader2 v-if="isLoading === singleBudget.tier" class="w-5 h-5 animate-spin mr-2" />
          Comprar 1 Crédito (R$ 5,99)
        </BaseButton>
      </div>
    </section>

    <!-- Histórico de Pagamento -->
    <section>
      <div class="flex items-center gap-3 mb-8">
        <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Histórico de Cobrança</h2>
        <div class="h-px flex-1 bg-gray-100"></div>
      </div>

      <div class="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50/50 border-b border-gray-100">
              <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</th>
              <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor</th>
              <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Método</th>
              <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="item in history" :key="item.id" class="hover:bg-gray-50/30 transition-all">
              <td class="px-8 py-6 text-sm font-bold text-gray-600">{{ new Date(item.date).toLocaleDateString('pt-BR') }}</td>
              <td class="px-8 py-6 text-sm font-black text-gray-900">{{ item.amount }}</td>
              <td class="px-8 py-6 text-xs font-medium text-gray-500">{{ item.method }}</td>
              <td class="px-8 py-6 text-right">
                <span class="bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">Pago</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
