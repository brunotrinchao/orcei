<script setup lang="ts">
import { Phone, MessageCircle, CheckCircle2, Download, ExternalLink, MapPin, X, Loader2, AlertCircle, PencilLine, ThumbsDown, Eye, FileText, CreditCard, Banknote, Clock, Shield, Mail } from 'lucide-vue-next'
import type { ProposalDTO } from '../../../types'

definePageMeta({
  layout: 'blank'
})

const { notify, confirm: confirmAlert } = useAlerts()
const route = useRoute()
const { t: token, preview } = route.query
const isPreview = computed(() => preview === 'true')
const { data: proposal, refresh, error } = useFetch<ProposalDTO>(`/api/proposals/public/${route.params.slug}`, {
  query: { t: token }
})

const isAccepting = ref(false)
const isTermsOpen = ref(false)
const isActionModalOpen = ref(false)
const actionType = ref<'decline' | 'request_changes' | null>(null)
const actionNotes = ref('')
const isSubmittingAction = ref(false)

const selectedMethod = ref<'cash' | 'credit_card'>('cash')

const finalTotal = computed(() => {
  if (!proposal.value) return 0
  const base = proposal.value.totals.subtotal + (proposal.value.totals.additional || 0) - (proposal.value.totals.discount || 0)
  if (selectedMethod.value === 'cash') {
    return base * (1 - (proposal.value.paymentConfig.cashDiscount / 100))
  }
  return base
})

