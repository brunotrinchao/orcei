<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Plus, Search, Mail, Link as LinkIcon, Pencil, Share2, RefreshCcw, Loader2, FileText, ExternalLink, Eye, CheckCircle2, MessageCircle, CreditCard, Banknote, History, Sparkles, Send, CheckCheck, X, ArrowLeft, ArrowRight, Trash2, MoreVertical } from 'lucide-vue-next'
import { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuContent, DropdownMenuItem } from 'radix-vue'
import { isToday, isYesterday, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { ProposalDTO } from '../../../../types'

const { creditLabel } = useCreditCosts()

const searchQuery = ref('')
const filterStatus = ref('')
const filterStartDate = ref('')
const filterEndDate = ref('')
const filterPendingChat = ref(false)
const currentPage = ref(1)
const itemsPerPage = 10

const hasFilters = computed(() => {
  return !!(searchQuery.value || filterStatus.value || filterStartDate.value || filterEndDate.value || filterPendingChat.value)
})

function clearFilters() {
  searchQuery.value = ''
  filterStatus.value = ''
  filterStartDate.value = ''
  filterEndDate.value = ''
  filterPendingChat.value = false
  currentPage.value = 1
}

const { data: proposalsData, refresh, pending } = useLazyFetch<any>('/api/proposals', {
  query: computed(() => ({
    page: currentPage.value,
    limit: itemsPerPage,
    search: searchQuery.value,
    status: filterStatus.value,
    startDate: filterStartDate.value,
    endDate: filterEndDate.value,
    pendingChat: filterPendingChat.value
  })),
  watch: [currentPage, searchQuery, filterStatus, filterStartDate, filterEndDate, filterPendingChat]
})

const proposals = computed<any[]>(() => proposalsData.value?.items || [])
const totalProposals = computed(() => proposalsData.value?.total || 0)

const { copy } = useClipboard()

const isModalOpen = ref(false)
const isAIWizardOpen = ref(false)
const isPreviewOpen = ref(false)
const isHistoryOpen = ref(false)
const isChatOpen = ref(false)
const isPaywallOpen = ref(false)
const paywallReason = ref('')


// Pusher Integration
let notificationChannel: any = null

async function setupGlobalNotifications() {
  try {
    const profile = await $fetch<any>('/api/profile')
    const { pusher } = usePusher()
    if (pusher && profile) {
      notificationChannel = pusher.subscribe(`private-profile-${profile._id}`)
      notificationChannel.bind('proposal-notification', (data: any) => {
        // Se receber uma notificação de nova mensagem, atualiza a lista para refletir no badge
        refresh()
      })
    }
  } catch (e) {
    console.error('Failed to setup global notifications', e)
  }
}

onMounted(() => {
  siteOrigin.value = window.location.origin
  setupGlobalNotifications()
})

// Observa mudanças na query para abrir o modal de nova proposta, mesmo que o usuário já esteja na página
const route = useRoute()
const router = useRouter()
watch(() => route.query.new, (isNew) => {
  if (isNew === 'true') {
    isAIWizardOpen.value = true
    // Remove o query parameter 'new' da URL sem recarregar a página
    router.replace({ query: { ...route.query, new: undefined } })
  }
}, { immediate: true })

onUnmounted(() => {
  if (notificationChannel) notificationChannel.unbind_all()
})

function openChat(proposal: ProposalDTO) {
  selectedProposal.value = proposal
  isChatOpen.value = true
}
const isAcceptedModalOpen = ref(false)
const isSuccessModalOpen = ref(false)
const lastCreatedProposal = ref<ProposalDTO | null>(null)
const selectedProposal = ref<ProposalDTO | null>(null)
const selectedProposalHistory = ref<any[]>([])
const isLoadingHistory = ref(false)
const prefilledItems = ref<any[] | null>(null)
const isAiAssistedProposal = ref(false)
const isSubmitting = ref(false)
const isResending = ref<string | null>(null)
const proposalFormRef = ref<any>(null)

const { notify, confirm } = useAlerts()
const siteOrigin = ref('')

onMounted(() => {
  siteOrigin.value = window.location.origin
})

async function openHistory(proposal: ProposalDTO) {
  selectedProposal.value = proposal
  isHistoryOpen.value = true
  isLoadingHistory.value = true
  try {
    const data: any = await $fetch(`/api/proposals/${proposal._id}`)
    selectedProposalHistory.value = data.history || []
  } catch (e) {
    notify('Erro', 'Não foi possível carregar o histórico')
  } finally {
    isLoadingHistory.value = false
  }
}

function sendWhatsapp(proposal: ProposalDTO) {
  if (!proposal.client.phone) return
  
  const tokenPart = proposal.token ? `?t=${proposal.token}` : ''
  const message = encodeURIComponent(
    `Olá ${proposal.client.name}! \u{1F44B}\n\n` +
    `Preparei o orçamento *${proposal.title}* para você.\n\n` +
    `Confira os detalhes e aprove através deste link:\n` +
    `${window.location.origin}/p/${proposal.slug}${tokenPart}\n\n` +
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
  const tokenPart = proposal.token ? `?t=${proposal.token}` : ''
  const url = `${window.location.origin}/p/${proposal.slug}${tokenPart}`
  
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

function openModal(proposal: ProposalDTO | null = null, items: any[] | null = null, aiAssisted: boolean = false) {
  selectedProposal.value = proposal
  prefilledItems.value = items
  isAiAssistedProposal.value = aiAssisted
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
  openModal(null, formattedItems, true)
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

    if (isNew && isAiAssistedProposal.value) {
      formData.aiAssisted = true
    }

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
    if (e.statusCode === 402) {
      paywallReason.value = 'criar e enviar orçamentos'
      isPaywallOpen.value = true
    } else {
      const html = parseApiErrors(e)
      notify(html ? 'Dados inválidos' : 'Erro', html ?? (e.data?.statusMessage || 'Erro ao processar orçamento'))
    }
  } finally {
    isSubmitting.value = false
  }

}

const statusMap: any = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
  created: { label: 'Criado', color: 'bg-blue-50 text-blue-700' },
  sent: { label: 'Enviado', color: 'bg-blue-100 text-blue-800' },
  delivered: { label: 'Entregue', color: 'bg-green-100 text-green-800' },
  opened: { label: 'Aberto', color: 'bg-purple-100 text-purple-800' },
  clicked: { label: 'Clicado', color: 'bg-orange-100 text-orange-800' },
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  accepted: { label: 'Aceito', color: 'bg-green-600 text-white' },
  expired: { label: 'Expirado', color: 'bg-red-100 text-red-800' },
  bounced: { label: 'Erro Envio', color: 'bg-red-600 text-white' },
  viewed: { label: 'Visualizado', color: 'bg-indigo-100 text-indigo-800' }
}

const getStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
  const map: Record<string, any> = {
    draft: 'default',
    created: 'info',
    sent: 'info',
    delivered: 'success',
    viewed: 'info',
    opened: 'info',
    clicked: 'warning',
    pending: 'warning',
    accepted: 'success',
    expired: 'error',
    bounced: 'error'
  }
  return map[status] || 'default'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR')
}

