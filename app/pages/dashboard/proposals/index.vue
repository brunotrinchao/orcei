<script setup lang="ts">
definePageMeta({
  
})

const { data: proposals } = useFetch('/api/proposals')
</script>

<template>
  <div>
    <header class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Suas Propostas</h1>
        <p class="text-gray-600">Acompanhe o status dos seus orçamentos.</p>
      </div>
      <NuxtLink 
        to="/dashboard/proposals/new"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
      >
        Nova Proposta
      </NuxtLink>
    </header>

    <div class="grid grid-cols-1 gap-4">
      <div v-for="proposal in proposals" :key="proposal._id" class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h3 class="font-semibold text-gray-900">{{ proposal.title || 'Sem título' }}</h3>
          <p class="text-sm text-gray-500">{{ proposal.client.name }} ({{ proposal.client.email }})</p>
        </div>
        <div class="flex items-center gap-6">
          <div class="text-right">
            <p class="font-bold text-gray-900">R$ {{ proposal.totals.final.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
            <span :class="{
              'px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider': true,
              'bg-yellow-100 text-yellow-800': proposal.status === 'pending' || proposal.status === 'draft',
              'bg-green-100 text-green-800': proposal.status === 'accepted',
              'bg-red-100 text-red-800': proposal.status === 'expired',
            }">
              {{ proposal.status === 'draft' ? 'Rascunho' : proposal.status === 'pending' ? 'Pendente' : proposal.status === 'accepted' ? 'Aceito' : 'Expirado' }}
            </span>
          </div>
          <NuxtLink :to="`/p/${proposal.slug}`" target="_blank" class="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </NuxtLink>
        </div>
      </div>
      <div v-if="proposals?.length === 0" class="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
        <p class="text-gray-500">Você ainda não criou nenhuma proposta.</p>
      </div>
    </div>
  </div>
</template>
