<script setup lang="ts">
import { Phone, MessageCircle, CheckCircle2, Download, ExternalLink, MapPin, X, Loader2, AlertCircle, PencilLine, ThumbsDown, Eye, FileText, CreditCard, Banknote, Clock, Shield, Mail, Send, Check, CheckCheck, Instagram, Youtube, Facebook, Twitter } from 'lucide-vue-next'
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
const config = useRuntimeConfig()

// Redirecionamento SSR para forçar o subdomínio de orçamentos (orcamento.orceifacil.com.br)
if (import.meta.server) {
  const headers = useRequestHeaders()
  const host = headers.host
  const targetProposalUrl = config.public.publicProposalUrl
  
  if (targetProposalUrl && host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    const targetDomain = targetProposalUrl.replace(/^https?:\/\//i, '').split('/')[0]
    if (host !== targetDomain) {
      await navigateTo(`${targetProposalUrl}${route.fullPath}`, { external: true, redirectCode: 301 })
    }
  }
}

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

const formatDate = (date: any, format: any) => {
  if (!date) return 'Sem validade'

  const newFormat = format || {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'Sem validade'
  return d.toLocaleDateString('pt-BR', newFormat)
}

// Retorna o número de WhatsApp do perfil (campo phones[])
const profileWhatsapp = computed(() => {
  const phones = (proposal.value?.profileId as any)?.contact?.phones
  if (!phones?.length) return null
  const wa = phones.find((p: any) => p?.isWhatsapp)
  return (wa || phones[0])?.number || null
})

const { data: systemInfo } = useFetch<any>('/api/system/status', { key: 'system-status' })

// Links das redes sociais do profissional (contact.social), exibidos no rodapé
const social = computed(() => (proposal.value?.profileId as any)?.contact?.social || {})

const socialLinks = computed(() => {
  const s = social.value
  const links: { key: string; url: string; icon: any; hoverClass: string }[] = []
  if (s.instagram) {
    links.push({ key: 'instagram', url: `https://instagram.com/${s.instagram.replace('@', '')}`, icon: Instagram, hoverClass: 'hover:text-pink-400' })
  }
  if (s.facebook) {
    links.push({ key: 'facebook', url: `https://facebook.com/${s.facebook.replace('@', '')}`, icon: Facebook, hoverClass: 'hover:text-blue-400' })
  }
  if (s.twitter) {
    links.push({ key: 'twitter', url: `https://x.com/${s.twitter.replace('@', '')}`, icon: Twitter, hoverClass: 'hover:text-gray-300' })
  }
  if (s.youtube) {
    links.push({ key: 'youtube', url: `https://youtube.com/${s.youtube.replace('@', '')}`, icon: Youtube, hoverClass: 'hover:text-red-400' })
  }
  return links
})

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
  <div v-if="pending || (!proposal && !error)" class="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col">
    <!-- Header Skeleton -->
    <header class="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 h-16 flex items-center px-5 sm:px-8 shrink-0">
      <div class="max-w-6xl mx-auto w-full flex justify-between items-center">
        <BaseSkeleton width="8rem" height="2rem" borderRadius="0.5rem" />
        <BaseSkeleton width="5rem" height="1.5rem" borderRadius="9999px" />
      </div>
    </header>

    <!-- Hero Skeleton -->
    <div class="bg-slate-900 py-16 sm:py-24 px-5 sm:px-8 border-b border-slate-800">
      <div class="max-w-6xl mx-auto space-y-8">
        <BaseSkeleton width="10rem" height="1rem" />
        <BaseSkeleton width="75%" height="3rem" borderRadius="0.75rem" />
        <BaseSkeleton width="50%" height="1.5rem" borderRadius="0.5rem" />
        
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 mt-12">
          <div v-for="i in 3" :key="i" class="h-24 bg-slate-850/50 border border-slate-800 rounded-[0.75rem] p-4 flex flex-col justify-between">
            <BaseSkeleton width="60%" height="0.8rem" />
            <BaseSkeleton width="80%" height="1.5rem" />
          </div>
        </div>
      </div>
    </div>

    <!-- Content Skeleton -->
    <main class="max-w-6xl mx-auto px-5 sm:px-8 py-12 space-y-10 flex-1">
      <div class="bg-white dark:bg-slate-900 rounded-[0.75rem] border border-slate-200 dark:border-slate-800 p-8 space-y-8 shadow-sm">
        <BaseSkeleton width="12rem" height="1rem" />
        <div v-for="i in 3" :key="i" class="flex gap-6 border-b border-slate-100 dark:border-slate-800 pb-8 last:border-0 last:pb-0">
          <BaseSkeleton width="2.5rem" height="2.5rem" borderRadius="0.75rem" />
          <div class="flex-1 space-y-3">
            <BaseSkeleton width="35%" height="1.25rem" />
            <BaseSkeleton width="90%" height="0.85rem" />
          </div>
          <BaseSkeleton width="6rem" height="2rem" borderRadius="0.5rem" />
        </div>
      </div>

      <!-- Fallback indicator -->
      <div class="flex justify-center py-4">
        <Loader2 class="w-6 h-6 text-gray-400 dark:text-gray-600 animate-spin" />
      </div>
    </main>
  </div>

  <div v-else-if="error" class="min-h-screen bg-gray-50 flex items-center justify-center px-6">
    <div class="text-center max-w-sm">
      <div class="w-20 h-20 bg-red-50 rounded-[0.75rem] flex items-center justify-center mx-auto mb-6">
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
      <p class="text-xs font-bold">Modo Preview — Esta é a visão do seu cliente. Ações desabilitadas.</p>
    </div>

    <!-- ─── STICKY HEADER ──────────────────────────────────────────── -->
    <header class="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100/80">
      <div class="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
        <!-- Logo da empresa do profissional -->
        <img
          :src="proposal.profileId?.brandConfig?.logoUrl || useRuntimeConfig().public.appDocumentLogo || 'https://res.cloudinary.com/dpeaqezkb/image/upload/v1778873300/orcafacil/logo-default.png'"
          :alt="proposal.profileId?.name || systemInfo?.landingPage?.appName || 'Orcei'"
          class="h-7 w-auto object-contain"
          loading="lazy"
        />
        <!-- Code + Status -->
        <div class="flex items-center gap-3">
          <span class="hidden sm:block text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">
            {{ proposal.code }}
          </span>
          <BaseBadge :variant="statusMap[proposal.status]?.variant || 'info'">
            {{ statusMap[proposal.status]?.label || proposal.status }}
          </BaseBadge>
        </div>
      </div>
    </header>

    <!-- ─── COVER HERO ─────────────────────────────────────────────── -->
    <section class="bg-white text-gray-900 relative overflow-hidden">
      <div class="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 py-10 sm:py-12">

        <!-- Title -->
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight leading-tight max-w-3xl mb-6 text-gray-900">
          {{ proposal.title }}
        </h1>

        <!-- Stats row -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">

          <div class="bg-gray-50 border border-gray-100 rounded-[0.75rem] p-5">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Proposta Elaborada para</span>
            </div>
            <p class="font-black text-black text-base leading-tight mb-4">{{ proposal.client?.name }}</p>
            <div class="flex gap-4 text-[10px] text-slate-400 font-bold">
              <div>
                <p class="text-[9px] text-slate-400 font-bold uppercase">Data de Emissão</p>
                <p class="text-slate-700 font-bold mt-0.5">{{ formatDate(proposal.createdAt) }}</p>
              </div>
              <div>
               <p class="text-[9px] text-slate-400 font-bold uppercase">Válido até</p>
                <p class="text-slate-700 font-bold mt-0.5">{{ formatDate(proposal.expiresAt) }}</p>
              </div>
              <div>
               <p class="text-[9px] text-slate-400 font-bold uppercase">Data de Início</p>
                <p class="text-slate-700 font-bold mt-0.5">{{ formatDate(proposal.executionDate) }}</p>
              </div>
            </div>
          </div>


          <div class="bg-gray-50 border border-gray-100 rounded-[0.75rem] p-5">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Profissional Responsável</span>
            </div>
            <p class="font-black text-black text-base leading-tight mb-4">{{ proposal.profileId?.name }}</p>
            <div class="space-y-1 text-[10px] text-slate-500">
              <div class="flex items-center gap-1.5">
              <p class="font-bold text-slate-400 text-[9px] uppercase w-12 block">E-MAIL:</p>
                <p class="font-bold text-slate-800">{{ proposal.profileId?.email }}</p>
              </div>  
              <div class="flex items-center gap-1.5">
                <p class="font-bold text-slate-400 text-[9px] uppercase w-12 block">TELEFONE:</p>
                <p class="font-bold text-slate-800">
                  <img v-if="proposal.profileId?.contact?.phones[0]?.isWhatsapp" :src="'/images/icons/whatsapp-svg.svg'" class="w-4 h-4 inline-block" alt="WhatsApp" loading="lazy"/>
                  {{ proposal.profileId?.contact?.phones[0]?.number }}</p>
              </div>  
            </div>
          </div>

          
          <!-- Total -->
          <div class="col-span-2 sm:col-span-1 bg-[#3147F6] border border-blue-500/40 rounded-[0.75rem] p-5">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-[10px] font-black text-blue-100 uppercase tracking-widest">Valor Total</span>
            </div>
            <p class="font-black text-white text-4xl leading-tight">
              R$ {{ finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
            </p>
             <p class="mt-2 text-xs font-black text-[#6B84FF] uppercase tracking-widest">
                {{ selectedMethod === 'cash'
                ? (proposal.paymentConfig.cashDiscount > 0 ? `À Vista — ${proposal.paymentConfig.cashDiscount}% OFF` : 'À Vista')
                : (proposal.paymentConfig.installments > 1 ? `Cartão — ${proposal.paymentConfig.installments}x sem juros` : 'À Vista no Cartão') }}
              </p>
          </div>
        </div>


          <!-- Banner de Assinatura Eletrônica (se ativa ou concluída) -->
          <div v-if="proposal.signature && proposal.signature.status !== 'none'" class="mt-6 p-4 rounded-[0.75rem] border bg-gradient-to-r transition-all"
            :class="proposal.signature.status === 'signed' ? 'from-emerald-50 to-teal-50 border-emerald-200 text-emerald-950' : 'from-indigo-50 to-blue-50 border-indigo-200 text-indigo-950'"
          >
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div :class="proposal.signature.status === 'signed' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'" class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm font-black text-sm">
                  ✓
                </div>
                <div>
                  <h4 class="font-black text-sm tracking-tight">
                    {{ proposal.signature.status === 'signed' ? 'Proposta Assinada Digitalmente' : 'Assinatura Eletrônica Pendente' }}
                  </h4>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {{ proposal.signature.status === 'signed' 
                      ? 'Este documento possui validade jurídica respaldada pela MP 2.200-2/2001 e Lei 14.063/2020.' 
                      : `Um e-mail será enviado para ${proposal.client.email} .` }}
                  </p>
                </div>
              </div>

              <a 
                v-if="proposal.signature.status === 'pending' && proposal.signature.signingUrl" 
                :href="proposal.signature.signingUrl"
                target="_blank"
                class="inline-flex items-center justify-center px-4 py-2 rounded-[0.50rem] bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shrink-0 w-full sm:w-auto"
              >
                Assinar Proposta Agora 🖊️
              </a>
              <span v-else-if="proposal.signature.status === 'signed'" class="text-xs font-black text-emerald-700 uppercase tracking-wider bg-emerald-100 px-3 py-1 rounded-full">
                Assinado com Sucesso
              </span>
            </div>
          </div>
      </div>
    </section>

    <!-- ─── MAIN CONTENT ───────────────────────────────────────────── -->
    <main class="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-16 space-y-10 pb-40">

      <!-- ── ITEMS TABLE ─────────────────────────────────────────── -->
      <ProposalClientScope
        :items="proposal.items"
        :upsell-items="proposal.upsellItems"
        v-model:selected-upsells="selectedUpsells"
        :totals="computedTotals"
        :final-total="finalTotal"
        :is-accepted="proposal.status === 'accepted'"
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
      <section class="relative overflow-hidden rounded-[0.75rem] bg-gray-900 shadow-md">
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

        <div class="relative z-0 p-8 sm:p-12">
          <!-- Contact row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              :href="`mailto:${proposal.profileId.email}`"
              @click="isPreview ? $event.preventDefault() : null"
              class="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-[0.75rem] border border-white/10 transition-all group outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <div class="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <Mail class="w-4 h-4 text-gray-300 group-hover:text-white transition-colors" />
              </div>
              <div>
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">E-mail</p>
                <p class="text-xs font-bold text-gray-300 truncate">{{ proposal.profileId.email }}</p>
              </div>
            </a>
            <a
              v-if="profileWhatsapp"
              @click="isPreview ? $event.preventDefault() : null"
              :href="`https://wa.me/${profileWhatsapp.replace(/\D/g, '')}`"
              target="_blank"
              class="flex items-center gap-3 p-4 bg-white/5 hover:bg-green-500/10 rounded-[0.75rem] border border-white/10 hover:border-green-500/30 transition-all group outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              <div class="w-9 h-9 bg-white/10 group-hover:bg-green-500/20 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                <MessageCircle class="w-4 h-4 text-gray-300 group-hover:text-green-400 transition-colors" />
              </div>
              <div>
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">WhatsApp</p>
                <p class="text-xs font-bold text-gray-300">{{ profileWhatsapp }}</p>
              </div>
            </a>
          </div>

          
        </div>
      </section>

      <!-- ── TERMS LINK + FOOTER ─────────────────────────────────── -->
      <footer class="pt-4 pb-2 text-center space-y-6">
        <!-- Redes sociais -->
          <div v-if="socialLinks.length" class="mt-6 flex items-center justify-center gap-4">
            <a
              v-for="link in socialLinks"
              :key="link.key"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              :class="['w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 transition-all outline-none focus-visible:ring-2 focus-visible:ring-white', link.hoverClass]"
            >
              <component :is="link.icon" class="w-4 h-4" />
            </a>
          </div>
        <button
          @click="isTermsOpen = true"
          class="text-gray-600 hover:text-gray-800 text-[10px] font-bold uppercase tracking-[0.2em] underline decoration-dotted underline-offset-8 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#3147F6]"
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
            loading="lazy"
          />
          <p class="text-[9px] font-bold text-gray-300 uppercase tracking-[0.3em]">Powered by {{ systemInfo?.landingPage?.appName || 'Orcei' }}</p>
        </a>
      </footer>
    </main>

    <!-- ─── BARRA DE DECISÃO FIXA (todas as resoluções) ───────────────
         Antes existiam 2 barras divergentes: painel embutido só-desktop
         (sem sticky, exigia rolar até o fim) e barra fixa só-mobile (sem
         valor/total visível). Unificadas numa só: total + método + 3 ações
         sempre visíveis, em qualquer tela, sem precisar rolar pra decidir. -->
    <div
      v-if="!['draft', 'accepted', 'expired'].includes(proposal.status)"
      class="fixed bottom-0 inset-x-0 z-50 bg-gray-900/95 backdrop-blur-xl border-t border-white/10 pb-safe"
    >
      <div class="max-w-6xl mx-auto px-5 sm:px-8 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-8">
        <!-- Total display -->
        <div>
          <p class="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total do Investimento</p>
          <div class="flex items-baseline gap-3">
            <span v-if="selectedMethod === 'cash' && proposal.paymentConfig.cashDiscount > 0" class="text-xs font-bold text-gray-500 line-through decoration-red-500/50">
              R$ {{ (computedTotals.subtotal + (computedTotals.additional || 0) - (computedTotals.discount || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
            </span>
            <p class="text-2xl sm:text-3xl font-black text-white tracking-tight">
              R$ {{ finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
            </p>
          </div>
          <p class="mt-1 text-[10px] font-black text-[#6B84FF] uppercase tracking-widest">
            {{ selectedMethod === 'cash'
            ? (proposal.paymentConfig.cashDiscount > 0 ? `À Vista — ${proposal.paymentConfig.cashDiscount}% OFF` : 'À Vista')
            : (proposal.paymentConfig.installments > 1 ? `Cartão — ${proposal.paymentConfig.installments}x sem juros` : 'À Vista no Cartão') }}
          </p>
        </div>

        <!-- Action buttons -->
        <template v-if="!isPreview">
          <div class="flex items-center gap-2 sm:gap-3">
            <button
              @click="openActionModal('decline')"
              class="px-3 sm:px-7 py-3 sm:py-4 rounded-[0.75rem] text-xs font-black uppercase tracking-widest border-2 border-transparent text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              title="Recusar Proposta"
            >
              <ThumbsDown class="w-4 h-4 sm:hidden" />
              <span class="hidden sm:inline">Recusar Proposta</span>
            </button>
            <button
              @click="isChatModalOpen = true"
              class="relative px-3 sm:px-7 py-3 sm:py-4 rounded-[0.75rem] text-xs font-black uppercase tracking-widest border-2 border-white/10 text-gray-300 hover:bg-white/10 transition-all outline-none focus-visible:ring-2 focus-visible:ring-white"
              title="Chat com o Profissional"
            >
              <MessageCircle class="w-4 h-4 sm:hidden" />
              <span class="hidden sm:inline">Chat com o Profissional</span>
              <span
                v-if="proposal.unreadMessages > 0"
                class="absolute -top-2 -right-2 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-red-500 text-[9px] sm:text-[10px] font-black text-white ring-4 ring-gray-900 animate-pulse"
              >
                {{ proposal.unreadMessages }}
              </span>
            </button>
            <button
              @click="handleAccept"
              :disabled="isAccepting"
              class="flex-1 sm:flex-none px-5 sm:px-9 py-3 sm:py-4 bg-[#3147F6] hover:bg-blue-600 rounded-[0.75rem] text-xs font-black uppercase tracking-widest text-white shadow-md shadow-[#3147F6]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 outline-none focus-visible:ring-2 focus-visible:ring-[#3147F6] focus-visible:ring-offset-2"
            >
              <Loader2 v-if="isAccepting" class="w-4 h-4 animate-spin" />
              {{ isAccepting ? 'Processando...' : 'Aceitar Proposta' }}
            </button>
          </div>
        </template>
        <div v-else class="px-5 py-3 rounded-[0.75rem] text-xs font-black uppercase tracking-widest bg-white/5 text-gray-500 border border-white/10 text-center">
          Modo Visualização
        </div>
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
    <BaseDialog v-model:open="isChatModalOpen" title="Dúvidas e Alterações" size="lg">
      <div class="p-0 flex flex-col h-[500px] bg-[#E5DDD5] overflow-hidden rounded-b-2xl">
        <!-- Messages list -->
        <div 
          ref="chatMessagesRef"
          class="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-hide relative bg-[#dfe4ea]"
        >
          <div v-if="!groupedMessages?.length" class="text-center py-10 bg-white/60 backdrop-blur-sm rounded-3xl p-8 max-w-xs mx-auto mt-10">
            <MessageCircle class="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p class="text-[10px] font-bold text-gray-400 leading-relaxed">Nenhuma interação ainda.<br>Envie sua primeira dúvida abaixo.</p>
          </div>

          <div v-for="group in groupedMessages" :key="group.date" class="space-y-4">
            <!-- Date Separator -->
            <div class="flex justify-center my-6">
              <span class="px-4 py-1.5 bg-white/80 backdrop-blur-md rounded-xl text-[9px] font-bold text-gray-500 uppercase tracking-widest shadow-sm">
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
