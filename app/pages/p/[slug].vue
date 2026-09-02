<script setup lang="ts">
import { usePublicProposalPage } from '~/composables/pages/usePublicProposalPage'

definePageMeta({
  layout: 'blank'
})

useHead({
  meta: [{ name: 'referrer', content: 'no-referrer' }]
})

const route = useRoute()
const config = useRuntimeConfig()

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

const {
  proposal,
  pending,
  error,
  refresh,
  isPreview,
  isAccepting,
  isAcceptConfirmModalOpen,
  isTermsOpen,
  isChatModalOpen,
  selectedMethod,
  selectedUpsells,
  actionType,
  actionNotes,
  isActionModalOpen,
  isSubmittingAction,
  messages,
  newMessage,
  isSendingMessage,
  groupedMessages,
  loadMessages,
  sendMessage,
  chatMessagesRef,
  formatMessageTime,
  computedTotals,
  finalTotal,
  openAcceptModal,
  handleAccept,
  openActionModal,
  handleAction,
  formatDate,
  profileWhatsapp,
  systemInfo,
  socialLinks,
  statusMap,
  isExpired,
  whatsappRenewMessage,
  whatsappRenewLink,
  Phone,
  MessageCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  MapPin,
  X,
  Loader2,
  AlertCircle,
  PencilLine,
  ThumbsDown,
  Eye,
  FileText,
  CreditCard,
  Banknote,
  Clock,
  Shield,
  Mail,
  Send,
  Check,
  CheckCheck,
  FileSignature,
} = usePublicProposalPage()
</script>

