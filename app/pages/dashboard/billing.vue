<script setup lang="ts">
import { SubscriptionPlan } from '../../../types/enums'
import { CreditCard, History, Zap, CheckCircle2, Loader2, ArrowRight, Download, AlertTriangle } from 'lucide-vue-next'
import type { ProfileDTO } from '../../../types'

const { data: profile, refresh: refreshProfile, pending: pendingProfile } = useLazyFetch<ProfileDTO>('/api/profile')
const { notify } = useAlerts()

const { data: plans, pending: loadingPlans } = useLazyFetch<any[]>('/api/stripe/plans')

const billingCycle = ref<'monthly' | 'annual'>('monthly')
const isLoading = ref<string | null>(null)
const isCanceling = ref(false)

const subscriptionPlans = computed(() => {
  return plans.value?.filter(p => [SubscriptionPlan.MONTHLY, SubscriptionPlan.ANNUAL].includes(p.planType)) || []
})

const selectedPlan = computed(() => {
  const type = billingCycle.value === 'monthly' ? SubscriptionPlan.MONTHLY : SubscriptionPlan.ANNUAL
  return subscriptionPlans.value.find(p => p.planType === type) || subscriptionPlans.value[0]
})

const isPlanActive = computed(() => profile.value?.subscriptionPlan && profile.value.subscriptionPlan !== SubscriptionPlan.FREE)
const isCancelScheduled = computed(() => !!profile.value?.cancelAtPeriodEnd)

const cancelEndDate = computed(() => {
  if (!profile.value?.subscriptionEndsAt) return null
  return new Date(profile.value.subscriptionEndsAt).toLocaleDateString('pt-BR')
})

async function handleManage() {
  isCanceling.value = true
  try {
    const { url } = await $fetch<any>('/api/stripe/portal', {
      method: 'POST'
    })
    if (url) window.location.href = url
  } catch (e: any) {
    notify('Erro', e.data?.statusMessage || 'Erro ao abrir portal de gerenciamento')
  } finally {
    isCanceling.value = false
  }
}

