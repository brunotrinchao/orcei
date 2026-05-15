<script setup lang="ts">
import { Phone, MessageCircle, CheckCircle2, Download, ExternalLink, MapPin, X, Loader2, AlertCircle, PencilLine, ThumbsDown } from 'lucide-vue-next'
import type { ProposalDTO } from '../../../types'

definePageMeta({
  layout: 'blank'
})

const { notify, confirm: confirmAlert } = useAlerts()
const route = useRoute()
const { t: token } = route.query
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

watchEffect(() => {
  if (proposal.value) {
    selectedMethod.value = proposal.value.paymentConfig?.method || 'cash'
  }
})

const finalTotal = computed(() => {
  if (!proposal.value) return 0
  const subtotal = proposal.value.totals.subtotal
  const baseTotal = subtotal + (proposal.value.totals.additional || 0) - (proposal.value.totals.discount || 0)
  
  if (selectedMethod.value === 'cash') {
    return baseTotal * (1 - (proposal.value.paymentConfig.cashDiscount / 100))
  }
  return baseTotal
})

const profile = computed(() => (proposal.value?.profileId as any))

async function handleAccept() {
  confirmAlert({
    title: 'Aceitar Orçamento',
    description: 'Ao aceitar este orçamento, você concorda com os termos e condições. Deseja prosseguir?',
    onConfirm: async () => {
      isAccepting.value = true
      try {
        await $fetch('/api/proposals/public/accept', {
          method: 'POST',
          body: { 
            slug: route.params.slug,
            paymentMethod: selectedMethod.value
          }
        })
        await refresh()
        notify('Sucesso', 'Orçamento aceito com sucesso! O profissional será notificado.')
      } catch (e: any) {
        notify('Erro', e.data?.statusMessage || 'Erro ao aceitar orçamento')
      } finally {
        isAccepting.value = false
      }
    }
  })
}

async function handleAction() {
  if (!actionType.value) return
  
  isSubmittingAction.value = true
  try {
    await $fetch('/api/proposals/public/action', {
      method: 'POST',
      body: { 
        slug: route.params.slug,
        action: actionType.value,
        notes: actionNotes.value
      }
    })
    await refresh()
    isActionModalOpen.value = false
    notify('Sucesso', actionType.value === 'decline' ? 'Orçamento recusado.' : 'Solicitação de alteração enviada!')
  } catch (e: any) {
    notify('Erro', 'Erro ao processar ação')
  } finally {
    isSubmittingAction.value = false
  }
}

const openActionModal = (type: 'decline' | 'request_changes') => {
  actionType.value = type
  actionNotes.value = ''
  isActionModalOpen.value = true
}

const openWhatsApp = () => {
  if (!profile.value?.contact?.phones?.[0]?.number) return
  const phone = profile.value.contact.phones[0].number.replace(/\D/g, '')
  const text = encodeURIComponent(`Olá, estou visualizando o orçamento "${proposal.value?.title}" e gostaria de tirar algumas dúvidas.`)
  window.open(`https://wa.me/55${phone}?text=${text}`, '_blank')
}
</script>

