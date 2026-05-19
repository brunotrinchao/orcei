<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Search, Mail, Link as LinkIcon, Pencil, Share2, RefreshCcw, Loader2, FileText, ExternalLink, Eye, CheckCircle2, MessageCircle, CreditCard, Banknote } from 'lucide-vue-next'
import type { ProposalDTO } from '../../../../types'

const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

const { data: proposalsData, refresh, pending } = useFetch<any>('/api/proposals', {
  query: computed(() => ({
    page: currentPage.value,
    limit: itemsPerPage,
    search: searchQuery.value
  })),
  watch: [currentPage, searchQuery]
})

const proposals = computed<ProposalDTO[]>(() => proposalsData.value?.items || [])
const totalProposals = computed(() => proposalsData.value?.total || 0)

const { copy } = useClipboard()

const isModalOpen = ref(false)
const isAIWizardOpen = ref(false)
const isPreviewOpen = ref(false)
const isAcceptedModalOpen = ref(false)
const isSuccessModalOpen = ref(false)
const lastCreatedProposal = ref<ProposalDTO | null>(null)
const selectedProposal = ref<ProposalDTO | null>(null)
const prefilledItems = ref<any[] | null>(null)
const isSubmitting = ref(false)
const isResending = ref<string | null>(null)
const proposalFormRef = ref<any>(null)

const { notify } = useAlerts()
const siteOrigin = ref('')

onMounted(() => {
  siteOrigin.value = window.location.origin
})

function sendWhatsapp(proposal: ProposalDTO) {
  if (!proposal.client.phone) return
  
  const message = encodeURIComponent(
    `Olá ${proposal.client.name}! \u{1F44B}\n\n` +
    `Preparei o orçamento *${proposal.title}* para você.\n\n` +
    `Confira os detalhes e aprove através deste link:\n` +
    `${window.location.origin}/p/${proposal.slug}\n\n` +
    `Qualquer dúvida, estou à disposição!`
  )
  
  const phone = proposal.client.phone.replace(/\D/g, '')
  window.open(`https://wa.me/55${phone}?text=${message}`, '_blank')
  
  isSuccessModalOpen.value = false
}

async function resendEmail(proposalId: string) {
  isResending.value = proposalId
  try {
    await $fetch(`/api/proposals/${proposalId}/resend`, { method: 'POST' })
    notify('Sucesso', 'E-mail enviado com sucesso!')
  } catch (e: any) {
    notify('Erro', e.data?.statusMessage || 'Erro ao reenviar e-mail')
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
    notify('Sucesso', 'Link copiado! Seu navegador não suporta compartilhamento nativo.')
  }
}

function openModal(proposal: ProposalDTO | null = null, items: any[] | null = null) {
  selectedProposal.value = proposal
  prefilledItems.value = items
  isModalOpen.value = true
}

function onAIWizardSuccess(items: any[]) {
  const formattedItems = items.map(item => ({
    catalogItemId: item.id || item._id || undefined,
    name: item.name,
    description: item.description,
    price: item.price,
    quantity: 1
  }))
  openModal(null, formattedItems)
}

function openPreview(proposal: ProposalDTO) {
  selectedProposal.value = proposal
  if (proposal.status === 'accepted') {
    isAcceptedModalOpen.value = true
  } else {
    isPreviewOpen.value = true
  }
}

function whatsappLink(phone: string) {
  return `https://wa.me/55${phone.replace(/\D/g, '')}`
}

