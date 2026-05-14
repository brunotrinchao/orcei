<script setup lang="ts">
import type { ProposalDTO } from '~/types'

definePageMeta({
  layout: 'blank'
})

const route = useRoute()
const { data: proposal, refresh } = useFetch<ProposalDTO>(`/api/proposals/public/${route.params.slug}`)

const isAccepting = ref(false)
const selectedMethod = ref<'cash' | 'credit_card'>('cash')

// Initialize with the PROFESSIONAL'S suggested method
watchEffect(() => {
  if (proposal.value) {
    selectedMethod.value = proposal.value.paymentConfig?.method || 'cash'
  }
})

const finalTotal = computed(() => {
  if (!proposal.value) return 0
  const subtotal = proposal.value.totals.subtotal
  if (selectedMethod.value === 'cash') {
    return subtotal * (1 - (proposal.value.paymentConfig.cashDiscount / 100))
  }
  return subtotal
})

async function handleAccept() {
  if (!confirm('Ao aceitar esta proposta, você concorda com os termos e condições. Deseja prosseguir?')) return
  
  isAccepting.value = true
  try {
    await $fetch('/api/proposals/public/accept', {
      method: 'POST',
      body: { 
        slug: route.params.slug,
        paymentMethod: selectedMethod.value
      }
    })
    await refresh()
    alert('Proposta aceita com sucesso! O profissional será notificado.')
  } catch (e: any) {
    alert(e.data?.statusMessage || 'Erro ao aceitar proposta')
  } finally {
    isAccepting.value = false
  }
}
</script>