async function handleAction(tier: string, type: 'subscription' | 'credits' = 'subscription') {
  if (type === 'credits' && isPlanActive.value) {
    return notify('Aviso', 'Usuários com plano ativo possuem orçamentos ilimitados.')
  }

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
const portal = computed(() => route.query.portal === 'true')

const { data: history, refresh: refreshInvoices, pending: pendingHistory } = useLazyFetch<any[]>('/api/stripe/invoices')

// Refresh profile when user returns from Stripe Portal (e.g. after cancellation)
onMounted(() => {
  refreshProfile()
  refreshInvoices()

  // Clear query params after success or portal return
  if (import.meta.client && (success.value || portal.value)) {
    setTimeout(() => {
      navigateTo('/dashboard/billing', { replace: true })
    }, 5000)
  }

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      refreshProfile()
      refreshInvoices()
    }
  }
  document.addEventListener('visibilitychange', onVisibilityChange)
  onBeforeUnmount(() => document.removeEventListener('visibilitychange', onVisibilityChange))
})
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

    <!-- Cancellation scheduled banner -->
    <div
      v-if="isCancelScheduled"
      class="bg-amber-50 border-2 border-amber-200 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center gap-4 text-amber-800"
    >
      <AlertTriangle class="w-6 h-6 shrink-0 text-amber-500" />
      <div class="flex-1">
        <p class="font-bold">
          Sua assinatura será cancelada em {{ cancelEndDate }}.
        </p>
        <p class="text-sm font-medium opacity-80">
          Você continuará com acesso premium até essa data. Reative para manter o plano.
        </p>
      </div>
      <BaseButton
        @click="handleManage"
        :disabled="isCanceling"
        variant="primary"
        class="rounded-2xl shrink-0"
      >
        <Loader2 v-if="isCanceling" class="w-4 h-4 animate-spin mr-2" />
        Reativar Plano
      </BaseButton>
    </div>

    <!-- Planos de Assinatura -->
    <section>
      <div class="flex flex-col items-center mb-12">
        <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Assinatura Profissional</h2>
        
        <!-- Toggle Mensal/Anual -->
        <div class="bg-gray-100 p-1.5 rounded-[1.5rem] flex items-center shadow-inner">
          <button 
            @click="billingCycle = 'monthly'"
            :class="[
              'px-8 py-3 rounded-[1.2rem] text-xs font-black uppercase tracking-widest transition-all',
              billingCycle === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            ]"
          >
            Mensal
          </button>
          <button 
            @click="billingCycle = 'annual'"
            :class="[
              'px-8 py-3 rounded-[1.2rem] text-xs font-black uppercase tracking-widest transition-all relative flex items-center gap-2',
              billingCycle === 'annual' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            ]"
          >
            Anual
            <span v-if="billingCycle !== 'annual'" class="absolute -top-1 -right-4 bg-green-500 text-white text-[8px] px-2 py-0.5 rounded-full animate-bounce">
              -15%
            </span>
          </button>
        </div>
        <p class="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <RefreshCcw class="w-3 h-3" /> Cobrança Recorrente
        </p>
      </div>
      
      <div v-if="loadingPlans" class="max-w-xl mx-auto">
        <div class="bg-white p-10 rounded-[3rem] border-2 border-gray-100 animate-pulse h-[550px]">
          <div class="h-8 bg-gray-100 rounded-xl w-1/3 mb-4 mx-auto"></div>
          <div class="h-4 bg-gray-100 rounded-xl w-2/3 mb-10 mx-auto"></div>
          <div class="h-12 bg-gray-100 rounded-xl w-1/2 mb-10 mx-auto"></div>
          <div class="space-y-4">
            <div v-for="j in 6" :key="j" class="h-4 bg-gray-100 rounded-xl w-full"></div>
          </div>
        </div>
      </div>

      <div v-else-if="selectedPlan" class="max-w-xl mx-auto">
        <div 
          :class="{
            'bg-white p-10 rounded-[3rem] border-2 transition-all flex flex-col relative overflow-hidden shadow-xl shadow-blue-500/5': true,
            'border-blue-600 ring-8 ring-blue-50': selectedPlan.highlight || billingCycle === 'annual',
            'border-gray-100': !(selectedPlan.highlight || billingCycle === 'annual')
          }"
        >
          <div v-if="billingCycle === 'annual'" class="absolute top-8 right-[-35px] bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-10 py-1 rotate-45 shadow-lg">
            Melhor Valor
          </div>

          <div class="text-center mb-10">
            <BaseBadge variant="info" class="mb-4">Orçamentos Ilimitados</BaseBadge>
            <h3 class="text-3xl font-black text-gray-900 uppercase tracking-tight">{{ selectedPlan.name }}</h3>
            <p class="text-gray-500 font-medium text-sm mt-2 max-w-xs mx-auto">{{ selectedPlan.description }}</p>
            
            <div class="mt-8 flex flex-col items-center">
              <div class="flex items-baseline gap-1">
                <span class="text-5xl font-black text-gray-900">{{ selectedPlan.price }}</span>
                <span class="text-sm font-bold text-gray-400 uppercase tracking-widest">
                  {{ billingCycle === 'annual' ? '/ ano' : '/ mês' }}
                </span>
              </div>
              <p v-if="billingCycle === 'annual'" class="text-green-600 text-[10px] font-black uppercase tracking-widest mt-2 bg-green-50 px-3 py-1 rounded-full">
                Economia de aproximadamente 2 meses
              </p>
            </div>
          </div>

          <div class="h-px bg-gray-100 mb-10"></div>

          <ul class="space-y-4 mb-10 flex-1">
            <li v-for="f in selectedPlan.features" :key="f" class="flex items-center gap-3 text-sm font-bold text-gray-600">
              <div class="w-6 h-6 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 class="w-4 h-4" />
              </div>
              {{ f }}
            </li>
          </ul>

          <BaseButton 
            @click="handleAction(selectedPlan.tier || selectedPlan.priceId)" 
            :disabled="isLoading === (selectedPlan.tier || selectedPlan.priceId) || profile?.subscriptionPlan === selectedPlan.planType || profile?.stripePriceId === selectedPlan.priceId"
            class="w-full py-6 rounded-[2rem] text-base"
            :variant="(profile?.subscriptionPlan === selectedPlan.planType || profile?.stripePriceId === selectedPlan.priceId) ? 'outline' : 'primary'"
          >
            <Loader2 v-if="isLoading === (selectedPlan.tier || selectedPlan.priceId)" class="w-5 h-5 animate-spin mr-2" />
            <template v-if="profile?.subscriptionPlan === selectedPlan.planType || profile?.stripePriceId === selectedPlan.priceId">
              <CheckCircle2 class="w-5 h-5 mr-2" /> Seu Plano Atual
            </template>
            <template v-else>
              Assinar Plano {{ selectedPlan.name }}
            </template>
          </BaseButton>
          
          <p class="text-center mt-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Cancele a qualquer momento sem taxas
          </p>
        </div>
      </div>
    </section>

    <!-- Créditos Avulsos -->
    <section v-if="!isPlanActive">
      <div class="flex items-center gap-3 mb-8">
        <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Orçamento Avulso</h2>
        <div class="h-px flex-1 bg-gray-100"></div>
      </div>

      <div class="max-w-md">
        <div class="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col items-center text-center">
          <div class="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
            <Zap class="w-6 h-6" />
          </div>
          <h3 class="text-lg font-black text-gray-900 uppercase tracking-tight">1 Crédito</h3>
          <p class="text-gray-500 font-medium text-xs mt-1">Gere um orçamento avulso sem assinatura.</p>
          <div class="mt-4 mb-8">
            <span class="text-3xl font-black text-gray-900">R$ 5,99</span>
          </div>
          <BaseButton 
            @click="handleAction('single_credit', 'credits')"
            :disabled="!!isLoading"
            variant="outline"
            class="w-full rounded-2xl"
          >
            <Loader2 v-if="isLoading === 'single_credit'" class="w-4 h-4 animate-spin mr-2" />
            Comprar Crédito
          </BaseButton>
        </div>
      </div>
    </section>

    <div v-else class="bg-blue-50/50 p-10 md:p-12 rounded-[3.5rem] border border-blue-100 flex flex-col md:flex-row justify-between items-center gap-8">
      <div class="max-w-md text-center md:text-left">
        <h2 class="text-2xl font-black text-gray-900 uppercase tracking-tight">Você possui Plano Ativo</h2>
        <p class="text-gray-600 font-medium mt-2">Sua assinatura <span class="text-blue-600 font-black uppercase">{{ profile?.subscriptionPlan }}</span> garante orçamentos ilimitados e todos os recursos premium liberados.</p>
        <button
          @click="handleManage"
          :disabled="isCanceling"
          class="mt-6 text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Loader2 v-if="isCanceling" class="w-3 h-3 animate-spin" />
          {{ isCancelScheduled ? 'Reativar via Portal Stripe' : 'Gerenciar Assinatura ou Cancelar' }}
        </button>
      </div>
      <div :class="[
        'px-8 py-4 rounded-2xl border shadow-sm font-black uppercase text-[10px] tracking-widest flex items-center gap-2',
        isCancelScheduled
          ? 'bg-amber-50 text-amber-700 border-amber-100'
          : 'bg-white text-blue-600 border-blue-100'
      ]">
        <CheckCircle2 class="w-4 h-4" /> {{ isCancelScheduled ? 'Cancelamento Agendado' : 'Assinatura Ativa' }}
      </div>
    </div>

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
              <td class="px-8 py-6 text-xs font-medium text-gray-500">
                <div class="flex items-center gap-2">
                  {{ item.method }}
                  <a v-if="item.pdf" :href="item.pdf" target="_blank" class="text-blue-600 hover:underline flex items-center gap-1">
                    <Download class="w-3 h-3" /> PDF
                  </a>
                </div>
              </td>
              <td class="px-8 py-6 text-right">
                <span 
                  :class="[
                    'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border',
                    item.status === 'paid' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                  ]"
                >
                  {{ item.status === 'paid' ? 'Pago' : item.status }}
                </span>
              </td>
            </tr>
            <tr v-if="!history?.length">
              <td colspan="4" class="px-8 py-20 text-center text-gray-400 font-medium">
                Nenhum histórico de cobrança encontrado.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
