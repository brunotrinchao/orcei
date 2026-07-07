<script setup lang="ts">
import { Phone, MessageCircle, CheckCircle2, Download, ExternalLink, MapPin, X, Loader2, AlertCircle, PencilLine, ThumbsDown, Eye, FileText, CreditCard, Banknote, Clock, Shield, Mail, Send, Check, CheckCheck } from 'lucide-vue-next'
import { isToday, isYesterday, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { ProposalDTO } from '../../../types'

definePageMeta({
  layout: 'blank'
})

// Token de acesso (?t=) fica na query string: evita repasse via header Referer
// caso a página tenha links externos, e reduz exposição em logs de proxy/CDN.
useHead({
  meta: [{ name: 'referrer', content: 'no-referrer' }]
})

const { notify, confirm: confirmAlert } = useAlerts()
const { hasConsent } = useCookieConsent()
const route = useRoute()
const { t: token, preview } = route.query
const isPreview = computed(() => preview === 'true')
const { data: proposal, refresh, error, pending } = useLazyFetch<ProposalDTO>(`/api/proposals/public/${route.params.slug}`, {
  query: computed(() => ({ 
    t: token, 
    preview: preview,
    consent: hasConsent.value ? 'accepted' : 'declined'
  }))
})

const isAccepting = ref(false)
const isTermsOpen = ref(false)
const isChatModalOpen = ref(false)

const selectedMethod = ref<'cash' | 'credit_card'>('cash')
const selectedUpsells = ref<string[]>([])
const actionType = ref<'decline' | 'request_changes'>('decline')
const actionNotes = ref('')
const isActionModalOpen = ref(false)
const isSubmittingAction = ref(false)

const {
  messages,
  newMessage,
  isSendingMessage,
  groupedMessages,
  loadMessages,
  sendMessage,
  markAsRead,
  connectPusher
} = useProposalChat({
  role: 'client',
  slug: route.params.slug as string,
  token: token as string
})

const chatMessagesRef = ref<HTMLElement | null>(null)

function scrollToBottom() {
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  })
}

// Mark messages as read and load when opening modal
watch(isChatModalOpen, async (val) => {
  if (val) {
    scrollToBottom()
    await loadMessages()
    if (proposal.value?.unreadMessages > 0) {
      await markAsRead()
      proposal.value.unreadMessages = 0
    }
  }
})

// Watch chat modal open to scroll
watch(isChatModalOpen, (val) => {
  if (val) {
    scrollToBottom()
  }
})

// Watch messages to scroll
watch(messages, () => {
  if (isChatModalOpen.value) {
    scrollToBottom()
  }
}, { deep: true })

watch(proposal, (newProposal) => {
  if (newProposal) {
    connectPusher(newProposal._id)
  }
}, { immediate: true })

const formatMessageTime = (date: any) => {
  return format(new Date(date), 'HH:mm')
}

const selectedUpsellList = computed(() => {
  if (!proposal.value?.upsellItems) return []
  return proposal.value.upsellItems.filter(item => selectedUpsells.value.includes(item._id!))
})

const activeUpsellTotal = computed(() => {
  return selectedUpsellList.value.reduce((acc, item) => acc + (item.price * item.quantity), 0)
})

const computedTotals = computed(() => {
  if (!proposal.value) return { subtotal: 0, discount: 0, additional: 0, final: 0 }
  const subtotalBase = proposal.value.totals.subtotal + activeUpsellTotal.value
  const additional = proposal.value.totals.additional || 0
  const discount = proposal.value.totals.discount || 0
  const base = subtotalBase + additional - discount
  
  let final = base
  if (selectedMethod.value === 'cash') {
    final = base * (1 - (proposal.value.paymentConfig.cashDiscount / 100))
  }
  
  return {
    subtotal: subtotalBase,
    discount,
    additional,
    final
  }
})

const finalTotal = computed(() => computedTotals.value.final)

