<script setup lang="ts">
import { Phone, MessageCircle, CheckCircle2, Download, ExternalLink, MapPin, X, Loader2, AlertCircle, PencilLine, ThumbsDown, Eye } from 'lucide-vue-next'
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

const statusMap: any = {
  draft: { label: 'Rascunho', class: 'bg-gray-100 text-gray-600' },
  created: { label: 'Enviado', class: 'bg-blue-100 text-blue-600' },
  pending: { label: 'Pendente', class: 'bg-orange-100 text-orange-600' },
  accepted: { label: 'Aceito', class: 'bg-green-100 text-green-600' },
  expired: { label: 'Expirado', class: 'bg-red-100 text-red-600' }
}
</script>

<template>
  <div v-if="proposal" class="min-h-screen bg-gray-50/50 pb-32">
    <!-- Top Bar -->
    <header class="bg-white border-b border-gray-100 py-4 px-6 sticky top-0 z-30 backdrop-blur-md bg-white/80">
      <div class="max-w-5xl mx-auto flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <span class="font-black text-xl italic">O.</span>
          </div>
          <div>
            <h1 class="font-black text-gray-900 uppercase tracking-tighter leading-none">{{ proposal.title }}</h1>
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Orçamento #{{ proposal.code }}</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <BaseBadge :variant="proposal.status === 'accepted' ? 'success' : proposal.status === 'expired' ? 'error' : 'info'">
            {{ statusMap[proposal.status]?.label }}
          </BaseBadge>
        </div>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-6 py-12">
      <!-- Grid Principal -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
        <!-- Coluna Esquerda: Dados -->
        <div class="lg:col-span-2 space-y-8">
          <section class="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full translate-x-1/2 -translate-y-1/2 opacity-50"></div>
            
            <div class="relative z-10">
              <h2 class="text-xs font-black text-blue-600 uppercase tracking-[0.2em] mb-8">Escopo do Projeto</h2>
              
              <div class="space-y-10">
                <div v-for="item in proposal.items" :key="item._id" class="group">
                  <div class="flex justify-between items-start mb-3">
                    <h3 class="font-black text-gray-900 text-xl tracking-tight">{{ item.name }}</h3>
                    <span class="font-black text-gray-900">R$ {{ (item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
                  </div>
                  <p class="text-gray-500 font-medium leading-relaxed max-w-2xl">{{ item.description }}</p>
                  <div class="mt-4 flex items-center gap-2">
                    <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">
                      Quantidade: {{ item.quantity }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="mt-12 pt-10 border-t border-gray-100 flex justify-between items-center">
                <span class="text-sm font-bold text-gray-400 uppercase tracking-widest">Subtotal Bruto</span>
                <span class="font-bold text-gray-500">R$ {{ proposal.totals.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
              </div>
            </div>
          </section>
        </div>

        <!-- Coluna Direita: Sidebar -->
        <aside class="space-y-6">
          <!-- Card Cliente -->
          <div class="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Preparado para</h3>
            <div class="flex items-center gap-4 mb-6">
              <div class="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black">
                {{ proposal.client.name.charAt(0) }}
              </div>
              <div>
                <p class="font-black text-gray-900 leading-tight">{{ proposal.client.name }}</p>
                <p class="text-xs font-medium text-gray-500">{{ proposal.client.email }}</p>
              </div>
            </div>
            <div class="pt-6 border-t border-gray-50 space-y-4">
              <div class="flex items-center gap-3 text-gray-600">
                <Clock class="w-4 h-4" />
                <span class="text-xs font-bold uppercase tracking-tight">Válido até {{ formatDate(proposal.expiresAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Botões de Contato -->
          <div class="grid grid-cols-2 gap-4">
            <a :href="`mailto:${proposal.client.email}`" class="flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
              <Mail class="w-6 h-6 text-gray-400 group-hover:text-blue-600 mb-2" />
              <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-blue-600">E-mail</span>
            </a>
            <a v-if="proposal.client.phone" :href="`https://wa.me/${proposal.client.phone.replace(/\D/g, '')}`" target="_blank" class="flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all group">
              <MessageCircle class="w-6 h-6 text-gray-400 group-hover:text-green-600 mb-2" />
              <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-green-600">WhatsApp</span>
            </a>
          </div>
        </aside>
      </div>

      <!-- Métodos de Pagamento -->
      <section v-if="!['accepted', 'expired'].includes(proposal.status)" class="mb-12">
        <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8 text-center">Escolha a Forma de Pagamento</h2>
        
        <div class="flex flex-col md:flex-row gap-6">
          <button 
            @click="selectedMethod = 'cash'"
            :class="{
              'flex-1 p-6 rounded-2xl border-2 transition-all text-left group': true,
              'border-blue-600 bg-blue-50/50 ring-4 ring-blue-50': selectedMethod === 'cash',
              'border-gray-100 hover:border-blue-200 bg-white': selectedMethod !== 'cash'
            }"
          >
            <div class="flex justify-between items-center mb-3">
              <span class="font-bold text-gray-900 text-lg">À Vista (Pix/Transferência)</span>
              <div v-if="selectedMethod === 'cash'" class="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg text-white">
                <CheckCircle2 class="w-4 h-4" />
              </div>
              <div v-else class="w-6 h-6 border-2 border-gray-200 rounded-full"></div>
            </div>
            <p class="text-sm text-gray-600 leading-relaxed">
              Pagamento integral na aprovação. Você ganha <strong>{{ proposal.paymentConfig.cashDiscount }}% de desconto</strong> sobre o valor total.
            </p>
            <div class="mt-4 pt-4 border-t border-gray-100 flex items-baseline gap-2">
              <span class="text-xs font-bold text-gray-400 uppercase">Total</span>
              <span class="text-xl font-black text-blue-700">R$ {{ (proposal.totals.subtotal * (1 - proposal.paymentConfig.cashDiscount / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
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
      </section>

      <!-- Contrato -->
      <div v-if="proposal.contractText" class="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
        <div class="p-6 sm:p-8 border-b border-gray-50 bg-gray-50/50">
          <h2 class="text-xl font-bold text-gray-900">Contrato e Detalhes</h2>
        </div>
        <div class="p-6 sm:p-8 prose prose-blue max-w-none">
          <div v-html="proposal.contractText"></div>
        </div>
      </div>

      <!-- Decision Footer -->
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
            <span v-if="selectedMethod === 'cash'">({{ proposal.paymentConfig.cashDiscount }}% OFF)</span>
            <span v-else>(em até {{ proposal.paymentConfig.installments }}x)</span>
          </p>
        </div>

        <div v-if="['pending', 'created'].includes(proposal.status)" class="flex flex-col sm:flex-row gap-4 relative z-10 w-full sm:w-auto">
          <template v-if="!isPreview">
            <button @click="openActionModal('request_changes')" class="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border-2 border-white/10 hover:bg-white/10 transition-all">Solicitar Alteração</button>
            <button @click="handleAccept" :disabled="isAccepting" class="px-10 py-5 bg-blue-600 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
              <Loader2 v-if="isAccepting" class="w-4 h-4 animate-spin" />
              Aceitar Orçamento
            </button>
          </template>
          <div v-else class="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest bg-white/5 text-gray-400 border border-white/10">
            Modo Visualização
          </div>
        </div>
      </div>

      <div v-if="isPreview" class="mt-8 p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-center gap-4">
        <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
          <Eye class="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h4 class="font-bold text-blue-900 uppercase text-xs tracking-widest">Você está em modo de preview</h4>
          <p class="text-blue-700 text-sm font-medium mt-0.5">Esta é a visão exata do seu cliente. As ações de aceite e alteração estão desabilitadas.</p>
        </div>
      </div>

      <footer class="mt-12 text-center pb-20">
        <div class="flex flex-col items-center gap-6">
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
    <div v-if="!['accepted', 'expired'].includes(proposal.status) && !isPreview" class="fixed bottom-6 left-6 right-6 sm:hidden z-50">
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