async function handleAccept() {
  if (isPreview.value) return
  isAccepting.value = true
  try {
    await $fetch(`/api/proposals/public/accept`, {
      method: 'POST',
      body: { 
        slug: route.params.slug,
        token: token,
        paymentMethod: selectedMethod.value
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
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

const { data: systemInfo } = useFetch<any>('/api/system/status')

const statusMap: any = {
  draft: { label: 'Rascunho', class: 'bg-gray-100 text-gray-600' },
  created: { label: 'Enviado', class: 'bg-blue-100 text-blue-600' },
  pending: { label: 'Pendente', class: 'bg-orange-100 text-orange-600' },
  accepted: { label: 'Aceito', class: 'bg-green-100 text-green-600' },
  expired: { label: 'Expirado', class: 'bg-red-100 text-red-600' }
}
</script>

<template>
  <!-- Loading / Error states -->
  <div v-if="!proposal && !error" class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="flex flex-col items-center gap-4">
      <Loader2 class="w-10 h-10 text-[#3147F6] animate-spin" />
      <p class="text-sm font-bold text-gray-400 uppercase tracking-widest">Carregando proposta...</p>
    </div>
  </div>

  <div v-else-if="error" class="min-h-screen bg-gray-50 flex items-center justify-center px-6">
    <div class="text-center max-w-sm">
      <div class="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <AlertCircle class="w-10 h-10 text-red-400" />
      </div>
      <h1 class="text-2xl font-black text-gray-900 tracking-tight mb-2">Proposta não encontrada</h1>
      <p class="text-gray-500 font-medium">Este link pode ter expirado ou ser inválido.</p>
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
        <!-- Logo -->
        <img
          :src="useRuntimeConfig().public.appDocumentLogo || 'https://res.cloudinary.com/dpeaqezkb/image/upload/v1778873300/orcafacil/logo-default.png'"
          :alt="systemInfo?.landingPage?.appName || 'Orcei'"
          class="h-7 w-auto object-contain"
        />
        <!-- Code + Status -->
        <div class="flex items-center gap-3">
          <span class="hidden sm:block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
            #{{ proposal.code }}
          </span>
          <BaseBadge :variant="proposal.status === 'accepted' ? 'success' : proposal.status === 'expired' ? 'error' : 'info'">
            {{ statusMap[proposal.status]?.label }}
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
        <p class="text-gray-400 font-bold text-lg mb-12">
          Preparado para <span class="text-white">{{ proposal.client.name }}</span>
        </p>

        <!-- Stats row -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
          <!-- Valid until -->
          <div class="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <div class="flex items-center gap-2 mb-2">
              <Clock class="w-4 h-4 text-blue-400" />
              <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Válido até</span>
            </div>
            <p class="font-black text-white text-base leading-tight">{{ formatDate(proposal.expiresAt) }}</p>
          </div>

          <!-- Code -->
          <div class="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <div class="flex items-center gap-2 mb-2">
              <FileText class="w-4 h-4 text-blue-400" />
              <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Código</span>
            </div>
            <p class="font-black text-white text-base leading-tight">#{{ proposal.code }}</p>
          </div>

          <!-- Total -->
          <div class="col-span-2 sm:col-span-1 bg-[#3147F6] border border-blue-500/40 rounded-2xl p-5">
            <div class="flex items-center gap-2 mb-2">
              <Banknote class="w-4 h-4 text-blue-200" />
              <span class="text-[10px] font-black text-blue-200 uppercase tracking-widest">Valor Total</span>
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
      <section class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <!-- Section header -->
        <div class="px-8 py-6 border-b border-gray-100 flex items-center gap-3">
          <div class="w-8 h-8 bg-[#3147F6]/10 rounded-xl flex items-center justify-center">
            <FileText class="w-4 h-4 text-[#3147F6]" />
          </div>
          <h2 class="text-[10px] font-black text-gray-500 uppercase tracking-[0.25em]">Escopo do Projeto</h2>
        </div>

        <!-- Items list -->
        <div class="divide-y divide-gray-50">
          <div
            v-for="(item, idx) in proposal.items"
            :key="item._id"
            class="px-8 py-7 flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6"
          >
            <!-- Index bubble -->
            <div class="shrink-0 w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <span class="text-xs font-black text-gray-400">{{ String(idx + 1).padStart(2, '0') }}</span>
            </div>

            <!-- Description -->
            <div class="flex-1 min-w-0">
              <h3 class="font-black text-gray-900 text-base tracking-tight leading-snug mb-1">{{ item.name }}</h3>
              <p v-if="item.description" class="text-sm text-gray-500 font-medium leading-relaxed">{{ item.description }}</p>
              <!-- Unit price × qty -->
              <div class="mt-3 flex flex-wrap items-center gap-2">
                <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                  R$ {{ item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }} × {{ item.quantity }}
                </span>
              </div>
            </div>

            <!-- Subtotal -->
            <div class="shrink-0 text-right">
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Subtotal</p>
              <p class="font-black text-gray-900 text-lg">
                R$ {{ (item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Totals summary -->
        <div class="px-8 py-6 bg-gray-50 border-t border-gray-100 space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-sm font-bold text-gray-500">Subtotal</span>
            <span class="font-bold text-gray-700">R$ {{ proposal.totals.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
          </div>
          <div v-if="proposal.totals.discount" class="flex justify-between items-center">
            <span class="text-sm font-bold text-green-600">Desconto</span>
            <span class="font-bold text-green-600">− R$ {{ proposal.totals.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
          </div>
          <div v-if="proposal.totals.additional" class="flex justify-between items-center">
            <span class="text-sm font-bold text-orange-600">Acréscimo</span>
            <span class="font-bold text-orange-600">+ R$ {{ proposal.totals.additional.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
          </div>
          <div class="pt-3 border-t border-gray-200 flex justify-between items-baseline">
            <span class="text-sm font-black text-gray-900 uppercase tracking-widest">Total</span>
            <span class="text-2xl font-black text-[#3147F6]">
              R$ {{ finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
            </span>
          </div>
        </div>
      </section>

      <!-- ── PAYMENT OPTIONS ─────────────────────────────────────── -->
      <section v-if="!['accepted', 'expired'].includes(proposal.status)">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-8 h-8 bg-[#3147F6]/10 rounded-xl flex items-center justify-center">
            <CreditCard class="w-4 h-4 text-[#3147F6]" />
          </div>
          <h2 class="text-[10px] font-black text-gray-500 uppercase tracking-[0.25em]">Forma de Pagamento</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Cash option -->
          <button
            @click="selectedMethod = 'cash'"
            :class="[
              'relative text-left rounded-3xl border-2 p-7 transition-all duration-200 group',
              selectedMethod === 'cash'
                ? 'border-[#3147F6] bg-[#3147F6]/5 shadow-lg shadow-[#3147F6]/10'
                : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-md'
            ]"
          >
            <!-- Selected indicator -->
            <div class="absolute top-5 right-5">
              <div v-if="selectedMethod === 'cash'" class="w-6 h-6 bg-[#3147F6] rounded-full flex items-center justify-center shadow-md">
                <CheckCircle2 class="w-3.5 h-3.5 text-white" />
              </div>
              <div v-else class="w-6 h-6 border-2 border-gray-200 rounded-full group-hover:border-blue-300 transition-colors"></div>
            </div>

            <div class="mb-5">
              <div class="w-11 h-11 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
                <Banknote class="w-5 h-5 text-green-600" />
              </div>
              <h3 class="font-black text-gray-900 text-lg tracking-tight leading-snug">À Vista</h3>
              <p class="text-xs font-bold text-gray-400 mt-0.5">Pix / Transferência</p>
            </div>

            <p class="text-sm text-gray-500 font-medium leading-relaxed mb-6">
              Pagamento integral na aprovação com
              <strong class="text-green-600">{{ proposal.paymentConfig.cashDiscount }}% de desconto</strong>
              sobre o valor total.
            </p>

            <div class="pt-5 border-t border-gray-100">
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total com desconto</p>
              <p class="text-2xl font-black text-green-600">
                R$ {{ (proposal.totals.subtotal * (1 - proposal.paymentConfig.cashDiscount / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
              </p>
              <p class="text-[10px] font-bold text-green-500 mt-1 uppercase tracking-widest">
                Economize R$ {{ (proposal.totals.subtotal * proposal.paymentConfig.cashDiscount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
              </p>
            </div>
          </button>

          <!-- Credit card option -->
          <button
            @click="selectedMethod = 'credit_card'"
            :class="[
              'relative text-left rounded-3xl border-2 p-7 transition-all duration-200 group',
              selectedMethod === 'credit_card'
                ? 'border-[#3147F6] bg-[#3147F6]/5 shadow-lg shadow-[#3147F6]/10'
                : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-md'
            ]"
          >
            <!-- Selected indicator -->
            <div class="absolute top-5 right-5">
              <div v-if="selectedMethod === 'credit_card'" class="w-6 h-6 bg-[#3147F6] rounded-full flex items-center justify-center shadow-md">
                <CheckCircle2 class="w-3.5 h-3.5 text-white" />
              </div>
              <div v-else class="w-6 h-6 border-2 border-gray-200 rounded-full group-hover:border-blue-300 transition-colors"></div>
            </div>

            <div class="mb-5">
              <div class="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                <CreditCard class="w-5 h-5 text-[#3147F6]" />
              </div>
              <h3 class="font-black text-gray-900 text-lg tracking-tight leading-snug">Cartão de Crédito</h3>
              <p class="text-xs font-bold text-gray-400 mt-0.5">Parcelado sem juros</p>
            </div>

            <p class="text-sm text-gray-500 font-medium leading-relaxed mb-6">
              Parcele em até
              <strong class="text-[#3147F6]">{{ proposal.paymentConfig.installments }}x</strong>
              de
              <strong class="text-[#3147F6]">R$ {{ (proposal.totals.subtotal / proposal.paymentConfig.installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</strong>
              sem juros.
            </p>

            <div class="pt-5 border-t border-gray-100">
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total</p>
              <p class="text-2xl font-black text-[#3147F6]">
                R$ {{ proposal.totals.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
              </p>
              <p class="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                {{ proposal.paymentConfig.installments }}x de R$ {{ (proposal.totals.subtotal / proposal.paymentConfig.installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
              </p>
            </div>
          </button>
        </div>
      </section>

      <!-- ── CONTRACT (collapsible) ──────────────────────────────── -->
      <section v-if="proposal.contractText" class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <details class="group">
          <summary class="px-8 py-6 flex items-center justify-between cursor-pointer select-none list-none">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-[#3147F6]/10 rounded-xl flex items-center justify-center">
                <Shield class="w-4 h-4 text-[#3147F6]" />
              </div>
              <h2 class="text-[10px] font-black text-gray-500 uppercase tracking-[0.25em]">Contrato e Detalhes</h2>
            </div>
            <span class="text-xs font-black text-gray-400 uppercase tracking-widest group-open:hidden">Expandir</span>
            <span class="text-xs font-black text-gray-400 uppercase tracking-widest hidden group-open:block">Recolher</span>
          </summary>
          <div class="px-8 pb-8 border-t border-gray-50 pt-6 prose-contract">
            <div v-html="proposal.contractText"></div>
          </div>
        </details>
      </section>

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
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3">Total do Investimento</p>
              <p class="text-4xl sm:text-5xl font-black text-white tracking-tight">
                R$ {{ finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
              </p>
              <p v-if="!['accepted', 'expired'].includes(proposal.status)" class="mt-2 text-xs font-black text-[#6B84FF] uppercase tracking-widest">
                {{ selectedMethod === 'cash' ? `À Vista — ${proposal.paymentConfig.cashDiscount}% OFF` : `Cartão — ${proposal.paymentConfig.installments}x sem juros` }}
              </p>
            </div>

            <!-- Action buttons -->
            <div v-if="['pending', 'created'].includes(proposal.status)" class="hidden sm:flex items-center gap-4">
              <template v-if="!isPreview">
                <button
                  @click="openActionModal('request_changes')"
                  class="px-7 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border-2 border-white/10 text-gray-300 hover:bg-white/10 transition-all"
                >
                  Solicitar Alteração
                </button>
                <button
                  @click="handleAccept"
                  :disabled="isAccepting"
                  class="px-9 py-4 bg-[#3147F6] hover:bg-blue-600 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-[#3147F6]/30 transition-all flex items-center gap-2 disabled:opacity-60"
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
              :href="`mailto:${proposal.client.email}`"
              class="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group"
            >
              <div class="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <Mail class="w-4 h-4 text-gray-300 group-hover:text-white transition-colors" />
              </div>
              <div>
                <p class="text-[10px] font-black text-gray-500 uppercase tracking-widest">E-mail</p>
                <p class="text-xs font-bold text-gray-300 truncate">{{ proposal.client.email }}</p>
              </div>
            </a>
            <a
              v-if="proposal.client.phone"
              :href="`https://wa.me/${proposal.client.phone.replace(/\D/g, '')}`"
              target="_blank"
              class="flex items-center gap-3 p-4 bg-white/5 hover:bg-green-500/10 rounded-2xl border border-white/10 hover:border-green-500/30 transition-all group"
            >
              <div class="w-9 h-9 bg-white/10 group-hover:bg-green-500/20 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                <MessageCircle class="w-4 h-4 text-gray-300 group-hover:text-green-400 transition-colors" />
              </div>
              <div>
                <p class="text-[10px] font-black text-gray-500 uppercase tracking-widest">WhatsApp</p>
                <p class="text-xs font-bold text-gray-300">{{ proposal.client.phone }}</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      <!-- ── TERMS LINK + FOOTER ─────────────────────────────────── -->
      <footer class="pt-4 pb-2 text-center space-y-6">
        <button
          @click="isTermsOpen = true"
          class="text-gray-400 hover:text-gray-600 text-[10px] font-black uppercase tracking-[0.2em] underline decoration-dotted underline-offset-8 transition-colors"
        >
          Termos e Condições de Serviço
        </button>

        <div class="flex flex-col items-center gap-2 pt-4">
          <img
            :src="useRuntimeConfig().public.appDocumentLogo || 'https://res.cloudinary.com/dpeaqezkb/image/upload/v1778873300/orcafacil/logo-default.png'"
            :alt="systemInfo?.landingPage?.appName || 'Orcei'"
            class="h-5 w-auto object-contain opacity-30"
          />
          <p class="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">Powered by {{ systemInfo?.landingPage?.appName || 'Orcei' }}</p>
        </div>
      </footer>
    </main>

    <!-- ─── STICKY MOBILE BOTTOM BAR ──────────────────────────────── -->
    <div
      v-if="['pending', 'created'].includes(proposal.status) && !isPreview"
      class="fixed bottom-0 left-0 right-0 sm:hidden z-50 bg-white/90 backdrop-blur-xl border-t border-gray-100 px-5 pt-4 pb-safe"
    >
      <div class="flex gap-3 pb-4">
        <button
          @click="openActionModal('request_changes')"
          class="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
        >
          Alterar
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
        <div v-html="proposal.termsAndConditions"></div>
      </div>
      <template #footer>
        <BaseButton @click="isTermsOpen = false">Fechar</BaseButton>
      </template>
    </BaseDialog>

    <!-- Action Dialog (decline / request changes) -->
    <BaseDialog
      v-model:open="isActionModalOpen"
      :title="actionType === 'decline' ? 'Recusar Proposta' : 'Pedir Alteração'"
      size="md"
    >
      <div class="p-4 space-y-6">
        <div class="bg-blue-50 p-5 rounded-2xl flex gap-4">
          <AlertCircle class="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p class="text-sm text-blue-700 font-medium leading-relaxed">
            {{ actionType === 'decline'
              ? 'Poderia nos contar o motivo da recusa? Isso ajuda o profissional a melhorar os serviços.'
              : 'Descreva quais pontos você gostaria de ajustar nesta proposta.' }}
          </p>
        </div>

        <textarea
          v-model="actionNotes"
          rows="4"
          class="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#3147F6]/10 focus:border-[#3147F6] outline-none font-bold text-gray-900 transition-all resize-none"
          :placeholder="actionType === 'decline' ? 'Ex: Orçamento acima do esperado no momento...' : 'Ex: Gostaria de ajustar a quantidade do item X...'"
        ></textarea>

        <div class="flex gap-4">
          <BaseButton variant="secondary" class="flex-1" @click="isActionModalOpen = false">Cancelar</BaseButton>
          <BaseButton
            class="flex-1"
            :variant="actionType === 'decline' ? 'secondary' : 'primary'"
            @click="handleAction"
            :disabled="isSubmittingAction"
          >
            <Loader2 v-if="isSubmittingAction" class="w-4 h-4 animate-spin mr-2" />
            Confirmar
          </BaseButton>
        </div>
      </div>
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