const formatTime = (date: any) => {
  return new Date(date).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function confirmDeleteProposal(proposal: ProposalDTO) {
  confirm({
    title: 'Excluir Orçamento',
    description: `Tem certeza que deseja excluir "${proposal.title || proposal.code}"? Essa ação não pode ser desfeita.`,
    variant: 'destructive',
    actionText: 'Excluir',
    onConfirm: async () => {
      try {
        await $fetch(`/api/proposals/${proposal._id}`, { method: 'DELETE' })
        notify('Sucesso', 'Orçamento excluído com sucesso.')
        refresh()
      } catch (e: any) {
        notify('Erro', e.data?.statusMessage || 'Erro ao excluir orçamento')
      }
    }
  })
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6">
    <PageHeader title="Seus Orçamentos" subtitle="Acompanhe e gerencie seus orçamentos comerciais.">
      <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <button 
          @click="isAIWizardOpen = true" 
          class="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-violet-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 self-stretch sm:self-auto"
        >
          <Sparkles class="w-4 h-4 text-white animate-pulse" />
          Criar com IA
        </button>
        <BaseButton data-tour="orcamentos-novo-btn" @click="openModal()" class="shadow-2xl shadow-gray-200">
          <Plus class="w-5 h-5 mr-2" />
          Novo Orçamento
        </BaseButton>
      </div>
    </PageHeader>

    <!-- Busca e Filtros -->
    <div data-tour="orcamentos-filtros" class="mb-10 space-y-6">
      <div class="relative max-w-xl">
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

      <div class="flex flex-wrap items-end gap-4">
        <div class="w-full sm:w-64">
          <BaseDateRangePicker
            label="Data de Criação"
            v-model:start="filterStartDate"
            v-model:end="filterEndDate"
          />
        </div>

        <div class="w-full sm:w-48">
          <BaseSelect
            label="Status"
            v-model="filterStatus"
            :options="[
              { label: 'Todos', value: '__EMPTY__' },
              ...Object.entries(statusMap).map(([value, info]: any) => ({
                label: info.label,
                value
              }))
            ]"
            placeholder="Todos os Status"
          />
        </div>

        <div class="flex items-center gap-3 px-6 py-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-blue-200 transition-all group h-[58px]">
          <BaseCheckbox v-model="filterPendingChat" id="pending-chat" />
          <label for="pending-chat" class="text-xs font-black text-gray-500 uppercase tracking-widest cursor-pointer group-hover:text-gray-900 transition-colors">
            Chat Pendente
          </label>
        </div>

        <button 
          v-if="hasFilters" 
          @click="clearFilters" 
          class="flex items-center gap-2 px-4 py-2 text-xs font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-all mb-4"
        >
          <X class="w-4 h-4" /> Limpar Filtros
        </button>
      </div>
    </div>

    <!-- Listagem Unificada -->
    <BaseDataList
      :items="proposals"
      :pending="pending"
      :total="totalProposals"
      :items-per-page="itemsPerPage"
      v-model:current-page="currentPage"
      empty-title="Sem Orçamentos"
      empty-subtitle="Clique no botão acima para criar seu primeiro orçamento."
    >
      <template #header>
        <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Orçamento / Cliente</th>
        <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Data</th>
        <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
        <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Total</th>
        <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Ações</th>
      </template>

      <template #item="{ item: proposal }">
        <tr class="hover:bg-gray-50/30 transition-all group">
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
            <BaseBadge :variant="getStatusVariant(proposal.status)">
              {{ statusMap[proposal.status]?.label }}
            </BaseBadge>
          </td>
          <td class="px-8 py-6 text-right">
            <span class="font-black text-gray-900 text-xl tracking-tight">R$ {{ proposal.totals.final.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
          </td>
          <td class="px-8 py-6 text-right">
            <div class="flex justify-end items-center gap-1">
              <button 
                @click="openChat(proposal)"
                class="p-2.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-2xl transition-all relative"
                title="Chat e Interações"
                aria-label="Abrir chat do orçamento"
              >
                <MessageCircle class="w-5 h-5" />
                <span 
                  v-if="proposal.unreadMessages > 0"
                  class="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white ring-2 ring-white"
                >
                  {{ proposal.unreadMessages }}
                </span>
              </button>
              <button 
                v-if="proposal.client.phone"
                @click="sendWhatsapp(proposal)"
                class="p-2.5 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-2xl transition-all"
                title="Enviar via WhatsApp"
                aria-label="Enviar via WhatsApp"
              >
                <img :src="'/images/icons/whatsapp-svg.svg'" class="w-5 h-5" alt="WhatsApp" loading="lazy"/>
              </button>
              <DropdownMenuRoot>
                <DropdownMenuTrigger as-child>
                  <button
                    class="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all"
                    title="Mais ações"
                    aria-label="Mais ações do orçamento"
                  >
                    <MoreVertical class="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuContent
                    align="end"
                    :side-offset="6"
                    class="min-w-[220px] bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50"
                  >
                    <DropdownMenuItem
                      @click="openHistory(proposal)"
                      class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-600 cursor-pointer outline-none transition-all"
                    >
                      <History class="w-4 h-4" />
                      Ver Histórico
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      @click="openPreview(proposal)"
                      class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-600 cursor-pointer outline-none transition-all"
                    >
                      <Eye class="w-4 h-4" />
                      Visualizar Orçamento
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      v-if="proposal.status !== 'draft' && proposal.status !== 'accepted'"
                      :disabled="isResending === proposal._id"
                      @click="resendEmail(proposal._id)"
                      class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-600 cursor-pointer outline-none transition-all disabled:opacity-50"
                    >
                      <RefreshCcw v-if="isResending === proposal._id" class="w-4 h-4 animate-spin" />
                      <Mail v-else class="w-4 h-4" />
                      Reenviar E-mail
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      v-if="proposal.status !== 'accepted'"
                      @click="openModal(proposal)"
                      class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-600 cursor-pointer outline-none transition-all"
                    >
                      <Pencil class="w-4 h-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      v-if="proposal.status !== 'accepted'"
                      @click="confirmDeleteProposal(proposal)"
                      class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 cursor-pointer outline-none transition-all"
                    >
                      <Trash2 class="w-4 h-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenuPortal>
              </DropdownMenuRoot>
            </div>
          </td>
        </tr>
      </template>

      <!-- Custom skeleton for better fit -->
      <template #skeleton>
        <tr v-for="i in 5" :key="i">
          <td class="px-8 py-6">
            <div class="space-y-2">
              <BaseSkeleton width="60%" height="1.25rem" />
              <BaseSkeleton width="30%" height="0.75rem" />
            </div>
          </td>
          <td class="px-8 py-6"><BaseSkeleton width="80px" height="1rem" /></td>
          <td class="px-8 py-6"><BaseSkeleton width="70px" height="1.5rem" borderRadius="999px" /></td>
          <td class="px-8 py-6"><div class="flex justify-end"><BaseSkeleton width="100px" height="1.5rem" /></div></td>
          <td class="px-8 py-6"><div class="flex justify-end gap-2"><BaseSkeleton v-for="j in 4" :key="j" width="2rem" height="2rem" borderRadius="0.5rem" /></div></td>
        </tr>
      </template>
    </BaseDataList>

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
        <!-- Voltar -->
        <BaseButton 
          v-if="proposalFormRef?.currentStep > 1" 
          type="button" 
          variant="secondary" 
          @click="proposalFormRef.prevStep()" 
          :disabled="isSubmitting"
        >
          <ArrowLeft class="w-4 h-4 mr-2" /> Voltar
        </BaseButton>

        <div class="flex-1"></div>

        <!-- Total Parcial no passo 2 -->
        <div v-if="proposalFormRef?.currentStep === 2" class="hidden sm:block text-center mr-4">
          <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Total Parcial</span>
          <span class="text-lg font-black text-blue-600">R$ {{ (proposalFormRef?.finalTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
        </div>

        <!-- Próximo (Passo < totalSteps) -->
        <BaseButton 
          v-if="proposalFormRef?.currentStep < proposalFormRef?.totalSteps" 
          type="button" 
          variant="primary" 
          @click="proposalFormRef.nextStep()"
        >
          Próximo Passo
          <ArrowRight class="w-4 h-4 ml-2" />
        </BaseButton>

        <!-- Finalizar (Último passo) -->
        <template v-else-if="proposalFormRef?.currentStep === proposalFormRef?.totalSteps">
          <template v-if="proposalFormRef?.isEditingNonDraft">
            <BaseButton type="button" :disabled="isSubmitting" :loading="isSubmitting" @click="proposalFormRef.submit()">
              Salvar Alterações
            </BaseButton>
          </template>
          <template v-else>
            <BaseButton type="button" variant="outline" :disabled="isSubmitting" @click="proposalFormRef.submit('draft')">
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin mr-2" />
              Salvar Rascunho
            </BaseButton>
            <BaseButton type="button" :disabled="isSubmitting" @click="proposalFormRef.submit('created')" class="bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200">
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin mr-2" />
              {{ creditLabel('proposalSend', 'Criar e Enviar') }}
            </BaseButton>
          </template>
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
                <img :src="'/images/icons/whatsapp-svg.svg'" class="w-4 h-4" alt="WhatsApp" loading="lazy"/> WhatsApp
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
          :to="selectedProposal ? `/p/${selectedProposal.slug}${selectedProposal.token ? `?t=${selectedProposal.token}` : ''}` : '#'"
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
          <div class="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
            <img :src="'/images/icons/whatsapp-svg.svg'" class="w-6 h-6" alt="WhatsApp" loading="lazy"/>
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
            <img :src="'/images/icons/whatsapp-svg.svg'" class="w-5 h-5 mr-2" alt="WhatsApp" loading="lazy"/>
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

    <!-- Modal de Histórico -->
    <BaseDialog
      v-model:open="isHistoryOpen"
      title="Ciclo de Vida do Orçamento"
      size="lg"
    >
      <div v-if="selectedProposal" class="p-6">
        <div class="mb-8 flex items-center justify-between">
          <div>
            <h3 class="text-xl font-black text-gray-900 tracking-tight">{{ selectedProposal.title }}</h3>
            <p class="text-sm text-gray-500 font-medium">{{ selectedProposal.client.name }} • {{ selectedProposal.code }}</p>
          </div>
          <BaseBadge :variant="getStatusVariant(selectedProposal.status)">
            {{ statusMap[selectedProposal.status]?.label }}
          </BaseBadge>
        </div>

        <div v-if="isLoadingHistory" class="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 class="w-10 h-10 text-blue-600 animate-spin" />
          <p class="text-sm text-gray-500 font-bold animate-pulse">Carregando histórico...</p>
        </div>
        <ProposalTimeline v-else :history="selectedProposalHistory" />

        <div v-if="!isLoadingHistory && selectedProposalHistory.length === 0" class="py-10 text-center">
          <p class="text-gray-400 text-sm italic">Nenhum evento registrado ainda.</p>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="secondary" size="sm" @click="isHistoryOpen = false">Fechar</BaseButton>
      </template>
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
            <span class="text-blue-600 lowercase font-bold select-all">{{ siteOrigin }}/p/{{ selectedProposal.slug }}{{ selectedProposal.token ? `?t=${selectedProposal.token}` : '' }}</span>
          </div>
        </div>
        <div class="flex-1 bg-white overflow-hidden rounded-b-3xl">
          <iframe
            :src="`/p/${selectedProposal.slug}?preview=true${selectedProposal.token ? `&t=${selectedProposal.token}` : ''}`"
            class="w-full h-full border-none"
          ></iframe>
        </div>
      </div>
    </BaseDialog>
    <!-- Modal de Chat/Interação -->
    <ProposalChatModal
      v-model:open="isChatOpen"
      :proposal="selectedProposal"
      @refresh="refresh"
    />
    <!-- Modal de Paywall Express -->
    <PaywallExpressModal 
      v-model:open="isPaywallOpen" 
      :reason="paywallReason" 
    />

  </div>
</template>
