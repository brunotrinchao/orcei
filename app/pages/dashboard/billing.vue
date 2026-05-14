<script setup lang="ts">
import type { ProfileDTO } from '~/types'

const { data: profile } = useFetch<ProfileDTO>('/api/profile')

const plans = [
  {
    name: 'Free',
    price: 'R$ 0',
    features: ['1 proposta inclusa', 'Catálogo de serviços', 'Link público'],
    priceId: null,
    tier: 'free'
  },
  {
    name: 'Starter',
    price: 'R$ 29/mês',
    features: ['5 propostas por mês', 'Suporte prioritário', 'Sem marca d\'água'],
    priceId: 'STRIPE_STARTER_PRICE_ID', // Placeholder
    tier: 'starter'
  },
  {
    name: 'Premium',
    price: 'R$ 79/mês',
    features: ['Propostas ilimitadas', 'Domínio customizado', 'Análise de visualização'],
    priceId: 'STRIPE_PREMIUM_PRICE_ID', // Placeholder
    tier: 'premium'
  }
]

const creditPackages = [
  {
    name: '5 Créditos',
    price: 'R$ 19,90',
    credits: 5,
    tier: 'credits_5'
  },
  {
    name: '10 Créditos',
    price: 'R$ 35,90',
    credits: 10,
    tier: 'credits_10'
  }
]

const isLoading = ref<string | null>(null)

async function handleAction(tier: string | null, type: 'subscription' | 'credits' = 'subscription') {
  if (!tier || tier === 'free') return
  
  // Se for assinatura e o usuário já tiver uma ativa (diferente da atual), é uma troca
  if (type === 'subscription' && profile.value?.subscriptionPlan && profile.value?.subscriptionPlan !== 'free' && profile.value?.subscriptionPlan !== tier) {
    return handleManage('update', tier)
  }

  isLoading.value = tier
  try {
    const { url } = await $fetch('/api/stripe/checkout', {
      method: 'POST',
      body: { tier, type }
    })
    if (url) window.location.href = url
  } catch (e: any) {
    alert(e.data?.statusMessage || 'Erro ao iniciar checkout')
  } finally {
    isLoading.value = null
  }
}

async function handleManage(action: 'update' | 'cancel', tier?: string) {
  const loadingKey = action === 'cancel' ? 'cancel' : (tier || 'update')
  isLoading.value = loadingKey
  
  try {
    await $fetch('/api/stripe/manage', {
      method: 'POST',
      body: { action, tier }
    })
    await refreshNuxtData()
    alert(action === 'cancel' ? 'Assinatura cancelada com sucesso.' : 'Plano atualizado com sucesso!')
  } catch (e: any) {
    alert(e.data?.statusMessage || 'Erro ao processar solicitação')
  } finally {
    isLoading.value = null
  }
}

const route = useRoute()
const success = computed(() => route.query.success === 'true')
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <header class="mb-12 flex justify-between items-end">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Assinatura e Créditos</h1>
        <p class="text-gray-600">Escolha o plano ideal ou compre créditos avulsos.</p>
      </div>
      <div class="bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100">
        <p class="text-sm font-medium text-blue-600 uppercase tracking-wider">Seu Saldo</p>
        <p class="text-2xl font-black text-blue-700">{{ profile?.creditsBalance || 0 }} Créditos</p>
      </div>
    </header>

    <div v-if="success" class="mb-8 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-3">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Sua transação foi processada com sucesso! Os créditos serão atualizados em instantes.
    </div>

    <section class="mb-16">
      <h2 class="text-xl font-bold text-gray-900 mb-6">Planos Mensais</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div v-for="plan in plans" :key="plan.name" 
          :class="{
            'bg-white p-8 rounded-2xl shadow-sm border-2 flex flex-col': true,
            'border-blue-600 ring-4 ring-blue-50': profile?.subscriptionPlan === plan.tier,
            'border-gray-100': profile?.subscriptionPlan !== plan.tier
          }"
        >
          <div class="mb-6">
            <span v-if="profile?.subscriptionPlan === plan.tier" class="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded mb-4 inline-block">Plano Atual</span>
            <h2 class="text-2xl font-bold text-gray-900">{{ plan.name }}</h2>
            <p class="text-3xl font-black text-gray-900 mt-2">{{ plan.price }}</p>
          </div>

          <ul class="space-y-4 mb-8 flex-1">
            <li v-for="feature in plan.features" :key="feature" class="flex items-center gap-2 text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              {{ feature }}
            </li>
          </ul>

          <div v-if="plan.tier !== 'free'" class="space-y-3">
            <button 
              @click="handleAction(plan.tier)"
              :disabled="isLoading || profile?.subscriptionPlan === plan.tier"
              class="w-full py-3 rounded-xl font-bold transition flex justify-center items-center"
              :class="profile?.subscriptionPlan === plan.tier ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'"
            >
              <span v-if="isLoading === plan.tier">Processando...</span>
              <span v-else>
                {{ profile?.subscriptionPlan === plan.tier ? 'Plano Ativo' : 
                   (profile?.subscriptionPlan && profile?.subscriptionPlan !== 'free' ? 'Mudar para ' + plan.name : 'Escolher ' + plan.name) }}
              </span>
            </button>

            <button
              v-if="profile?.subscriptionPlan === plan.tier && plan.tier !== 'free'"
              @click="handleManage('cancel')"
              :disabled="!!isLoading"
              class="w-full py-2 text-sm font-medium text-red-600 hover:text-red-700 transition"
            >
              <span v-if="isLoading === 'cancel'">Cancelando...</span>
              <span v-else>Cancelar Assinatura</span>
            </button>
          </div>
          <button v-else disabled class="w-full py-3 rounded-xl font-bold bg-gray-100 text-gray-400 cursor-not-allowed">
            {{ profile?.subscriptionPlan === plan.tier ? 'Plano Ativo' : 'Grátis' }}
          </button>
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-xl font-bold text-gray-900 mb-6">Comprar Créditos Avulsos</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div v-for="pkg in creditPackages" :key="pkg.name" class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <h3 class="text-xl font-bold text-gray-900">{{ pkg.name }}</h3>
            <p class="text-gray-600">Uso imediato • Sem expiração</p>
          </div>
          <div class="text-right">
            <p class="text-2xl font-black text-gray-900 mb-2">{{ pkg.price }}</p>
            <button 
              @click="handleAction(pkg.tier, 'credits')"
              :disabled="!!isLoading"
              class="bg-gray-900 text-white px-8 py-2 rounded-lg font-bold hover:bg-gray-800 transition disabled:bg-gray-400"
            >
              <span v-if="isLoading === pkg.tier">...</span>
              <span v-else>Comprar</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