<template>
  <!-- Loading -->
  <div v-if="pending" class="min-h-screen bg-gray-50">
    <div class="max-w-6xl mx-auto px-5 sm:px-8 py-10 space-y-8">
      <div class="space-y-3">
        <BaseSkeleton width="40%" height="1.5rem" />
        <BaseSkeleton width="70%" height="2rem" />
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BaseSkeleton v-for="i in 3" :key="i" width="100%" height="8rem" borderRadius="0.75rem" />
      </div>
    </div>
  </div>

  <!-- Erro -->
  <div v-else-if="error || !proposal" class="min-h-screen bg-gray-50 flex items-center justify-center px-6">
    <div class="text-center space-y-4 max-w-md">
      <div class="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
        <AlertCircle class="w-8 h-8" />
      </div>
      <h1 class="text-xl font-black text-gray-900">Não foi possível carregar esta proposta</h1>
      <p class="text-sm text-gray-500">Verifique o link e tente novamente.</p>
      <BaseButton @click="refresh()">Tentar Novamente</BaseButton>
    </div>
  </div>

  <div v-else class="min-h-screen bg-gray-50">
    <!-- Preview Mode -->
    <div v-if="isPreview" class="bg-[#3147F6] text-white px-6 py-3 flex items-center justify-center gap-3">
      <Eye class="w-4 h-4 shrink-0" />
      <p class="text-xs font-bold">Modo Preview — Esta é a visão do seu cliente. Ações desabilitadas.</p>
    </div>

    <!-- Sticky Header -->
    <header class="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100/80">
      <div class="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
        <img
          :src="proposal.profileId?.brandConfig?.logoUrl || useRuntimeConfig().public.appDocumentLogo || 'https://res.cloudinary.com/dpeaqezkb/image/upload/v1778873300/orcafacil/logo-default.png'"
          :alt="proposal.profileId?.name || systemInfo?.landingPage?.appName || 'Orcei'"
          class="h-7 w-auto object-contain"
          loading="lazy"
        />
        <div class="flex items-center gap-3">
          <span class="hidden sm:block text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">
            {{ proposal.code }}
          </span>
          <BaseBadge :variant="isExpired ? 'error' : (statusMap[proposal.status]?.variant || 'info')">
            {{ isExpired ? 'Expirado' : (statusMap[proposal.status]?.label || proposal.status) }}
          </BaseBadge>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <section class="bg-white">
      <div class="max-w-6xl mx-auto px-5 sm:px-8 py-10 sm:py-12">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div class="min-w-0">
            <h1 class="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-gray-900">
              {{ proposal.title }}
            </h1>
            <p class="mt-2 text-sm text-gray-500 font-medium">
              Proposta preparada para <span class="font-bold text-gray-900">{{ proposal.client?.name }}</span>
            </p>
          </div>
          <div class="shrink-0 text-left sm:text-right">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Valor Total</span>
            <p class="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              R$ {{ finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
            </p>
            <p class="mt-1 text-xs font-black text-[#3147F6] uppercase tracking-widest">
              {{ selectedMethod === 'cash'
                ? (proposal.paymentConfig.cashDiscount > 0 ? `À Vista — ${proposal.paymentConfig.cashDiscount}% OFF` : 'À Vista')
                : (proposal.paymentConfig.installments > 1 ? `Cartão — ${proposal.paymentConfig.installments}x sem juros` : 'À Vista no Cartão') }}
            </p>
          </div>
        </div>

        <!-- Cards info -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div class="col-span-2 lg:col-span-1 rounded-[0.75rem] border border-gray-100 bg-gray-50/60 p-5">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Cliente</span>
            <p class="mt-1 font-black text-gray-900 text-sm leading-tight">{{ proposal.client?.name }}</p>
            <dl class="mt-3 space-y-1.5 text-[11px] font-medium text-gray-500">
              <div class="flex justify-between gap-2">
                <dt class="text-gray-400 uppercase tracking-wider">Emissão</dt>
                <dd class="font-bold text-gray-700">{{ formatDate(proposal.createdAt) }}</dd>
              </div>
              <div class="flex justify-between gap-2">
                <dt class="text-gray-400 uppercase tracking-wider">Válido até</dt>
                <dd class="font-bold text-gray-700">{{ proposal.expiresAt ? formatDate(proposal.expiresAt) : '—' }}</dd>
              </div>
              <div class="flex justify-between gap-2" v-if="proposal.executionDate">
                <dt class="text-gray-400 uppercase tracking-wider">Início</dt>
                <dd class="font-bold text-gray-700">{{ formatDate(proposal.executionDate) }}</dd>
              </div>
            </dl>
          </div>

          <div class="flex flex-col justify-between rounded-[0.75rem] border border-gray-100 bg-gray-50/60 p-5">
            <div>
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Profissional</span>
              <p class="mt-1 font-black text-gray-900 text-sm leading-tight">{{ proposal.profileId?.name }}</p>
            </div>
            <div class="mt-3 space-y-1.5 text-[11px] font-medium text-gray-500">
              <a v-if="proposal.profileId?.email" :href="`mailto:${proposal.profileId.email}`"
                class="flex items-center gap-1.5 hover:text-gray-900 transition-colors">
                <Mail class="w-3.5 h-3.5 text-gray-400" /> {{ proposal.profileId.email }}
              </a>
              <a v-if="profileWhatsapp" :href="`https://wa.me/${profileWhatsapp.replace(/\D/g, '')}`" target="_blank"
                rel="noopener noreferrer" class="flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
                <img src="/images/icons/whatsapp-svg.svg" class="w-3.5 h-3.5" alt="WhatsApp" />
                {{ profileWhatsapp }}
              </a>
            </div>
          </div>

          <!-- Status -->
          <div class="flex flex-col justify-between rounded-[0.75rem] border border-gray-100 bg-gray-50/60 p-5">
            <div>
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Status</span>
              <p class="mt-1 font-black text-gray-900 text-sm leading-tight">{{ statusMap[proposal.status]?.label || proposal.status }}</p>
            </div>
            <BaseBadge light class="mt-3 self-start"
              :variant="isExpired ? 'error' : (statusMap[proposal.status]?.variant || 'info')">
              {{ isExpired ? 'Expirado' : (statusMap[proposal.status]?.label || proposal.status) }}
            </BaseBadge>
          </div>

          <!-- Redes sociais -->
          <div v-if="socialLinks.length" class="rounded-[0.75rem] border border-gray-100 bg-gray-50/60 p-5">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Redes Sociais</span>
            <div class="mt-3 flex items-center gap-2">
              <a v-for="link in socialLinks" :key="link.key" :href="link.url" target="_blank" rel="noopener noreferrer"
                :class="['w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 transition-all hover:border-gray-300 hover:text-gray-600', link.hoverClass]">
                <component :is="link.icon" class="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <!-- Banner assinatura (somente após aceite ou já assinada) -->
        <div
          v-if="proposal.signature && proposal.signature.status !== 'none' && !isExpired && (proposal.status === 'accepted' || proposal.signature.status === 'signed')"
          class="mt-6 p-4 rounded-[0.75rem] border transition-all"
          :class="proposal.signature.status === 'signed'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : 'bg-indigo-50 border-indigo-200 text-indigo-950'"
        >
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div :class="proposal.signature.status === 'signed' ? 'bg-emerald-600' : 'bg-indigo-600'"
                class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 v-if="proposal.signature.status === 'signed'" class="w-5 h-5 text-white" />
                <FileSignature v-else class="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 class="font-bold text-sm tracking-tight">
                  {{ proposal.signature.status === 'signed'
                    ? 'Proposta Assinada Digitalmente'
                    : 'Agora falta só a sua assinatura' }}
                </h4>
                <p v-if="proposal.signature.status === 'signed'" class="text-xs text-gray-600 mt-0.5">
                  Este documento possui validade jurídica respaldada pela MP 2.200-2/2001 e Lei 14.063/2020.
                </p>
                <p v-else class="text-xs text-gray-600 mt-0.5 leading-relaxed">
                  Enviamos o link de assinatura para <strong class="text-gray-900">{{ proposal.client?.email || 'seu e-mail' }}</strong>.
                  <span class="block">Verifique sua caixa de entrada (e a pasta de spam) e clique no link para assinar digitalmente.</span>
                </p>
              </div>
            </div>

            <a
              v-if="proposal.signature.status === 'pending' && proposal.signature.signingUrl"
              :href="proposal.signature.signingUrl"
              target="_blank"
              class="inline-flex items-center justify-center px-4 py-2 rounded-[0.5rem] bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shrink-0 w-full sm:w-auto cursor-pointer">
              <FileSignature class="w-4 h-4 mr-2" /> Assinar Proposta Agora
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <main class="max-w-6xl mx-auto px-5 sm:px-8 py-10 space-y-10">
      <!-- Expiração -->
      <div v-if="isExpired"
        class="rounded-[0.75rem] border border-red-200 bg-red-50 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-red-100 text-red-500 rounded-xl flex items-center justify-center shrink-0">
            <Clock class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-black text-red-700 text-sm">Esta proposta expirou</h3>
            <p class="text-xs font-medium text-red-500 mt-0.5">
              Venceu em <strong>{{ formatDate(proposal.expiresAt) }}</strong>. As ações foram desativadas.
            </p>
          </div>
        </div>
      </div>

      <!-- Itens -->
      <ProposalClientScope
        :items="proposal.items"
        :upsell-items="proposal.upsellItems"
        v-model:selected-upsells="selectedUpsells"
        :totals="computedTotals"
        :final-total="finalTotal"
        :is-accepted="proposal.status === 'accepted' || isExpired"
      />

      <!-- Pagamento -->
      <ProposalClientPayment
        v-if="!['accepted', 'expired'].includes(proposal.status) && !isExpired"
        v-model="selectedMethod"
        :payment-config="proposal.paymentConfig"
        :totals="computedTotals"
      />

      <!-- Contrato -->
      <ProposalClientContract v-if="proposal.contractText && !isExpired" :contract-text="proposal.contractText" />

      <!-- Status final / aceito -->
      <section v-if="proposal.status === 'accepted'"
        class="rounded-[0.75rem] border overflow-hidden"
        :class="proposal.signature?.status === 'signed' ? 'border-emerald-200 bg-emerald-50' : 'border-indigo-200 bg-indigo-50'"
      >
        <div class="p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-4">
            <div :class="proposal.signature?.status === 'signed' ? 'bg-emerald-600' : 'bg-indigo-600'"
              class="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle2 v-if="proposal.signature?.status === 'signed'" class="w-7 h-7 text-white" />
              <FileSignature v-else class="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 class="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {{ proposal.signature?.status === 'signed' ? 'Proposta Aceita & Assinada' : 'Proposta Aceita' }}
              </h2>
              <p class="text-sm font-medium text-gray-500 mt-1">
                {{ proposal.signature?.status === 'signed'
                  ? 'Documento juridicamente válido. Obrigado pela confiança!'
                  : 'Aguarde o link de assinatura por e-mail para concluir.' }}
              </p>
            </div>
          </div>
          <a v-if="proposal.signature?.signedFileUrl" :href="proposal.signature.signedFileUrl" target="_blank"
            class="inline-flex items-center justify-center px-5 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-[0.75rem] text-xs font-black uppercase tracking-widest text-white transition-all cursor-pointer shrink-0">
            <Download class="w-4 h-4 mr-2" /> Baixar Contrato Assinado
          </a>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="pt-4 pb-2 text-center space-y-6">
      <button @click="isTermsOpen = true"
        class="text-gray-500 hover:text-gray-800 text-[10px] font-bold uppercase tracking-[0.2em] underline decoration-dotted underline-offset-8 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#3147F6] cursor-pointer">
        Termos e Condições de Serviço
      </button>
      <a href="https://orceifacil.com.br?utm_source=proposal&utm_medium=powered_by&utm_campaign=viral_loop"
        target="_blank" rel="noopener noreferrer" class="flex flex-col items-center gap-2 pt-4 hover:opacity-80 transition-opacity">
        <img :src="useRuntimeConfig().public.appDocumentLogo || 'https://res.cloudinary.com/dpeaqezkb/image/upload/v1778873300/orcafacil/logo-default.png'"
          :alt="systemInfo?.landingPage?.appName || 'Orcei'" class="h-5 w-auto object-contain opacity-30" loading="lazy" />
        <p class="text-[9px] font-bold text-gray-300 uppercase tracking-[0.3em]">Powered by {{ systemInfo?.landingPage?.appName || 'Orcei' }}</p>
      </a>
    </footer>

    <!-- Barra de decisão fixa -->
    <div v-if="!['draft','expired'].includes(proposal.status)"
      class="fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 pb-safe shadow-[0_-4px_30px_rgba(0,0,0,0.06)]">
      <div class="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
        <!-- Total -->
        <div class="min-w-0">
          <p class="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Total do Investimento</p>
          <div class="flex items-baseline gap-2">
            <span v-if="selectedMethod === 'cash' && proposal.paymentConfig.cashDiscount > 0"
              class="text-xs font-bold text-gray-400 line-through">
              R$ {{ (computedTotals.subtotal + (computedTotals.additional || 0) - (computedTotals.discount || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
            </span>
            <p class="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              R$ {{ finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
            </p>
          </div>
        </div>

        <!-- Ações -->
        <div class="flex items-center gap-2 sm:gap-3 shrink-0">
          <template v-if="isPreview">
            <div class="px-4 py-3 rounded-[0.75rem] text-xs font-black uppercase tracking-widest bg-gray-100 text-gray-500">
              Modo Visualização
            </div>
          </template>

          <template v-else-if="isExpired">
            <a v-if="profileWhatsapp" :href="whatsappRenewLink" target="_blank"
              class="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-[0.75rem] text-xs font-black uppercase tracking-widest text-white transition-all inline-flex items-center gap-2 cursor-pointer">
              <MessageCircle class="w-4 h-4" /> Solicitar Renovação
            </a>
          </template>

          <template v-else-if="proposal.status === 'accepted' && proposal.signature?.status !== 'signed'">
            <a v-if="proposal.signature?.signingUrl" :href="proposal.signature.signingUrl" target="_blank"
              class="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-[0.75rem] text-xs font-black uppercase tracking-widest text-white transition-all inline-flex items-center gap-2 cursor-pointer">
              <FileSignature class="w-4 h-4" /> Assinar Proposta Agora
            </a>
            <button v-else @click="refresh()"
              class="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-[0.75rem] text-xs font-black uppercase tracking-widest text-white transition-all inline-flex items-center gap-2 cursor-pointer">
              <FileSignature class="w-4 h-4" /> Assinar Proposta Agora
            </button>
          </template>

          <template v-else-if="proposal.status === 'accepted' && proposal.signature?.status === 'signed'">
            <a v-if="proposal.signature?.signedFileUrl" :href="proposal.signature.signedFileUrl" target="_blank"
              class="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-[0.75rem] text-xs font-black uppercase tracking-widest text-white transition-all inline-flex items-center gap-2 cursor-pointer">
              <Download class="w-4 h-4" /> Baixar Contrato Assinado
            </a>
          </template>

          <template v-else>
            <button @click="openActionModal('decline')"
              class="px-3 sm:px-5 py-3 rounded-[0.75rem] text-xs font-black uppercase tracking-widest border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all cursor-pointer"
              title="Recusar Proposta">
              <ThumbsDown class="w-4 h-4 sm:hidden" />
              <span class="hidden sm:inline">Recusar</span>
            </button>
            <button @click="isChatModalOpen = true"
              class="relative px-3 sm:px-5 py-3 rounded-[0.75rem] text-xs font-black uppercase tracking-widest border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
              title="Chat com o Profissional">
              <MessageCircle class="w-4 h-4 sm:hidden" />
              <span class="hidden sm:inline">Chat</span>
              <span v-if="proposal.unreadMessages > 0"
                class="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-4 ring-white dark:ring-gray-900">
                {{ proposal.unreadMessages }}
              </span>
            </button>
            <button @click="openAcceptModal" :disabled="isAccepting"
              class="px-5 sm:px-8 py-3 bg-[#3147F6] hover:bg-blue-600 rounded-[0.75rem] text-xs font-black uppercase tracking-widest text-white shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer">
              <Loader2 v-if="isAccepting" class="w-4 h-4 animate-spin" />
              {{ isAccepting ? 'Processando...' : 'Aceitar Proposta' }}
            </button>
          </template>
        </div>
      </div>
    </div>

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
        <!-- Messages -->
        <div ref="chatMessagesRef" class="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-hide relative bg-[#dfe4ea]">
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

            <div v-for="msg in group.items" :key="msg._id"
              :class="['flex flex-col max-w-[85%] relative', msg.sender === 'client' ? 'ml-auto items-end' : 'items-start']">
              <div :class="[
                'px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed shadow-sm min-w-[80px]',
                msg.sender === 'client' ? 'bg-[#DCF8C6] text-gray-800 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'
              ]">
                {{ msg.text }}
                <div class="flex items-center justify-end gap-1 mt-1">
                  <span class="text-[9px] text-gray-400">{{ formatMessageTime(msg.createdAt) }}</span>
                  <CheckCheck v-if="msg.read" class="w-3 h-3 text-sky-500" />
                  <Check v-else class="w-3 h-3 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Input -->
        <div class="p-3 bg-[#F0F0F0] border-t border-gray-200 flex items-center gap-2">
          <input
            v-model="newMessage"
            @keyup.enter="sendMessage"
            placeholder="Escreva sua mensagem..."
            class="flex-1 px-5 py-3 rounded-2xl bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#3147F6]/30 border border-gray-200"
          />
          <button @click="sendMessage" :disabled="isSendingMessage || !newMessage.trim()"
            class="w-12 h-12 rounded-2xl bg-[#3147F6] hover:bg-blue-600 text-white flex items-center justify-center shadow-md transition-all disabled:opacity-50 cursor-pointer">
            <Loader2 v-if="isSendingMessage" class="w-5 h-5 animate-spin" />
            <Send v-else class="w-5 h-5" />
          </button>
        </div>
      </div>
    </BaseDialog>

    <!-- Action/Decline Dialog -->
    <BaseDialog v-model:open="isActionModalOpen" :title="actionType === 'decline' ? 'Recusar Proposta' : 'Solicitar Alterações'" size="md">
      <div class="space-y-4 p-2">
        <div class="flex gap-2">
          <button @click="actionType = 'decline'"
            :class="actionType === 'decline' ? 'bg-red-50 border-red-200 text-red-600' : 'border-gray-200 text-gray-500'"
            class="flex-1 px-4 py-3 rounded-[0.75rem] border text-xs font-black uppercase tracking-wider transition-all cursor-pointer">
            <ThumbsDown class="w-4 h-4 mr-2 inline" /> Recusar
          </button>
          <button @click="actionType = 'request_changes'"
            :class="actionType === 'request_changes' ? 'bg-amber-50 border-amber-200 text-amber-600' : 'border-gray-200 text-gray-500'"
            class="flex-1 px-4 py-3 rounded-[0.75rem] border text-xs font-black uppercase tracking-wider transition-all cursor-pointer">
            <PencilLine class="w-4 h-4 mr-2 inline" /> Solicitar Alterações
          </button>
        </div>
        <textarea v-model="actionNotes" rows="4" :placeholder="actionType === 'decline' ? 'Conte o motivo da recusa (opcional)...' : 'Descreva o que precisa mudar...'"
          class="w-full px-4 py-3 rounded-[0.75rem] border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#3147F6]/30" />
      </div>
      <template #footer>
        <BaseButton variant="outline" @click="isActionModalOpen = false">Cancelar</BaseButton>
        <BaseButton :variant="actionType === 'decline' ? 'danger' : 'solid'" :loading="isSubmittingAction" :disabled="!actionNotes.trim()" @click="handleAction">
          {{ actionType === 'decline' ? 'Confirmar Recusa' : 'Enviar Solicitação' }}
        </BaseButton>
      </template>
    </BaseDialog>

    <!-- Confirm Accept & Sign Dialog -->
    <BaseDialog v-model:open="isAcceptConfirmModalOpen" title="Confirmar Aceite" size="md">
      <div class="space-y-4 p-2">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <CheckCircle2 class="w-6 h-6" />
          </div>
          <div>
            <h3 class="font-black text-gray-900">Deseja aceitar esta proposta?</h3>
            <p class="text-xs text-gray-500 mt-0.5">
              Após o aceite, enviaremos o link de assinatura digital para <strong class="text-gray-700">{{ proposal.client?.email || 'seu e-mail' }}</strong>.
            </p>
          </div>
        </div>

        <!-- Resumo do pagamento -->
        <div class="rounded-[0.75rem] border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div class="divide-y divide-gray-100 dark:divide-gray-800">
            <div class="flex items-center justify-between px-4 py-2.5">
              <span class="text-xs font-medium text-gray-500">Subtotal</span>
              <span class="text-sm font-semibold text-gray-900">R$ {{ (computedTotals.subtotal + (computedTotals.additional || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
            </div>
            <div v-if="(computedTotals.discount || 0) > 0" class="flex items-center justify-between px-4 py-2.5">
              <span class="text-xs font-medium text-gray-500">
                Desconto
                <span class="text-emerald-600 font-semibold">
                  ({{ selectedMethod === 'cash' && proposal.paymentConfig.cashDiscount > 0 ? `${proposal.paymentConfig.cashDiscount}% à vista` : 'aplicado' }})
                </span>
              </span>
              <span class="text-sm font-semibold text-emerald-600">- R$ {{ computedTotals.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
            </div>
            <div class="flex items-center justify-between px-4 py-2.5">
              <span class="text-xs font-medium text-gray-500">Forma de pagamento</span>
              <span class="text-sm font-semibold text-gray-900">
                {{ selectedMethod === 'cash'
                  ? (proposal.paymentConfig.cashDiscount > 0 ? `À vista com ${proposal.paymentConfig.cashDiscount}% OFF` : 'À vista')
                  : (proposal.paymentConfig.installments > 1 ? `Cartão em até ${proposal.paymentConfig.installments}x sem juros` : 'Cartão à vista') }}
              </span>
            </div>
          </div>
          <div class="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-800">
            <span class="text-sm font-bold text-gray-700">Total a pagar</span>
            <span class="text-lg font-black text-gray-900">R$ {{ finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="outline" @click="isAcceptConfirmModalOpen = false">Cancelar</BaseButton>
        <BaseButton :loading="isAccepting" @click="handleAccept()">
          <CheckCircle2 class="w-4 h-4 mr-2" /> Confirmar Aceite
        </BaseButton>
      </template>
    </BaseDialog>
  </div>
</template>