async function handleAccept() {
  if (isPreview.value) return
  isAccepting.value = true
  try {
    await $fetch(`/api/proposals/public/accept`, {
      method: 'POST',
      body: { 
        slug: route.params.slug,
        token: token,
        paymentMethod: selectedMethod.value,
        selectedUpsells: selectedUpsells.value
      }
    })
    await refresh()
    notify('Sucesso', 'Orçamento aceito com sucesso!')
  } catch (e: any) {
    notify('Erro', e.data?.statusMessage || 'Erro ao aceitar orçamento')
  } finally {
    isAccepting.value = false
  }
}

function openActionModal(type: 'decline' | 'request_changes') {
  if (isPreview.value) return
  
  if (type === 'request_changes') {
    isChatModalOpen.value = true
    return
  }

  actionType.value = type
  actionNotes.value = ''
  isActionModalOpen.value = true
}

async function handleAction() {
  if (isPreview.value) return
  if (!actionNotes.value) return notify('Aviso', 'Por favor, escreva uma mensagem.')
  
  isSubmittingAction.value = true
  try {
    await $fetch(`/api/proposals/public/action`, {
      method: 'POST',
      body: {
        slug: route.params.slug,
        token: token,
        type: actionType.value,
        notes: actionNotes.value
      }
    })
    isActionModalOpen.value = false
    notify('Sucesso', actionType.value === 'decline' ? 'Orçamento recusado.' : 'Solicitação de alteração enviada!')
    await refresh()
  } catch (e) {
    notify('Erro', 'Erro ao processar ação')
  } finally {
    isSubmittingAction.value = false
  }
}

