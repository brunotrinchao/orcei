<script setup lang="ts">
import type { ProposalDTO } from '~/types'

const { data: proposals, refresh } = useFetch<ProposalDTO[]>('/api/proposals')
const { copy, copied } = useClipboard()

const isModalOpen = ref(false)
const selectedProposal = ref<ProposalDTO | null>(null)
const isSubmitting = ref(false)
const isResending = ref<string | null>(null)

async function resendEmail(proposalId: string) {
  isResending.value = proposalId
  try {
    await $fetch(`/api/proposals/${proposalId}/resend`, { method: 'POST' })
    alert('E-mail enviado com sucesso!')
  } catch (e: any) {
    alert(e.data?.statusMessage || 'Erro ao reenviar e-mail')
  } finally {
    isResending.value = null
  }
}

async function shareProposal(proposal: ProposalDTO) {
  const url = `${window.location.origin}/p/${proposal.slug}`
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Proposta: ${proposal.title}`,
        text: `Confira a proposta que preparei para você: ${proposal.title}`,
        url: url
      })
    } catch (err) {
      console.log('Share cancelled or failed', err)
    }
  } else {
    copyProposalLink(proposal.slug)
    alert('Link copiado! Seu navegador não suporta compartilhamento nativo.')
  }
}

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
    <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
      <div>
        <h1 class="text-4xl font-black text-gray-900 tracking-tight uppercase">Suas Propostas</h1>
        <p class="text-gray-600 mt-2 text-lg font-medium">Acompanhe e gerencie seus orçamentos.</p>
      </div>
      <button 
        @click="openModal()"
        class="w-full sm:w-auto bg-gray-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-2xl shadow-gray-200 text-xs"
      >
        Nova Proposta
      </button>
    </header>

    <!-- Listagem -->
    <div class="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
      <!-- Mobile View (Cards) -->
      <div class="block sm:hidden divide-y divide-gray-100">
        <div v-for="proposal in proposals" :key="proposal._id" class="p-6 space-y-4">
          <div class="flex justify-between items-start">
            <div class="flex flex-col">
              <span class="font-black text-gray-900 text-lg leading-tight">{{ proposal.title || 'Sem título' }}</span>
              <span class="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{{ proposal.client.name }}</span>
            </div>
            <span :class="statusMap[proposal.status]?.color" class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 border border-current opacity-80">
              {{ statusMap[proposal.status]?.label }}
            </span>
          </div>
          <div class="flex justify-between items-center pt-2">
            <span class="font-black text-gray-900 text-xl tracking-tight">R$ {{ proposal.totals.final.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
            <div class="flex gap-2">
              <button 
                v-if="proposal.status === 'created' || proposal.status === 'pending'"
                @click="resendEmail(proposal._id)"
                :disabled="isResending === proposal._id"
                class="p-3 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-xl transition-all disabled:opacity-50"
                title="Reenviar E-mail"
              >
                <div :class="isResending === proposal._id ? 'i-heroicons-arrow-path animate-spin' : 'i-heroicons-envelope'" class="w-5 h-5"></div>
              </button>
              <button 
                v-if="proposal.status !== 'draft'"
                @click="shareProposal(proposal)"
                class="p-3 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-xl transition-all"
                title="Compartilhar"
              >
                <div class="i-heroicons-share w-5 h-5"></div>
              </button>
              <button 
                v-if="proposal.status !== 'accepted'"
                @click="openModal(proposal)"
                class="p-3 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-xl transition-all"
              >
                <div class="i-heroicons-pencil-square w-5 h-5"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop View (Table) -->
      <table class="hidden sm:table w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50/50 border-b border-gray-200">
            <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Proposta / Cliente</th>
            <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
            <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Total</th>
            <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="proposal in proposals" :key="proposal._id" class="hover:bg-gray-50/30 transition-all group">
            <td class="px-8 py-6">
              <div class="flex flex-col">
                <span class="font-black text-gray-900 group-hover:text-blue-600 transition-colors text-lg tracking-tight">{{ proposal.title || 'Sem título' }}</span>
                <span class="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{{ proposal.client.name }}</span>
              </div>
            </td>
            <td class="px-8 py-6">
              <span :class="statusMap[proposal.status]?.color" class="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-current opacity-90">
                {{ statusMap[proposal.status]?.label }}
              </span>
            </td>
            <td class="px-8 py-6 text-right">
              <span class="font-black text-gray-900 text-xl tracking-tight">R$ {{ proposal.totals.final.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
            </td>
            <td class="px-8 py-6 text-right">
              <div class="flex justify-end gap-2">
                <button 
                  v-if="proposal.status === 'created' || proposal.status === 'pending'"
                  @click="resendEmail(proposal._id)"
                  :disabled="isResending === proposal._id"
                  class="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all disabled:opacity-50"
                  title="Reenviar E-mail"
                >
                  <div :class="isResending === proposal._id ? 'i-heroicons-arrow-path animate-spin' : 'i-heroicons-envelope'" class="w-6 h-6"></div>
                </button>
                <button 
                  v-if="proposal.status !== 'draft'"
                  @click="shareProposal(proposal)"
                  class="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                  title="Compartilhar"
                >
                  <div class="i-heroicons-share w-6 h-6"></div>
                </button>
                <button 
                  v-if="proposal.status !== 'accepted'"
                  @click="openModal(proposal)"
                  class="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                  title="Editar"
                >
                  <div class="i-heroicons-pencil-square w-6 h-6"></div>
                </button>
                <NuxtLink 
                  v-if="proposal.status !== 'draft'"
                  :to="`/p/${proposal.slug}`" 
                  target="_blank" 
                  class="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                  title="Ver Link Público"
                >
                  <div class="i-heroicons-arrow-top-right-on-square w-6 h-6"></div>
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