async function handleProposalSubmit(formData: Partial<ProposalDTO>) {
  isSubmitting.value = true
  try {
    const isNew = !selectedProposal.value
    const method = isNew ? 'POST' : 'PUT'
    const endpoint = isNew 
      ? '/api/proposals'
      : `/api/proposals/${selectedProposal.value?._id}`

    const res: any = await $fetch(endpoint, {
      method,
      body: formData
    })
    
    isModalOpen.value = false
    refresh()
    
    if (isNew && res.status === 'created' && res.client?.phone) {
      lastCreatedProposal.value = res
      isSuccessModalOpen.value = true
    } else {
      notify('Sucesso', 'Orçamento processado com sucesso!')
    }
  } catch (e: any) {
    const html = parseApiErrors(e)
    notify(html ? 'Dados inválidos' : 'Erro', html ?? (e.data?.statusMessage || 'Erro ao processar orçamento'))
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
    <PageHeader title="Seus Orçamentos" subtitle="Acompanhe e gerencie seus orçamentos comerciais.">
      <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <BaseButton variant="secondary" @click="isAIWizardOpen = true" class="shadow-xl shadow-blue-50">
          <Sparkles class="w-5 h-5 mr-2 text-blue-600" />
          Criar com IA
        </BaseButton>
        <BaseButton @click="openModal()" class="shadow-2xl shadow-gray-200">
          <Plus class="w-5 h-5 mr-2" />
          Novo Orçamento
        </BaseButton>
      </div>
    </PageHeader>

    <!-- Busca -->
    <div class="mb-10 relative max-w-xl">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar por título, cliente ou código..."
        class="w-full pl-14 pr-6 py-5 bg-white border-2 border-gray-100 rounded-[2rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-gray-900 placeholder:text-gray-300 shadow-sm"
      >
      <div class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300">
        <Search class="w-6 h-6" />
      </div>
    </div>

    <!-- Listagem -->
    <div class="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
      <!-- Mobile View (Cards) -->
      <div class="block sm:hidden divide-y divide-gray-100">
        <div v-for="proposal in proposals" :key="proposal._id" class="p-4 space-y-4">
          <!-- Top Row: Title & Status -->
          <div class="flex justify-between items-start gap-3">
            <div class="flex flex-col min-w-0">
              <span class="font-black text-gray-900 text-base leading-tight truncate">{{ proposal.title || 'Sem título' }}</span>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{{ proposal.client.name }}</span>
                <span class="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{{ formatDate(proposal.createdAt) }}</span>
              </div>
            </div>
            <BaseBadge :variant="proposal.status === 'accepted' ? 'success' : proposal.status === 'expired' ? 'error' : proposal.status === 'pending' ? 'warning' : proposal.status === 'created' ? 'info' : 'default'" class="shrink-0">
              {{ statusMap[proposal.status]?.label }}
            </BaseBadge>
          </div>

          <!-- Bottom Row: Price & Actions -->
          <div class="flex justify-between items-center pt-2 border-t border-gray-50">
            <span class="font-black text-gray-900 text-lg tracking-tight">R$ {{ proposal.totals.final.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
            <div class="flex items-center gap-1">
              <button 
                @click="openPreview(proposal)"
                class="p-2 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-lg transition-all"
                title="Visualizar"
                aria-label="Visualizar orçamento"
              >
                <Eye class="w-4 h-4" />
              </button>
              <button 
                v-if="proposal.client.phone"
                @click="sendWhatsapp(proposal)"
                class="p-2 text-green-500 hover:text-green-600 bg-green-50 rounded-lg transition-all"
                title="WhatsApp"
                aria-label="Enviar via WhatsApp"
              >
                <MessageCircle class="w-4 h-4" />
              </button>
              <button 
                v-if="proposal.status !== 'draft'"
                @click="shareProposal(proposal)"
                class="p-2 text-blue-500 hover:text-blue-600 bg-blue-50 rounded-lg transition-all"
                title="Compartilhar"
                aria-label="Compartilhar link"
              >
                <Share2 class="w-4 h-4" />
              </button>
              <button 
                v-if="proposal.status !== 'accepted'"
                @click="openModal(proposal)"
                class="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-lg transition-all"
                title="Editar"
                aria-label="Editar orçamento"
              >
                <Pencil class="w-4 h-4" />
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
                  v-if="proposal.client.phone"
                  @click="sendWhatsapp(proposal)"
                  class="p-2.5 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-2xl transition-all"
                  title="Enviar via WhatsApp"
                  aria-label="Enviar via WhatsApp"
                >
                  <MessageCircle class="w-5 h-5" />
                </button>
                <button 
                  @click="openPreview(proposal)"
                  class="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all"
                  title="Visualizar Orçamento"
                  aria-label="Visualizar orçamento"
                >
                  <Eye class="w-5 h-5" />
                </button>
                <button 
                  v-if="proposal.status === 'created' || proposal.status === 'pending'"
                  @click="resendEmail(proposal._id)"
                  :disabled="isResending === proposal._id"
                  class="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all disabled:opacity-50"
                  title="Reenviar E-mail"
                  aria-label="Reenviar e-mail de notificação"
                >
                  <RefreshCcw v-if="isResending === proposal._id" class="w-5 h-5 animate-spin" />
                  <Mail v-else class="w-5 h-5" />
                </button>
                <button 
                  v-if="proposal.status !== 'draft'"
                  @click="shareProposal(proposal)"
                  class="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                  title="Compartilhar"
                  aria-label="Compartilhar link do orçamento"
                >
                  <Share2 class="w-5 h-5" />
                </button>
                <button 
                  v-if="proposal.status !== 'accepted'"
                  @click="openModal(proposal)"
                  class="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                  title="Editar"
                  aria-label="Editar orçamento"
                >
                  <Pencil class="w-5 h-5" />
                </button>
                <NuxtLink 
                  v-if="proposal.status !== 'draft'"
                  :to="`/p/${proposal.slug}`" 
                  target="_blank" 
                  class="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                  title="Ver Link Público"
                  aria-label="Ver link público do orçamento"
                >
                  <ExternalLink class="w-5 h-5" />
                </NuxtLink>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Paginação -->
      <div v-if="totalProposals > itemsPerPage" class="px-8 py-6 border-t border-gray-100 bg-gray-50/20 flex justify-center">
        <BasePagination 
          :total="totalProposals" 
          :items-per-page="itemsPerPage" 
          v-model:page="currentPage" 
        />
      </div>

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
        ref="proposalFormRef"
        :initial-data="selectedProposal || undefined"
        :prefilled-items="prefilledItems || undefined"
        :is-editing="!!selectedProposal"
        :is-submitting="isSubmitting"
        @submit="handleProposalSubmit"
      />

      <template #footer>
        <template v-if="selectedProposal && selectedProposal.status !== 'draft'">
          <BaseButton type="button" :disabled="isSubmitting" :loading="isSubmitting" @click="proposalFormRef?.submit()">
            Salvar Alterações
          </BaseButton>
        </template>
        <template v-else>
          <BaseButton type="button" variant="outline" :disabled="isSubmitting" @click="proposalFormRef?.submit('draft')">
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin mr-2" />
            Rascunho
          </BaseButton>
          <BaseButton type="button" :disabled="isSubmitting" @click="proposalFormRef?.submit('created')">
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin mr-2" />
            Criar e Enviar
          </BaseButton>
        </template>
      </template>
    </BaseDialog>

    <!-- Modal Proposta Aceita -->
    <BaseDialog
      v-model:open="isAcceptedModalOpen"
      title="Proposta Aceita"
      size="xl"
      @close="selectedProposal = null"
    >
      <div v-if="selectedProposal" class="space-y-0">
        <div class="bg-green-500 rounded-2xl p-6 flex items-center gap-4 mb-6">
          <div class="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
            <CheckCircle2 class="w-8 h-8 text-white" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[10px] font-black text-green-100 uppercase tracking-widest mb-1">Orçamento Aceito</p>
            <h3 class="text-xl font-black text-white tracking-tight truncate">{{ selectedProposal.title || selectedProposal.code }}</h3>
            <p class="text-sm text-green-100 font-medium mt-0.5">{{ selectedProposal.code }}</p>
          </div>
          <div class="text-right shrink-0">
            <p class="text-[10px] font-black text-green-100 uppercase tracking-widest mb-1">Total</p>
            <p class="text-2xl font-black text-white">R$ {{ selectedProposal.totals.final.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
          </div>
        </div>

        <div class="bg-gray-50 rounded-2xl p-6 mb-4">
          <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Cliente</p>
          <div class="flex items-center justify-between gap-4 flex-wrap">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-black text-lg">
                {{ selectedProposal.client.name.charAt(0) }}
              </div>
              <div>
                <p class="font-black text-gray-900">{{ selectedProposal.client.name }}</p>
                <p class="text-xs text-gray-500 font-medium">{{ selectedProposal.client.email }}</p>
              </div>
            </div>
            <div class="flex gap-2">
              <a
                :href="`mailto:${selectedProposal.client.email}`"
                class="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-100 hover:border-blue-200 hover:text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-gray-600"
              >
                <Mail class="w-4 h-4" /> E-mail
              </a>
              <a
                v-if="selectedProposal.client.phone"
                :href="whatsappLink(selectedProposal.client.phone)"
                target="_blank"
                class="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-green-100"
              >
                <MessageCircle class="w-4 h-4" /> WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-2xl mb-4">
          <CreditCard v-if="selectedProposal.paymentConfig?.method === 'credit_card'" class="w-5 h-5 text-blue-600 shrink-0" />
          <Banknote v-else class="w-5 h-5 text-blue-600 shrink-0" />
          <p class="text-sm font-black text-blue-900">
            {{ selectedProposal.paymentConfig?.method === 'credit_card'
              ? `Cartão de Crédito — ${selectedProposal.paymentConfig.installments}x`
              : `À Vista (${selectedProposal.paymentConfig?.cashDiscount}% desconto)` }}
          </p>
        </div>

        <div class="border border-gray-100 rounded-2xl overflow-hidden mb-4">
          <div class="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Itens do Orçamento</p>
          </div>
          <div class="divide-y divide-gray-50">
            <div v-for="item in selectedProposal.items" :key="item._id" class="flex justify-between items-start px-5 py-4 gap-4">
              <div class="flex-1 min-w-0">
                <p class="font-black text-gray-900 text-sm">{{ item.name }}</p>
                <p class="text-xs text-gray-400 font-medium mt-0.5 truncate">{{ item.description }}</p>
              </div>
              <div class="text-right shrink-0">
                <p class="font-black text-gray-900 text-sm">R$ {{ (item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
                <p class="text-[10px] text-gray-400 font-bold">{{ item.quantity }}x R$ {{ item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
              </div>
            </div>
          </div>
          <div class="flex justify-between items-center px-5 py-4 border-t border-gray-100 bg-gray-50/50">
            <span class="text-xs font-black text-gray-500 uppercase tracking-widest">Total Final</span>
            <span class="font-black text-green-600 text-lg">R$ {{ selectedProposal.totals.final.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <NuxtLink
          :to="selectedProposal ? `/p/${selectedProposal.slug}` : '#'"
          target="_blank"
          class="mr-auto flex items-center gap-2 text-xs font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-colors"
        >
          <ExternalLink class="w-4 h-4" /> Ver link público
        </NuxtLink>
        <BaseButton variant="secondary" size="sm" @click="isAcceptedModalOpen = false">Fechar</BaseButton>
      </template>
    </BaseDialog>

    <AIProposalWizard
      :open="isAIWizardOpen"
      @close="isAIWizardOpen = false"
      @success="onAIWizardSuccess"
    />

    <!-- Modal de Sucesso (WhatsApp) -->
    <BaseDialog
      v-model:open="isSuccessModalOpen"
      title="Orçamento Criado!"
      size="md"
    >
      <div v-if="lastCreatedProposal" class="p-6 text-center space-y-6">
        <div class="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 class="w-10 h-10 text-green-600" />
        </div>
        
        <div class="space-y-2">
          <h3 class="text-xl font-black text-gray-900 tracking-tight uppercase">Tudo Pronto!</h3>
          <p class="text-sm text-gray-500 font-medium">O orçamento foi criado e o e-mail de notificação já foi enviado para o cliente.</p>
        </div>

        <div class="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4 text-left">
          <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <MessageCircle class="w-6 h-6 text-white" />
          </div>
          <div>
            <p class="text-[10px] font-black text-blue-600 uppercase tracking-widest">Dica Pro</p>
            <p class="text-xs text-blue-800 font-bold">Enviar também pelo WhatsApp aumenta em 3x a velocidade de aprovação.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3">
          <BaseButton 
            class="w-full bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-100"
            @click="sendWhatsapp(lastCreatedProposal)"
          >
            <MessageCircle class="w-5 h-5 mr-2" />
            Enviar via WhatsApp
          </BaseButton>
          <BaseButton 
            variant="secondary"
            class="w-full"
            @click="isSuccessModalOpen = false"
          >
            Agora Não
          </BaseButton>
        </div>
      </div>
    </BaseDialog>

    <!-- Modal de Preview -->
    <BaseDialog
      v-model:open="isPreviewOpen" 
      title="Preview do Orçamento" 
      size="xl"
      @close="selectedProposal = null"
    >
      <div v-if="selectedProposal" class="flex flex-col h-[75vh]">
        <div class="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0 rounded-t-3xl">
          <div class="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <LinkIcon class="w-3 h-3" /> Link do Cliente:
            <span class="text-blue-600 lowercase font-bold select-all">{{ siteOrigin }}/p/{{ selectedProposal.slug }}</span>
          </div>
          <BaseButton size="sm" variant="outline" @click="shareProposal(selectedProposal)">Copiar Link</BaseButton>
        </div>
        <div class="flex-1 bg-white overflow-hidden rounded-b-3xl">
          <iframe
            :src="`/p/${selectedProposal.slug}?preview=true`"
            class="w-full h-full border-none"
          ></iframe>
        </div>
      </div>
    </BaseDialog>
  </div>
</template>