const formatDate = (date: any) => {
  if (!date) return 'Sem validade'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'Sem validade'
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

// Retorna o número de WhatsApp do perfil (campo phones[])
const profileWhatsapp = computed(() => {
  const phones = (proposal.value?.profileId as any)?.contact?.phones
  if (!phones?.length) return null
  const wa = phones.find((p: any) => p.isWhatsapp)
  return (wa || phones[0])?.number || null
})

const { data: systemInfo } = useFetch<any>('/api/system/status')

const statusMap: any = {
  draft:      { label: 'Rascunho',   variant: 'default' },
  created:    { label: 'Enviado',    variant: 'info' },
  sent:       { label: 'Enviado',    variant: 'info' },
  delivered:  { label: 'Entregue',   variant: 'info' },
  opened:     { label: 'Aberto',     variant: 'info' },
  clicked:    { label: 'Visualizado', variant: 'info' },
  viewed:     { label: 'Visualizado', variant: 'info' },
  pending:    { label: 'Pendente',   variant: 'warning' },
  scheduled:  { label: 'Agendado',   variant: 'info' },
  received:   { label: 'Recebido',   variant: 'info' },
  bounced:    { label: 'Enviado',    variant: 'info' },
  delayed:    { label: 'Enviado',    variant: 'info' },
  failed:     { label: 'Enviado',    variant: 'info' },
  suppressed: { label: 'Enviado',    variant: 'info' },
  accepted:   { label: 'Aceito',     variant: 'success' },
  expired:    { label: 'Expirado',   variant: 'error' },
  declined:   { label: 'Recusado',   variant: 'error' },
  changes_requested: { label: 'Revisão Solicitada', variant: 'warning' }
}
</script>

<template>
  <!-- Loading state with Skeleton -->
  <div v-if="pending || (!proposal && !error)" class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Header Skeleton -->
    <header class="bg-white border-b border-gray-200 h-16 flex items-center px-5 sm:px-8 shrink-0">
      <div class="max-w-6xl mx-auto w-full flex justify-between items-center">
        <div class="w-32 h-8 bg-gray-200 animate-pulse rounded-lg"></div>
        <div class="w-20 h-6 bg-gray-200 animate-pulse rounded-full"></div>
      </div>
    </header>

    <!-- Hero Skeleton -->
    <div class="bg-gray-900 py-16 sm:py-24 px-5 sm:px-8">
      <div class="max-w-6xl mx-auto space-y-8">
        <div class="w-40 h-4 bg-blue-500/20 animate-pulse rounded"></div>
        <div class="w-3/4 h-12 bg-white/10 animate-pulse rounded-xl"></div>
        <div class="w-1/2 h-6 bg-white/10 animate-pulse rounded-lg"></div>
        
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 mt-12">
          <div v-for="i in 3" :key="i" class="h-24 bg-white/5 border border-white/10 animate-pulse rounded-2xl"></div>
        </div>
      </div>
    </div>

    <!-- Content Skeleton -->
    <main class="max-w-6xl mx-auto px-5 sm:px-8 py-12 space-y-10 flex-1">
      <div class="bg-white rounded-3xl border border-gray-100 p-8 space-y-8">
        <div class="w-48 h-4 bg-gray-100 animate-pulse rounded"></div>
        <div v-for="i in 3" :key="i" class="flex gap-6 border-b border-gray-50 pb-8 last:border-0 last:pb-0">
          <div class="w-10 h-10 bg-gray-100 animate-pulse rounded-xl"></div>
          <div class="flex-1 space-y-3">
            <div class="w-1/3 h-5 bg-gray-200 animate-pulse rounded"></div>
            <div class="w-full h-3 bg-gray-100 animate-pulse rounded"></div>
          </div>
          <div class="w-24 h-8 bg-gray-200 animate-pulse rounded-lg"></div>
        </div>
      </div>

      <!-- Fallback indicator -->
      <div class="flex justify-center py-4">
        <Loader2 class="w-6 h-6 text-gray-300 animate-spin" />
      </div>
    </main>
  </div>

  <div v-else-if="error" class="min-h-screen bg-gray-50 flex items-center justify-center px-6">
    <div class="text-center max-w-sm">
      <div class="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <AlertCircle class="w-10 h-10 text-red-400" />
      </div>
      <h1 class="text-2xl font-black text-gray-900 tracking-tight mb-2">
        {{ error.statusCode === 503 ? 'Sistema Temporariamente Offline' : 'Proposta não encontrada' }}
      </h1>
      <p class="text-gray-500 font-medium">
        {{ error.statusCode === 503 ? 'Estamos com dificuldades de conexão com o banco de dados. Por favor, tente novamente em alguns instantes.' : 'Este link pode ter expirado ou ser inválido.' }}
      </p>
      <div v-if="error.statusCode === 503" class="mt-8">
        <BaseButton @click="refresh()">Tentar Novamente</BaseButton>
      </div>
    </div>
  </div>

  <div v-else-if="proposal" class="min-h-screen bg-[#F7F8FC]">

    <!-- Preview Mode Banner -->
    <div v-if="isPreview" class="bg-[#3147F6] text-white px-6 py-3 flex items-center justify-center gap-3">
      <Eye class="w-4 h-4 shrink-0" />
      <p class="text-xs font-black uppercase tracking-widest">Modo Preview — Esta é a visão do seu cliente. Ações desabilitadas.</p>
    </div>

    <!-- ─── STICKY HEADER ──────────────────────────────────────────── -->
    <header class="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100/80">
      <div class="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
        <!-- Logo da empresa do profissional -->
        <img
          :src="proposal.profileId?.brandConfig?.logoUrl || useRuntimeConfig().public.appDocumentLogo || 'https://res.cloudinary.com/dpeaqezkb/image/upload/v1778873300/orcafacil/logo-default.png'"
          :alt="proposal.profileId?.name || systemInfo?.landingPage?.appName || 'Orcei'"
          class="h-7 w-auto object-contain"
        />
        <!-- Code + Status -->
        <div class="flex items-center gap-3">
          <span class="hidden sm:block text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">
            #{{ proposal.code }}
          </span>
          <BaseBadge :variant="statusMap[proposal.status]?.variant || 'info'">
            {{ statusMap[proposal.status]?.label || proposal.status }}
          </BaseBadge>
        </div>
      </div>
    </header>

    <!-- ─── COVER HERO ─────────────────────────────────────────────── -->
    <section class="bg-gray-900 text-white relative overflow-hidden">
      <!-- Decorative blobs -->
      <div class="absolute top-0 left-0 w-[600px] h-[600px] bg-[#3147F6]/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-800/20 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl pointer-events-none"></div>

      <div class="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
        <!-- Label -->
        <p class="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-6">Proposta Comercial</p>

        <!-- Title -->
        <h1 class="text-3xl sm:text-5xl font-black tracking-tight leading-tight max-w-3xl mb-4">
          {{ proposal.title }}
        </h1>

        <!-- Client name -->
        <p class="text-gray-300 font-bold text-lg mb-12">
          Preparado para <span class="text-white">{{ proposal.client.name }}</span>
        </p>

        <!-- Stats row -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
          <!-- Valid until -->
          <div class="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <div class="flex items-center gap-2 mb-2">
              <Clock class="w-4 h-4 text-blue-400" />
              <span class="text-[10px] font-black text-gray-300 uppercase tracking-widest">Válido até</span>
            </div>
            <p class="font-black text-white text-base leading-tight">{{ formatDate(proposal.expiresAt) }}</p>
          </div>

          <!-- Code -->
          <div class="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <div class="flex items-center gap-2 mb-2">
              <FileText class="w-4 h-4 text-blue-400" />
              <span class="text-[10px] font-black text-gray-300 uppercase tracking-widest">Código</span>
            </div>
            <p class="font-black text-white text-base leading-tight">#{{ proposal.code }}</p>
          </div>

          <!-- Total -->
          <div class="col-span-2 sm:col-span-1 bg-[#3147F6] border border-blue-500/40 rounded-2xl p-5">
            <div class="flex items-center gap-2 mb-2">
              <Banknote class="w-4 h-4 text-blue-100" />
              <span class="text-[10px] font-black text-blue-100 uppercase tracking-widest">Valor Total</span>
            </div>
            <p class="font-black text-white text-2xl leading-tight">
              R$ {{ finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── MAIN CONTENT ───────────────────────────────────────────── -->
    <main class="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-16 space-y-10 pb-40 sm:pb-16">

      <!-- ── ITEMS TABLE ─────────────────────────────────────────── -->
      <ProposalClientScope
        :items="proposal.items"
        :upsell-items="proposal.upsellItems"
        v-model:selected-upsells="selectedUpsells"
        :totals="computedTotals"
        :final-total="finalTotal"
      />

      <!-- ── PAYMENT OPTIONS ─────────────────────────────────────── -->
      <ProposalClientPayment
        v-if="!['accepted', 'expired'].includes(proposal.status)"
        v-model="selectedMethod"
        :payment-config="proposal.paymentConfig"
        :totals="computedTotals"
      />

      <!-- ── CONTRACT (collapsible) ──────────────────────────────── -->
      <ProposalClientContract
        v-if="proposal.contractText"
        :contract-text="proposal.contractText"
      />

      <!-- ── DECISION PANEL ──────────────────────────────────────── -->
      <section class="relative overflow-hidden rounded-3xl bg-gray-900 shadow-2xl">
        <!-- Accepted overlay -->
        <Transition name="accepted-overlay">
          <div
            v-if="proposal.status === 'accepted'"
            class="absolute inset-0 bg-green-600 flex flex-col items-center justify-center gap-4 z-10"
          >
            <div class="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle2 class="w-10 h-10 text-white" />
            </div>
            <h2 class="text-3xl font-black text-white uppercase tracking-tight text-center px-4">Proposta Aceita!</h2>
            <p class="text-green-200 font-bold text-sm uppercase tracking-widest">Obrigado pela confiança</p>
          </div>
        </Transition>

        <!-- Decorative blob -->
        <div class="absolute top-0 right-0 w-64 h-64 bg-[#3147F6]/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl pointer-events-none"></div>

        <div class="relative z-0 p-8 sm:p-12">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
            <!-- Total display -->
            <div>
              <p class="text-[10px] font-black text-gray-300 uppercase tracking-[0.25em] mb-3">Total do Investimento</p>
              <div class="flex flex-col">
                <span v-if="selectedMethod === 'cash' && proposal.paymentConfig.cashDiscount > 0" class="text-sm font-bold text-gray-400 line-through decoration-red-500/50 mb-1">
                  R$ {{ (computedTotals.subtotal + (computedTotals.additional || 0) - (computedTotals.discount || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
                </span>
                <p class="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  R$ {{ finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
                </p>
              </div>
              <p v-if="!['accepted', 'expired'].includes(proposal.status)" class="mt-2 text-xs font-black text-[#6B84FF] uppercase tracking-widest">
                {{ selectedMethod === 'cash'
                ? (proposal.paymentConfig.cashDiscount > 0 ? `À Vista — ${proposal.paymentConfig.cashDiscount}% OFF` : 'À Vista')
                : (proposal.paymentConfig.installments > 1 ? `Cartão — ${proposal.paymentConfig.installments}x sem juros` : 'À Vista no Cartão') }}
              </p>
            </div>

            <!-- Action buttons -->
            <div v-if="!['draft', 'accepted', 'expired'].includes(proposal.status)" class="hidden sm:flex items-center gap-4">
              <template v-if="!isPreview">
                <button
                  @click="openActionModal('decline')"
                  class="px-7 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border-2 border-transparent text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  Recusar Proposta
                </button>
                <button
                  @click="isChatModalOpen = true"
                  class="px-7 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border-2 border-white/10 text-gray-300 hover:bg-white/10 transition-all relative outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Chat com o Profissional
                  <span 
                    v-if="proposal.unreadMessages > 0"
                    class="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-4 ring-gray-900 animate-bounce"
                  >
                    {{ proposal.unreadMessages }}
                  </span>
                </button>
                <button
                  @click="handleAccept"
                  :disabled="isAccepting"
                  class="px-9 py-4 bg-[#3147F6] hover:bg-blue-600 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-[#3147F6]/30 transition-all flex items-center gap-2 disabled:opacity-60 outline-none focus-visible:ring-2 focus-visible:ring-[#3147F6] focus-visible:ring-offset-2"
                >
                  <Loader2 v-if="isAccepting" class="w-4 h-4 animate-spin" />
                  Aceitar Proposta
                </button>
              </template>
              <div v-else class="px-7 py-4 rounded-2xl text-xs font-black uppercase tracking-widest bg-white/5 text-gray-500 border border-white/10">
                Modo Visualização
              </div>
            </div>
          </div>

          <!-- Contact row -->
          <div class="mt-10 pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              :href="`mailto:${proposal.profileId.email}`"
              class="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <div class="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <Mail class="w-4 h-4 text-gray-300 group-hover:text-white transition-colors" />
              </div>
              <div>
                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">E-mail</p>
                <p class="text-xs font-bold text-gray-300 truncate">{{ proposal.profileId.email }}</p>
              </div>
            </a>
            <a
              v-if="profileWhatsapp"
              :href="`https://wa.me/${profileWhatsapp.replace(/\D/g, '')}`"
              target="_blank"
              class="flex items-center gap-3 p-4 bg-white/5 hover:bg-green-500/10 rounded-2xl border border-white/10 hover:border-green-500/30 transition-all group outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              <div class="w-9 h-9 bg-white/10 group-hover:bg-green-500/20 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                <MessageCircle class="w-4 h-4 text-gray-300 group-hover:text-green-400 transition-colors" />
              </div>
              <div>
                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">WhatsApp</p>
                <p class="text-xs font-bold text-gray-300">{{ profileWhatsapp }}</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      <!-- ── TERMS LINK + FOOTER ─────────────────────────────────── -->
      <footer class="pt-4 pb-2 text-center space-y-6">
        <button
          @click="isTermsOpen = true"
          class="text-gray-600 hover:text-gray-800 text-[10px] font-black uppercase tracking-[0.2em] underline decoration-dotted underline-offset-8 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#3147F6]"
        >
          Termos e Condições de Serviço
        </button>

        <a
          href="https://orceifacil.com.br?utm_source=proposal&utm_medium=powered_by&utm_campaign=viral_loop"
          target="_blank"
          rel="noopener noreferrer"
          class="flex flex-col items-center gap-2 pt-4 hover:opacity-80 transition-opacity"
        >
          <img
            :src="useRuntimeConfig().public.appDocumentLogo || 'https://res.cloudinary.com/dpeaqezkb/image/upload/v1778873300/orcafacil/logo-default.png'"
            :alt="systemInfo?.landingPage?.appName || 'Orcei'"
            class="h-5 w-auto object-contain opacity-30"
          />
          <p class="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">Powered by {{ systemInfo?.landingPage?.appName || 'Orcei' }}</p>
        </a>
      </footer>
    </main>

    <!-- ─── STICKY MOBILE BOTTOM BAR ──────────────────────────────── -->
    <div
      v-if="!['draft', 'accepted', 'expired'].includes(proposal.status) && !isPreview"
      class="fixed bottom-0 left-0 right-0 sm:hidden z-50 bg-white/90 backdrop-blur-xl border-t border-gray-100 px-5 pt-4 pb-safe"
    >
      <button
        v-if="!isPreview"
        @click="openActionModal('decline')"
        class="w-full text-center text-[9px] font-black text-gray-400 uppercase tracking-widest py-1 hover:text-red-400 transition-colors"
      >
        Recusar Proposta
      </button>
      <div class="flex gap-3 pb-4">
        <button
          @click="isChatModalOpen = true"
          class="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all relative"
        >
          Chat com Profissional
          <span 
            v-if="proposal.unreadMessages > 0"
            class="absolute -top-2 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-2 ring-white"
          >
            {{ proposal.unreadMessages }}
          </span>
        </button>
        <button
          @click="handleAccept"
          :disabled="isAccepting"
          class="flex-[2] py-4 bg-[#3147F6] rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-[#3147F6]/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60"
        >
          <Loader2 v-if="isAccepting" class="w-4 h-4 animate-spin" />
          {{ isAccepting ? 'Processando...' : 'Aceitar Proposta' }}
        </button>
      </div>
    </div>

    <!-- ─── MODALS ──────────────────────────────────────────────────── -->

    <!-- Terms Dialog -->
    <BaseDialog v-model:open="isTermsOpen" title="Termos e Condições" size="lg">
      <div class="prose-contract p-4 text-sm text-gray-600 leading-relaxed">
        <div v-html="useSanitizeHtml(proposal?.termsAndConditions)"></div>
      </div>
      <template #footer>
        <BaseButton @click="isTermsOpen = false">Fechar</BaseButton>
      </template>
    </BaseDialog>

    <!-- Chat Dialog -->
    <BaseDialog v-model:open="isChatModalOpen" title="Dúvidas e Alterações" size="md">
      <div class="p-0 flex flex-col h-[500px] bg-[#E5DDD5] overflow-hidden rounded-b-2xl">
        <!-- Messages list -->
        <div 
          ref="chatMessagesRef"
          class="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-hide relative bg-[#dfe4ea]"
        >
          <div v-if="!groupedMessages?.length" class="text-center py-10 bg-white/60 backdrop-blur-sm rounded-3xl p-8 max-w-xs mx-auto mt-10">
            <MessageCircle class="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">Nenhuma interação ainda.<br>Envie sua primeira dúvida abaixo.</p>
          </div>

          <div v-for="group in groupedMessages" :key="group.date" class="space-y-4">
            <!-- Date Separator -->
            <div class="flex justify-center my-6">
              <span class="px-4 py-1.5 bg-white/80 backdrop-blur-md rounded-xl text-[9px] font-black text-gray-500 uppercase tracking-widest shadow-sm">
                {{ group.date }}
              </span>
            </div>

            <div
              v-for="msg in group.items"
              :key="msg._id"
              :class="[
                'flex flex-col max-w-[85%] relative',
                msg.sender === 'client' ? 'ml-auto items-end' : 'items-start'
              ]"
            >
              <!-- Bubble -->
              <div
                :class="[
                  'px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed shadow-sm min-w-[80px]',
                  msg.sender === 'client'
                    ? 'bg-[#DCF8C6] text-gray-800 rounded-tr-none'
                    : 'bg-white text-gray-800 rounded-tl-none'
                ]"
              >
                {{ msg.text }}
                
                <!-- Time and Status inside bubble -->
                <div class="flex items-center justify-end gap-1 mt-1 -mr-1">
                  <span class="text-[9px] font-bold opacity-40 uppercase tracking-tighter">
                    {{ formatMessageTime(msg.createdAt) }}
                  </span>
                  <template v-if="msg.sender === 'client'">
                    <Clock v-if="msg.status === 'pending'" class="w-2.5 h-2.5 text-gray-400 animate-pulse" />
                    <template v-else>
                      <CheckCheck v-if="msg.read" class="w-3 h-3 text-blue-500" />
                      <Check v-else class="w-3 h-3 text-gray-400" />
                    </template>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Message input -->
        <div class="p-4 bg-[#F0F2F5] border-t border-gray-200">
          <form @submit.prevent="sendMessage" class="flex gap-3 items-center">
            <div class="flex-1 relative">
              <input
                v-model="newMessage"
                placeholder="Mensagem..."
                class="w-full px-6 py-3.5 bg-white border-none rounded-full focus:ring-0 outline-none font-medium text-sm shadow-sm placeholder:text-gray-400"
                :disabled="['accepted', 'expired'].includes(proposal.status)"
              />
            </div>
            <button
              type="submit"
              :disabled="isSendingMessage || !newMessage.trim() || ['accepted', 'expired'].includes(proposal.status)"
              class="w-12 h-12 bg-[#00A884] hover:bg-[#008F6A] rounded-full text-white shadow-md flex items-center justify-center transition-all active:scale-90 disabled:opacity-50 disabled:grayscale"
            >
              <Loader2 v-if="isSendingMessage" class="w-5 h-5 animate-spin" />
              <Send v-else class="w-5 h-5 ml-0.5" />
            </button>
          </form>
          <p v-if="['accepted', 'expired'].includes(proposal.status)" class="mt-3 text-[9px] font-black text-red-400 text-center uppercase tracking-widest">
            Chat desabilitado (Proposta {{ proposal.status === 'accepted' ? 'aceita' : 'expirada' }})
          </p>
        </div>
      </div>
    </BaseDialog>

    <!-- Action/Decline Dialog -->
    <BaseDialog v-model:open="isActionModalOpen" title="Recusar Proposta" size="md">
      <div class="p-6 space-y-4">
        <p class="text-sm text-gray-600 leading-relaxed">
          Lamentamos que a proposta não tenha atendido às suas expectativas. Por favor, nos informe o motivo da recusa para que possamos melhorar ou tentar uma nova abordagem.
        </p>
        <div class="space-y-2">
          <label for="decline-notes" class="block text-xs font-black text-gray-600 uppercase tracking-widest">
            Motivo da Recusa *
          </label>
          <textarea
            id="decline-notes"
            v-model="actionNotes"
            rows="4"
            placeholder="Escreva aqui o motivo..."
            class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#3147F6] focus:border-transparent outline-none font-medium text-sm text-gray-800 placeholder:text-gray-400 resize-none"
            required
          ></textarea>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3 px-6 pb-6">
          <BaseButton variant="outline" @click="isActionModalOpen = false">Cancelar</BaseButton>
          <BaseButton 
            variant="danger" 
            :disabled="isSubmittingAction || !actionNotes.trim()" 
            @click="handleAction"
          >
            <Loader2 v-if="isSubmittingAction" class="w-4 h-4 animate-spin mr-2" />
            Recusar Proposta
          </BaseButton>
        </div>
      </template>
    </BaseDialog>
  </div>
</template>

<style scoped>
/* Contract / terms prose styles */
.prose-contract :deep(h1),
.prose-contract :deep(h2),
.prose-contract :deep(h3) {
  @apply font-black text-gray-900 mb-3 mt-6 tracking-tight uppercase;
}
.prose-contract :deep(h2) {
  @apply text-base;
}
.prose-contract :deep(h3) {
  @apply text-sm;
}
.prose-contract :deep(p) {
  @apply text-gray-600 text-sm leading-relaxed mb-4;
}
.prose-contract :deep(ul),
.prose-contract :deep(ol) {
  @apply pl-5 mb-4 space-y-2 text-gray-600 text-sm;
}
.prose-contract :deep(ul) {
  @apply list-disc;
}
.prose-contract :deep(ol) {
  @apply list-decimal;
}
.prose-contract :deep(strong) {
  @apply font-black text-gray-800;
}

/* Safe area for mobile bottom bar */
.pb-safe {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}

/* Accepted overlay transition */
.accepted-overlay-enter-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.accepted-overlay-enter-from {
  opacity: 0;
  transform: scale(0.97);
}
.accepted-overlay-enter-to {
  opacity: 1;
  transform: scale(1);
}

/* Details/summary chevron polish */
details summary::-webkit-details-marker {
  display: none;
}
</style>