<template>
  <div v-if="error" class="min-h-screen flex items-center justify-center bg-gray-50 p-6">
    <div class="text-center max-w-md">
      <div class="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <X class="w-10 h-10" />
      </div>
      <h1 class="text-2xl font-black text-gray-900 uppercase tracking-tight">Link Expirado ou Inválido</h1>
      <p class="text-gray-500 mt-2 font-medium">Este link de orçamento não está mais disponível ou o token de segurança é inválido.</p>
      <BaseButton to="/" variant="secondary" class="mt-8">Ir para Home</BaseButton>
    </div>
  </div>

  <div v-else-if="proposal" class="min-h-screen bg-gray-50 pb-20">
    <!-- Header Premium -->
    <header 
      class="text-white py-12 px-6 sm:py-20 sm:px-10 transition-colors"
      :class="{
        'bg-blue-600': proposal.status === 'pending' || proposal.status === 'created',
        'bg-green-600': proposal.status === 'accepted',
        'bg-gray-600': proposal.status === 'expired'
      }"
    >
      <div class="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <div class="flex items-center gap-3 mb-4">
            <span class="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/30">
              #{{ proposal.code || 'ORC' }}
            </span>
          </div>
          <h1 class="text-3xl sm:text-4xl font-bold">{{ proposal.title }}</h1>
          <p class="mt-2 opacity-90 text-sm sm:text-base">Orçamento preparado para <span class="font-bold">{{ proposal.client.name }}</span></p>
        </div>
        <div class="text-left sm:text-right">
          <p class="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">Status</p>
          <p class="text-xl sm:text-2xl font-bold">
            {{ proposal.status === 'accepted' ? 'Aceito' : (proposal.status === 'expired' ? 'Recusado' : 'Pendente') }}
          </p>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto -mt-10 px-4">
      <!-- Info Freelancer -->
      <div class="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div class="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
          <div v-if="profile?.brandConfig?.logoUrl" class="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-50 bg-white">
            <img :src="profile.brandConfig.logoUrl" class="w-full h-full object-contain">
          </div>
          <div v-else class="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl uppercase">
            {{ profile?.name?.charAt(0) }}
          </div>
          <div>
            <p class="text-lg font-bold text-gray-900">{{ profile?.name }}</p>
            <p class="text-sm text-gray-500">{{ profile?.email }}</p>
            <p v-if="profile?.address?.street" class="text-xs text-gray-400 mt-1">
              {{ profile.address.street }}, {{ profile.address.number || '' }} - {{ profile.address.neighborhood || '' }}<br>
              {{ profile.address.city || '' }}/{{ profile.address.state || '' }} - {{ profile.address.zip || '' }}
            </p>
          </div>
        </div>
        <div class="flex flex-col items-center sm:items-end gap-3">
          <button 
            v-if="profile?.contact?.phones?.[0]"
            @click="openWhatsApp"
            class="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-green-100"
          >
            <MessageCircle class="w-4 h-4" /> Falar no WhatsApp
          </button>
          <div class="text-center sm:text-right">
            <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Emitido em</p>
            <p class="text-sm font-medium text-gray-700">{{ new Date(proposal.createdAt).toLocaleDateString('pt-BR') }}</p>
          </div>
        </div>
      </div>

      <!-- Itens do Orçamento -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div class="p-6 sm:p-8 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
          <h2 class="text-xl font-bold text-gray-900">Escopo dos Serviços</h2>
          <div class="flex gap-2">
            <a :href="`/api/proposals/public/${route.params.slug}/pdf`" target="_blank" class="p-2 text-gray-400 hover:text-gray-900 transition-colors">
              <Download class="w-5 h-5" />
            </a>
          </div>
        </div>
        <div class="divide-y divide-gray-50">
          <div v-for="item in proposal.items" :key="item.name" class="p-6 sm:p-8 hover:bg-gray-50/20 transition-colors">
            <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div class="flex-1">
                <h3 class="font-bold text-gray-900 text-lg mb-2">{{ item.name }}</h3>
                <p class="text-gray-600 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">{{ item.description }}</p>
              </div>
              <div class="text-left sm:text-right shrink-0 bg-blue-50 sm:bg-transparent p-3 sm:p-0 rounded-xl w-full sm:w-auto">
                <p class="text-xs font-bold text-blue-600 sm:text-gray-400 uppercase tracking-widest mb-1">Investimento</p>
                <p class="text-xl font-black text-blue-700 sm:text-gray-900">R$ {{ (item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
                <p v-if="item.quantity > 1" class="text-xs text-gray-500 mt-1">{{ item.quantity }}x R$ {{ item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Ajustes Financeiros Exibidos -->
        <div v-if="proposal.totals.additional || proposal.totals.discount" class="p-6 sm:p-8 bg-gray-50/30 border-t border-gray-50 space-y-2">
          <div v-if="proposal.totals.additional" class="flex justify-between text-sm">
            <span class="font-bold text-gray-500 uppercase tracking-widest text-[10px]">Taxas Adicionais</span>
            <span class="font-black text-gray-900">+ R$ {{ proposal.totals.additional.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
          </div>
          <div v-if="proposal.totals.discount" class="flex justify-between text-sm">
            <span class="font-bold text-gray-500 uppercase tracking-widest text-[10px]">Desconto Especial</span>
            <span class="font-black text-emerald-600">- R$ {{ proposal.totals.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
          </div>
        </div>
      </div>

      <!-- Escolha da Forma de Pagamento (Client Choice) -->
      <div v-if="!['accepted', 'expired'].includes(proposal.status)" class="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 p-6 sm:p-8">
        <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <CreditCard class="w-6 h-6 text-blue-600" />
          Escolha a Forma de Pagamento
        </h2>
        
        <div class="flex flex-col sm:flex-row gap-4">
          <button 
            @click="selectedMethod = 'cash'"
            :class="{
              'flex-1 p-6 rounded-2xl border-2 transition-all text-left group': true,
              'border-blue-600 bg-blue-50/50 ring-4 ring-blue-50': selectedMethod === 'cash',
              'border-gray-100 hover:border-blue-200 bg-white': selectedMethod !== 'cash'
            }"
          >
            <div class="flex justify-between items-center mb-3">
              <span class="font-bold text-gray-900 text-lg">À Vista</span>
              <div v-if="selectedMethod === 'cash'" class="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg text-white">
                <CheckCircle2 class="w-4 h-4" />
              </div>
              <div v-else class="w-6 h-6 border-2 border-gray-200 rounded-full"></div>
            </div>
            <p class="text-sm text-gray-600 leading-relaxed">
              {{ proposal.paymentConfig.cashDiscount > 0 ? `Economize ${proposal.paymentConfig.cashDiscount}% pagando via PIX ou Boleto.` : 'Pagamento integral no ato da contratação.' }}
            </p>
            <div class="mt-4 pt-4 border-t border-gray-100 flex items-baseline gap-2">
              <span class="text-xs font-bold text-gray-400 uppercase">Total</span>
              <span class="text-xl font-black text-blue-700">R$ {{ (finalTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
            </div>
          </button>

          <button 
            @click="selectedMethod = 'credit_card'"
            :class="{
              'flex-1 p-6 rounded-2xl border-2 transition-all text-left group': true,
              'border-blue-600 bg-blue-50/50 ring-4 ring-blue-50': selectedMethod === 'credit_card',
              'border-gray-100 hover:border-blue-200 bg-white': selectedMethod !== 'credit_card'
            }"
          >
            <div class="flex justify-between items-center mb-3">
              <span class="font-bold text-gray-900 text-lg">Cartão de Crédito</span>
              <div v-if="selectedMethod === 'credit_card'" class="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg text-white">
                <CheckCircle2 class="w-4 h-4" />
              </div>
              <div v-else class="w-6 h-6 border-2 border-gray-200 rounded-full"></div>
            </div>
            <p class="text-sm text-gray-600 leading-relaxed">
              Parcele em até {{ proposal.paymentConfig.installments }}x de R$ {{ (proposal.totals.subtotal / proposal.paymentConfig.installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }} sem juros.
            </p>
            <div class="mt-4 pt-4 border-t border-gray-100 flex items-baseline gap-2">
              <span class="text-xs font-bold text-gray-400 uppercase">Total</span>
              <span class="text-xl font-black text-blue-700">R$ {{ proposal.totals.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Contrato -->
      <div v-if="proposal.contractText" class="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
        <div class="p-6 sm:p-8 border-b border-gray-50 bg-gray-50/50">
          <h2 class="text-xl font-bold text-gray-900">Contrato e Detalhes</h2>
        </div>
        <div class="p-6 sm:p-8 prose prose-blue max-w-none">
          <div v-html="proposal.contractText"></div>
        </div>
      </div>

      <!-- Footer de Decisão -->
      <div class="bg-gray-900 text-white p-8 sm:p-12 rounded-3xl shadow-2xl flex flex-col sm:flex-row justify-between items-center gap-8 overflow-hidden relative">
        <div v-if="proposal.status === 'accepted'" class="absolute inset-0 bg-green-600 flex items-center justify-center gap-4 animate-in fade-in zoom-in duration-500">
          <CheckCircle2 class="w-12 h-12" />
          <h2 class="text-3xl font-black uppercase tracking-tight">Orçamento Aceito</h2>
        </div>
        
        <div class="text-center sm:text-left relative z-10">
          <p class="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Total do Investimento</p>
          <p class="text-4xl sm:text-5xl font-black">R$ {{ finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
          <p v-if="!['accepted', 'expired'].includes(proposal.status)" class="text-sm font-bold text-blue-400 mt-2 uppercase tracking-tight">
            {{ selectedMethod === 'cash' ? 'À Vista' : 'Cartão de Crédito' }} 
            — 
            <span v-if="selectedMethod === 'cash'">
              {{ proposal.paymentConfig.cashDiscount > 0 ? `${proposal.paymentConfig.cashDiscount}% de desconto` : 'Preço integral' }}
            </span>
            <span v-else>
              {{ proposal.paymentConfig.installments }}x de R$ {{ (proposal.totals.subtotal / proposal.paymentConfig.installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
            </span>
          </p>
        </div>
        
        <div v-if="!['accepted', 'expired'].includes(proposal.status)" class="flex flex-col sm:flex-row gap-4 items-center relative z-10">
          <div class="flex flex-col gap-2">
            <button 
              @click="handleAccept"
              :disabled="isAccepting"
              class="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-bold text-lg transition shadow-xl shadow-blue-900/20 disabled:opacity-50 flex items-center justify-center gap-3 min-w-[240px]"
            >
              <Loader2 v-if="isAccepting" class="animate-spin h-5 w-5" />
              {{ isAccepting ? 'Processando...' : 'Aceitar Orçamento' }}
            </button>
            
            <div class="flex gap-2">
              <button 
                @click="openActionModal('request_changes')"
                class="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 flex items-center justify-center gap-2"
              >
                <PencilLine class="w-3.5 h-3.5" /> Pedir Alteração
              </button>
              <button 
                @click="openActionModal('decline')"
                class="flex-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20 flex items-center justify-center gap-2"
              >
                <ThumbsDown class="w-3.5 h-3.5" /> Recusar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Corporativo -->
      <footer class="mt-20 pt-12 border-t border-gray-200 text-center space-y-6">
        <div class="flex flex-col items-center gap-2">
          <h4 class="font-black text-gray-900 uppercase tracking-widest text-sm">{{ profile?.company?.tradeName || profile?.name }}</h4>
          <p v-if="profile?.company?.legalName" class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{{ profile.company.legalName }} • CNPJ: {{ profile.company.taxId }}</p>
        </div>
        
        <div v-if="proposal.termsAndConditions" class="max-w-2xl mx-auto">
          <button 
            @click="isTermsOpen = true"
            class="text-gray-400 hover:text-gray-600 text-[10px] font-black uppercase tracking-[0.2em] underline decoration-dotted underline-offset-8"
          >
            Ver Termos e Condições de Serviço
          </button>
        </div>

        <p class="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] pt-12">Gerado via ORCEI — Gestão Comercial Inteligente</p>
      </footer>
    </main>

    <!-- Modal de Termos -->
    <BaseDialog v-model:open="isTermsOpen" title="Termos e Condições" size="lg">
      <div class="prose prose-blue max-w-none p-4 text-sm text-gray-600 leading-relaxed">
        <div v-html="proposal.termsAndConditions"></div>
      </div>
      <template #footer>
        <BaseButton @click="isTermsOpen = false">Fechar</BaseButton>
      </template>
    </BaseDialog>

    <!-- Modal de Ação (Recusar/Alterar) -->
    <BaseDialog 
      v-model:open="isActionModalOpen" 
      :title="actionType === 'decline' ? 'Recusar Orçamento' : 'Pedir Alteração'" 
      size="md"
    >
      <div class="p-4 space-y-6">
        <div class="bg-blue-50 p-6 rounded-2xl flex gap-4">
          <AlertCircle class="w-6 h-6 text-blue-600 shrink-0" />
          <p class="text-sm text-blue-700 font-medium leading-relaxed">
            {{ actionType === 'decline' 
              ? 'Poderia nos contar o motivo da recusa? Isso ajuda o profissional a melhorar os serviços.' 
              : 'Descreva quais pontos você gostaria de ajustar neste orçamento.' }}
          </p>
        </div>
        
        <textarea 
          v-model="actionNotes" 
          rows="4" 
          class="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-gray-900 transition-all"
          :placeholder="actionType === 'decline' ? 'Ex: Orçamento acima do esperado no momento...' : 'Ex: Gostaria de aumentar a quantidade do item X...'"
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

    <!-- Floating Action Button Mobile -->
    <div v-if="!['accepted', 'expired'].includes(proposal.status)" class="fixed bottom-6 left-6 right-6 sm:hidden z-50">
      <button 
        @click="handleAccept"
        :disabled="isAccepting"
        class="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-2xl flex justify-center items-center gap-3 active:scale-95 transition-transform"
      >
        <Loader2 v-if="isAccepting" class="animate-spin h-5 w-5" />
        {{ isAccepting ? 'Processando...' : 'Aceitar Orçamento' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.prose :deep(h2) {
  @apply text-xl font-bold text-gray-900 mb-4 mt-8 uppercase tracking-tight;
}
.prose :deep(p) {
  @apply text-gray-600 mb-4;
}
.prose :deep(ul) {
  @apply list-disc pl-5 mb-4 space-y-2 text-gray-600;
}
</style>