<template>
  <div v-if="proposal" class="min-h-screen bg-gray-50 pb-20">
    <!-- Header Premium -->
    <header 
      class="text-white py-12 px-6 sm:py-20 sm:px-10 transition-colors"
      :class="{
        'bg-blue-600': proposal.status === 'pending' || proposal.status === 'created',
        'bg-green-600': proposal.status === 'accepted'
      }"
    >
      <div class="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h1 class="text-3xl sm:text-4xl font-bold">{{ proposal.title }}</h1>
          <p class="mt-2 opacity-90 text-sm sm:text-base">Orçamento preparado para <span class="font-bold">{{ proposal.client.name }}</span></p>
        </div>
        <div class="text-left sm:text-right">
          <p class="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">Status</p>
          <p class="text-xl sm:text-2xl font-bold">{{ proposal.status === 'accepted' ? 'Aceita' : 'Pendente' }}</p>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto -mt-10 px-4">
      <!-- Info Freelancer -->
      <div class="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div class="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
          <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
            {{ (proposal.profileId as any)?.name?.charAt(0) }}
          </div>
          <div>
            <p class="text-lg font-bold text-gray-900">{{ (proposal.profileId as any)?.name }}</p>
            <p class="text-sm text-gray-500">{{ (proposal.profileId as any)?.email }}</p>
            <p v-if="(proposal.profileId as any)?.address?.street" class="text-xs text-gray-400 mt-1">
              {{ (proposal.profileId as any).address.street }}, {{ (proposal.profileId as any).address.number || '' }} - {{ (proposal.profileId as any).address.neighborhood || '' }}<br>
              {{ (proposal.profileId as any).address.city || '' }}/{{ (proposal.profileId as any).address.state || '' }} - {{ (proposal.profileId as any).address.zip || '' }}
            </p>
          </div>
        </div>
        <div class="text-center sm:text-right">
          <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Emitida em</p>
          <p class="text-sm font-medium text-gray-700">{{ new Date(proposal.createdAt).toLocaleDateString('pt-BR') }}</p>
        </div>
      </div>

      <!-- Itens do Orçamento -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div class="p-6 sm:p-8 border-b border-gray-50 bg-gray-50/50">
          <h2 class="text-xl font-bold text-gray-900">Escopo dos Serviços</h2>
        </div>
        <div class="divide-y divide-gray-50">
          <div v-for="item in proposal.items" :key="item.name" class="p-6 sm:p-8">
            <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div class="flex-1">
                <h3 class="font-bold text-gray-900 text-lg mb-2">{{ item.name }}</h3>
                <p class="text-gray-600 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">{{ item.description }}</p>
              </div>
              <div class="text-left sm:text-right shrink-0 bg-blue-50 sm:bg-transparent p-3 sm:p-0 rounded-xl w-full sm:w-auto">
                <p class="text-xs font-bold text-blue-600 sm:text-gray-400 uppercase tracking-widest mb-1">Investimento</p>
                <p class="text-xl font-black text-blue-700 sm:text-gray-900">R$ {{ (item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
                <p v-if="item.quantity > 1" class="text-xs text-gray-500 mt-1">{{ item.quantity }}x R$ {{ item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Escolha da Forma de Pagamento (Client Choice) -->
      <div v-if="proposal.status !== 'accepted'" class="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 p-6 sm:p-8">
        <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Escolha a Forma de Pagamento
        </h2>
        
        <div class="flex flex-col sm:flex-row gap-4">
          <button 
            @click="selectedMethod = 'cash'"
            :class="{
              'flex-1 p-6 rounded-2xl border-2 transition-all text-left group': true,
              'border-blue-600 bg-blue-50/50 ring-4 ring-blue-50': selectedMethod === 'cash',
              'border-gray-100 hover:border-blue-200 bg-white': selectedMethod !== 'cash'
            }"
          >
            <div class="flex justify-between items-center mb-3">
              <span class="font-bold text-gray-900 text-lg">À Vista</span>
              <div v-if="selectedMethod === 'cash'" class="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div v-else class="w-6 h-6 border-2 border-gray-200 rounded-full"></div>
            </div>
            <p class="text-sm text-gray-600 leading-relaxed">
              {{ proposal.paymentConfig.cashDiscount > 0 ? `Economize ${proposal.paymentConfig.cashDiscount}% pagando via PIX ou Boleto.` : 'Pagamento integral no ato da contratação.' }}
            </p>
            <div class="mt-4 pt-4 border-t border-gray-100 flex items-baseline gap-2">
              <span class="text-xs font-bold text-gray-400 uppercase">Total</span>
              <span class="text-xl font-black text-blue-700">R$ {{ (proposal.totals.subtotal * (1 - (proposal.paymentConfig.cashDiscount / 100))).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
            </div>
          </button>

          <button 
            @click="selectedMethod = 'credit_card'"
            :class="{
              'flex-1 p-6 rounded-2xl border-2 transition-all text-left group': true,
              'border-blue-600 bg-blue-50/50 ring-4 ring-blue-50': selectedMethod === 'credit_card',
              'border-gray-100 hover:border-blue-200 bg-white': selectedMethod !== 'credit_card'
            }"
          >
            <div class="flex justify-between items-center mb-3">
              <span class="font-bold text-gray-900 text-lg">Cartão de Crédito</span>
              <div v-if="selectedMethod === 'credit_card'" class="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div v-else class="w-6 h-6 border-2 border-gray-200 rounded-full"></div>
            </div>
            <p class="text-sm text-gray-600 leading-relaxed">
              Parcele em até {{ proposal.paymentConfig.installments }}x de R$ {{ (proposal.totals.subtotal / proposal.paymentConfig.installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }} sem juros.
            </p>
            <div class="mt-4 pt-4 border-t border-gray-100 flex items-baseline gap-2">
              <span class="text-xs font-bold text-gray-400 uppercase">Total</span>
              <span class="text-xl font-black text-blue-700">R$ {{ proposal.totals.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Contrato -->
      <div v-if="proposal.contractText" class="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
        <div class="p-6 sm:p-8 border-b border-gray-50 bg-gray-50/50">
          <h2 class="text-xl font-bold text-gray-900">Contrato e Detalhes</h2>
        </div>
        <div class="p-6 sm:p-8 prose prose-blue max-w-none">
          <div v-html="proposal.contractText"></div>
        </div>
      </div>

      <!-- Footer de Decisão -->
      <div class="bg-gray-900 text-white p-8 sm:p-12 rounded-3xl shadow-2xl flex flex-col sm:flex-row justify-between items-center gap-8">
        <div class="text-center sm:text-left">
          <p class="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Total do Investimento</p>
          <p class="text-4xl sm:text-5xl font-black">R$ {{ finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
          <p v-if="proposal.status !== 'accepted'" class="text-sm font-bold text-blue-400 mt-2 uppercase tracking-tight">
            {{ selectedMethod === 'cash' ? 'À Vista' : 'Cartão de Crédito' }} 
            — 
            <span v-if="selectedMethod === 'cash'">
              {{ proposal.paymentConfig.cashDiscount > 0 ? `${proposal.paymentConfig.cashDiscount}% de desconto` : 'Preço integral' }}
            </span>
            <span v-else>
              {{ proposal.paymentConfig.installments }}x de R$ {{ (proposal.totals.subtotal / proposal.paymentConfig.installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
            </span>
          </p>
          <p v-else-if="proposal.paymentConfig" class="text-sm font-bold text-blue-400 mt-2 uppercase tracking-tight">
            {{ proposal.paymentConfig.method === 'cash' ? 'À Vista' : 'Cartão de Crédito' }} 
            — 
            <span v-if="proposal.paymentConfig.method === 'cash'">
              {{ proposal.paymentConfig.cashDiscount > 0 ? `${proposal.paymentConfig.cashDiscount}% de desconto` : 'Preço integral' }}
            </span>
            <span v-else>
              {{ proposal.paymentConfig.installments }}x de R$ {{ (proposal.totals.final / proposal.paymentConfig.installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
            </span>
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-4 items-center">
          <a 
            :href="`/api/proposals/public/${route.params.slug}/pdf`" 
            target="_blank"
            class="text-gray-400 hover:text-white font-bold text-sm flex items-center gap-2 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF
          </a>
          <div v-if="proposal.status !== 'accepted'">
            <button 
              @click="handleAccept"
              :disabled="isAccepting"
              class="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-bold text-lg transition shadow-xl shadow-blue-900/20 disabled:opacity-50 flex items-center gap-3"
            >
              <span v-if="isAccepting" class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
              {{ isAccepting ? 'Processando...' : 'Aceitar Proposta' }}
            </button>
          </div>
          <div v-else class="flex items-center gap-3 bg-green-500/20 text-green-400 px-6 py-3 rounded-2xl border border-green-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span class="font-bold">Proposta Aceita</span>
          </div>
        </div>
      </div>

      <!-- Termos -->
      <div v-if="proposal.termsAndConditions" class="mt-12 text-center max-w-2xl mx-auto">
        <button class="text-gray-400 hover:text-gray-600 text-xs font-bold uppercase tracking-widest underline decoration-dotted underline-offset-4">
          Termos e Condições
        </button>
        <div class="mt-6 text-left bg-white p-6 rounded-xl border border-gray-100 text-xs text-gray-500 leading-relaxed shadow-sm">
          <div v-html="proposal.termsAndConditions"></div>
        </div>
      </div>
    </main>

    <!-- Floating Action Button Mobile -->
    <div v-if="proposal.status !== 'accepted'" class="fixed bottom-6 left-6 right-6 sm:hidden">
      <button 
        @click="handleAccept"
        :disabled="isAccepting"
        class="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-2xl flex justify-center items-center gap-3"
      >
        <span v-if="isAccepting" class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
        {{ isAccepting ? 'Processando...' : 'Aceitar Proposta' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.prose :deep(h2) {
  @apply text-xl font-bold text-gray-900 mb-4 mt-8;
}
.prose :deep(p) {
  @apply text-gray-600 mb-4;
}
.prose :deep(ul) {
  @apply list-disc pl-5 mb-4 space-y-2;
}
</style>
