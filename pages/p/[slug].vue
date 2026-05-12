<script setup lang="ts">
const route = useRoute()
const { data: proposal, error } = await useFetch(`/api/proposals/public/${route.params.slug}`)

// Layout desabilitado para exibição limpa ao cliente
definePageMeta({
  layout: false
})
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
      <div class="bg-blue-600 p-8 text-white">
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
      <div class="p-8">
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

      <!-- Totais -->
      <div class="bg-gray-900 p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <p class="text-sm opacity-60 text-center md:text-left">Investimento Total</p>
          <p class="text-4xl font-bold">R$ {{ proposal.totals.final.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
        </div>
        <button 
          v-if="proposal.status === 'pending'"
          class="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-xl font-bold transition transform hover:scale-105 active:scale-95 shadow-lg"
        >
          Aceitar Proposta
        </button>
      </div>
    </div>
  </div>
</template>
