<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Search, Mail, Link as LinkIcon, Pencil, Share2, Printer, MoreVertical, RefreshCcw, Loader2, FileText, ExternalLink } from 'lucide-vue-next'
import type { ProposalDTO } from '../../../../types'

const { data: proposals, refresh, pending } = useFetch<ProposalDTO[]>('/api/proposals')
const { copy } = useClipboard()

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
        title: `Orçamento: ${proposal.title}`,
        text: `Confira o orçamento que preparei para você: ${proposal.title}`,
        url: url
      })
    } catch (err) {
      console.log('Share cancelled or failed', err)
    }
  } else {
    copy(url)
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
    alert(e.data?.statusMessage || 'Erro ao processar orçamento')
  } finally {
    isSubmitting.value = false
  }
}

const statusMap: any = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
  created: { label: 'Criado', color: 'bg-blue-100 text-blue-800' },
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  accepted: { label: 'Aceito', color: 'bg-green-100 text-green-800' },
  expired: { label: 'Expirado', color: 'bg-red-100 text-red-800' }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR')
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6">
    <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
      <div>
        <h1 class="text-4xl font-black text-gray-900 tracking-tight uppercase">Seus Orçamentos</h1>
        <p class="text-gray-600 mt-2 text-lg font-medium">Acompanhe e gerencie seus orçamentos comerciais.</p>
      </div>
      <BaseButton 
        @click="openModal()"
        class="w-full sm:w-auto px-10 py-4 shadow-2xl shadow-gray-200"
      >
        <Plus class="w-5 h-5 mr-2" />
        Novo Orçamento
      </BaseButton>
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
            <BaseBadge :variant="proposal.status === 'accepted' ? 'success' : proposal.status === 'expired' ? 'error' : proposal.status === 'pending' ? 'warning' : proposal.status === 'created' ? 'info' : 'default'">
              {{ statusMap[proposal.status]?.label }}
            </BaseBadge>
          </div>
          <div class="flex justify-between items-center pt-2">
            <span class="font-black text-gray-900 text-xl tracking-tight">R$ {{ proposal.totals.final.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
            <div class="flex gap-2">
              <button 
                v-if="proposal.status === 'created' || proposal.status === 'pending'"
                @click="resendEmail(proposal._id)"
                :disabled="isResending === proposal._id"
                class="p-2.5 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-xl transition-all disabled:opacity-50"
                title="Reenviar E-mail"
              >
                <RefreshCcw v-if="isResending === proposal._id" class="w-5 h-5 animate-spin" />
                <Mail v-else class="w-5 h-5" />
              </button>
              <button 
                v-if="proposal.status !== 'draft'"
                @click="shareProposal(proposal)"
                class="p-2.5 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-xl transition-all"
                title="Compartilhar"
              >
                <Share2 class="w-5 h-5" />
              </button>
              <button 
                v-if="proposal.status !== 'accepted'"
                @click="openModal(proposal)"
                class="p-2.5 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-xl transition-all"
              >
                <Pencil class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop View (Table) -->
      <table class="hidden sm:table w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50/50 border-b border-gray-200">
            <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Orçamento / Cliente</th>
            <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Data</th>
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
            <td class="px-8 py-6 text-sm text-gray-500 font-medium">
              {{ formatDate(proposal.createdAt) }}
            </td>
            <td class="px-8 py-6">
              <BaseBadge :variant="proposal.status === 'accepted' ? 'success' : proposal.status === 'expired' ? 'error' : proposal.status === 'pending' ? 'warning' : proposal.status === 'created' ? 'info' : 'default'">
                {{ statusMap[proposal.status]?.label }}
              </BaseBadge>
            </td>
            <td class="px-8 py-6 text-right">
              <span class="font-black text-gray-900 text-xl tracking-tight">R$ {{ proposal.totals.final.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
            </td>
            <td class="px-8 py-6 text-right">
              <div class="flex justify-end items-center gap-1">
                <button 
                  v-if="proposal.status === 'created' || proposal.status === 'pending'"
                  @click="resendEmail(proposal._id)"
                  :disabled="isResending === proposal._id"
                  class="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all disabled:opacity-50"
                  title="Reenviar E-mail"
                >
                  <RefreshCcw v-if="isResending === proposal._id" class="w-5 h-5 animate-spin" />
                  <Mail v-else class="w-5 h-5" />
                </button>
                <button 
                  v-if="proposal.status !== 'draft'"
                  @click="shareProposal(proposal)"
                  class="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                  title="Compartilhar"
                >
                  <Share2 class="w-5 h-5" />
                </button>
                <button 
                  v-if="proposal.status !== 'accepted'"
                  @click="openModal(proposal)"
                  class="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                  title="Editar"
                >
                  <Pencil class="w-5 h-5" />
                </button>
                <NuxtLink 
                  v-if="proposal.status !== 'draft'"
                  :to="`/p/${proposal.slug}`" 
                  target="_blank" 
                  class="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                  title="Ver Link Público"
                >
                  <ExternalLink class="w-5 h-5" />
                </NuxtLink>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!pending && proposals?.length === 0" class="text-center py-20">
        <div class="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText class="w-8 h-8" />
        </div>
        <h3 class="font-bold text-gray-900">Sem Orçamentos</h3>
        <p class="text-gray-500 text-sm mt-1">Clique no botão acima para criar seu primeiro orçamento.</p>
      </div>
    </div>

    <!-- Modal de Orçamento -->
    <BaseDialog 
      v-model:open="isModalOpen" 
      :title="selectedProposal ? 'Editar Orçamento' : 'Novo Orçamento'" 
      size="xl"
    >
      <ProposalForm
        :initial-data="selectedProposal || undefined"
        :is-editing="!!selectedProposal"
        :is-submitting="isSubmitting"
        @submit="handleProposalSubmit"
      />
    </BaseDialog>

  </div>
</template>
