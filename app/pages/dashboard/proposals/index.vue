<script setup lang="ts">
import type { ProposalDTO } from '~/types'

const { data: proposals, refresh } = useFetch<ProposalDTO[]>('/api/proposals')
const { copy, copied } = useClipboard()

const isModalOpen = ref(false)
const selectedProposal = ref<ProposalDTO | null>(null)
const isSubmitting = ref(false)

function openModal(proposal: ProposalDTO | null = null) {
  selectedProposal.value = proposal
  isModalOpen.value = true
}

async function handleProposalSubmit(formData: any) {
  isSubmitting.value = true
  try {
    const method = selectedProposal.value ? 'PUT' : 'POST'
    const endpoint = selectedProposal.value 
      ? `/api/proposals/${selectedProposal.value._id}` 
      : '/api/proposals'

    await $fetch(endpoint, {
      method,
      body: formData
    })
    
    isModalOpen.value = false
    refresh()
  } catch (e: any) {
    alert(e.data?.statusMessage || 'Erro ao processar proposta')
  } finally {
    isSubmitting.value = false
  }
}

const statusMap: any = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
  created: { label: 'Criada', color: 'bg-blue-100 text-blue-800' },
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  accepted: { label: 'Aceita', color: 'bg-green-100 text-green-800' },
  expired: { label: 'Expirada', color: 'bg-red-100 text-red-800' }
}

function copyProposalLink(slug: string) {
  const url = `${window.location.origin}/p/${slug}`
  copy(url)
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6">
    <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Suas Propostas</h1>
        <p class="text-gray-600 text-sm sm:text-base">Acompanhe o status dos seus orçamentos.</p>
      </div>
      <button 
        @click="openModal()"
        class="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100"
      >
        Nova Proposta
      </button>
    </header>

    <!-- Listagem -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <!-- Mobile View (Cards) -->
      <div class="block sm:hidden divide-y divide-gray-50">
        <div v-for="proposal in proposals" :key="proposal._id" class="p-4 space-y-3">
          <div class="flex justify-between items-start">
            <div class="flex flex-col">
              <span class="font-bold text-gray-900 leading-tight">{{ proposal.title || 'Sem título' }}</span>
              <span class="text-xs text-gray-500">{{ proposal.client.name }}</span>
            </div>
            <span :class="statusMap[proposal.status]?.color" class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0">
              {{ statusMap[proposal.status]?.label }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-black text-gray-900">R$ {{ proposal.totals.final.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
            <div class="flex gap-1">
              <button 
                v-if="proposal.status !== 'accepted'"
                @click="openModal(proposal)"
                class="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <NuxtLink 
                v-if="proposal.status !== 'draft'"
                :to="`/p/${proposal.slug}`" 
                target="_blank" 
                class="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop View (Table) -->
      <table class="hidden sm:table w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50/50 border-b border-gray-100">
            <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Proposta / Cliente</th>
            <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
            <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Total</th>
            <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="proposal in proposals" :key="proposal._id" class="hover:bg-gray-50/50 transition-colors group">
            <td class="px-6 py-4">
              <div class="flex flex-col">
                <span class="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{{ proposal.title || 'Sem título' }}</span>
                <span class="text-xs text-gray-500">{{ proposal.client.name }}</span>
              </div>
            </td>
            <td class="px-6 py-4">
              <span :class="statusMap[proposal.status]?.color" class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                {{ statusMap[proposal.status]?.label }}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <span class="font-black text-gray-900">R$ {{ proposal.totals.final.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex justify-end gap-1">
                <button 
                  v-if="proposal.status !== 'accepted'"
                  @click="openModal(proposal)"
                  class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                  title="Editar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button 
                  v-if="proposal.status !== 'draft'"
                  @click="copyProposalLink(proposal.slug)"
                  class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors relative"
                  title="Copiar Link"
                >
                  <svg v-if="!copied || selectedProposal?.slug !== proposal.slug" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-1 4h.01M9 16h5m0 0l-1-1m1 1l-1 1" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <NuxtLink 
                  v-if="proposal.status !== 'draft'"
                  :to="`/p/${proposal.slug}`" 
                  target="_blank" 
                  class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                  title="Ver Link Público"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </NuxtLink>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="proposals?.length === 0" class="text-center py-20">
        <div class="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 class="font-bold text-gray-900">Sem Propostas</h3>
        <p class="text-gray-500 text-sm mt-1">Clique no botão acima para criar seu primeiro orçamento.</p>
      </div>
    </div>

    <!-- Modal de Proposta -->
    <AppModal 
      :show="isModalOpen" 
      :title="selectedProposal ? 'Editar Proposta' : 'Nova Proposta'" 
      @close="isModalOpen = false"
    >
      <ProposalForm 
        :initial-data="selectedProposal || undefined" 
        :is-editing="!!selectedProposal" 
        :is-submitting="isSubmitting"
        @submit="handleProposalSubmit" 
      />
    </AppModal>
  </div>
</template>
