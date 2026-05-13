<script setup lang="ts">
const route = useRoute()
const { data: proposal, error, refresh } = await useFetch(`/api/proposals/public/${route.params.slug}`)

// Layout desabilitado para exibição limpa ao cliente
definePageMeta({
  layout: false
})

const isAccepting = ref(false)
const showTerms = ref(false)

const pdfUrl = computed(() => `/api/proposals/public/${route.params.slug}/pdf`)

async function acceptProposal() {
  if (!proposal.value) return
  
  isAccepting.value = true
  try {
    await $fetch('/api/proposals/public/accept', {
      method: 'POST',
      body: { slug: route.params.slug }
    })
    await refresh()
    alert('Proposta aceita com sucesso!')
  } catch (e) {
    alert('Erro ao aceitar proposta')
  } finally {
    isAccepting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
    <div v-if="error" class="max-w-md mx-auto text-center">
      <h1 class="text-2xl font-bold text-gray-900">Proposta não encontrada</h1>
      <p class="mt-2 text-gray-600">O link pode ter expirado ou estar incorreto.</p>
      <NuxtLink to="/" class="mt-6 inline-block text-blue-600 font-medium">Voltar para o Orcei</NuxtLink>
    </div>

    <div v-else-if="proposal" class="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
      <!-- Header da Proposta -->
      <div :class="{
        'p-8 text-white transition-colors duration-500': true,
        'bg-blue-600': proposal.status === 'pending',
        'bg-green-600': proposal.status === 'accepted'
      }">
        <div class="flex justify-between items-start">
          <div>
            <h1 class="text-3xl font-bold">{{ proposal.title }}</h1>
            <p class="mt-1 opacity-90 text-sm">Orçamento preparado para {{ proposal.client.name }}</p>
          </div>
          <div class="text-right">
            <p class="text-sm opacity-80 uppercase tracking-widest font-semibold">Status</p>
            <p class="text-xl font-bold">{{ proposal.status === 'accepted' ? 'Aceito' : 'Pendente' }}</p>
          </div>
        </div>
      </div>

      <!-- Detalhes do Freelancer -->
      <div class="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
          <p class="text-xs uppercase text-gray-500 font-bold tracking-wider">Preparado por</p>
          <p class="text-lg font-bold text-gray-900">{{ proposal.profileId?.name }}</p>
          <p class="text-sm text-gray-500">{{ proposal.profileId?.email }}</p>
        </div>
        <div class="text-right">
          <p class="text-xs uppercase text-gray-500 font-bold tracking-wider">Data de Emissão</p>
          <p class="text-sm font-medium">{{ new Date(proposal.createdAt).toLocaleDateString('pt-BR') }}</p>
        </div>
      </div>

      <!-- Itens -->
      <div class="p-8 border-b border-gray-100">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Serviços Selecionados</h2>
        <div class="space-y-6">
          <div v-for="item in proposal.items" :key="item._id" class="flex justify-between items-start">
            <div class="max-w-md">
              <h3 class="font-bold text-gray-900">{{ item.name }}</h3>
              <p class="text-sm text-gray-500 mt-1">{{ item.description }}</p>
            </div>
            <div class="text-right">
              <p class="font-bold text-gray-900">R$ {{ item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
              <p v-if="item.quantity > 1" class="text-xs text-gray-500">Qtd: {{ item.quantity }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Contrato -->
      <div v-if="proposal.contractText" class="p-8 border-b border-gray-100 prose prose-blue max-w-none">
        <div v-html="proposal.contractText"></div>
      </div>

      <!-- Botões de Ação Secundários -->
      <div class="p-4 bg-gray-50 flex flex-wrap justify-center gap-4 border-b border-gray-100">
        <button 
          @click="showTerms = true"
          class="text-sm font-bold text-blue-600 hover:underline"
        >
          Visualizar Termos e Condições
        </button>
        <a 
          :href="pdfUrl"
          target="_blank"
          class="text-sm font-bold text-gray-600 hover:underline flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Baixar PDF
        </a>
      </div>

      <!-- Totais -->
      <div class="bg-gray-900 p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <p class="text-sm opacity-60 text-center md:text-left">Investimento Total</p>
          <p class="text-4xl font-bold">R$ {{ proposal.totals.final.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
        </div>
        <div v-if="proposal.status === 'pending'">
          <button 
            @click="acceptProposal"
            :disabled="isAccepting"
            class="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-xl font-bold transition transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50"
          >
            {{ isAccepting ? 'Processando...' : 'Aceitar Proposta' }}
          </button>
        </div>
        <div v-else class="flex items-center gap-2 text-green-400 font-bold">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          Proposta Aceita
        </div>
      </div>
    </div>

    <!-- Modal de Termos -->
    <div v-if="showTerms" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div class="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 class="text-xl font-bold text-gray-900">Termos e Condições</h3>
          <button @click="showTerms = false" class="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="p-8 overflow-y-auto prose prose-blue max-w-none">
          <div v-html="proposal.termsAndConditions"></div>
        </div>
        <div class="p-6 border-t border-gray-100 text-right">
          <button @click="showTerms = false" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-xl font-bold transition">
            Fechar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
