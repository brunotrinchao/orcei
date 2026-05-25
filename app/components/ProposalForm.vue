<script setup lang="ts">
import { ref, computed, watch, watchEffect } from 'vue'
import { Loader2, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-vue-next'
import type { CatalogItemDTO, ProfileDTO, ProposalDTO } from '../../types'
import { ProposalStatus, PaymentMethod, SendMethod } from '../../types/enums'
import ProposalStepClient from './proposal/ProposalStepClient.vue'
import ProposalStepScope from './proposal/ProposalStepScope.vue'
import ProposalStepPayment from './proposal/ProposalStepPayment.vue'

const props = defineProps<{
  initialData?: ProposalDTO
  prefilledItems?: any[]
  isEditing?: boolean
  isSubmitting?: boolean
}>()

const emit = defineEmits(['submit'])

const currentStep = ref(1)
const totalSteps = 3

const { data: clientsData } = useLazyFetch<any>('/api/clients', {
  key: 'clients-list',
  query: { limit: 100 },
  server: false
})
const { data: profile } = useFetch<ProfileDTO>('/api/profile')
const { notify } = useAlerts()

const clients = computed(() => clientsData.value?.items || [])

const catalogSearch = ref('')
const catalogPage = ref(1)
const catalogLimit = 6

const { data: catalogData } = useFetch<any>('/api/catalog', {
  query: computed(() => ({
    page: catalogPage.value,
    limit: catalogLimit,
    search: catalogSearch.value
  })),
  watch: [catalogPage, catalogSearch]
})

const catalogItems = computed(() => catalogData.value?.items || [])
const totalCatalogItems = computed(() => catalogData.value?.total || 0)

const selectedClientId = ref('')

const form = ref({
  title: props.initialData?.title || '',
  status: props.initialData?.status || ProposalStatus.DRAFT,
  client: {
    name: props.initialData?.client?.name || '',
    email: props.initialData?.client?.email || '',
    phone: props.initialData?.client?.phone || ''
  },
  items: props.initialData?.items 
    ? [...props.initialData.items] 
    : (props.prefilledItems ? [...props.prefilledItems] : []) as any[],
  upsellItems: props.initialData?.upsellItems 
    ? [...props.initialData.upsellItems] 
    : [] as any[],
  totals: {
    additional: props.initialData?.totals?.additional || 0,
    discount: props.initialData?.totals?.discount || 0
  },
  paymentConfig: {
    method: props.initialData?.paymentConfig?.method || PaymentMethod.CASH,
    installments: props.initialData?.paymentConfig?.installments || 1,
    cashDiscount: props.initialData?.paymentConfig?.cashDiscount || 0
  },
  sendMethod: props.initialData?.sendMethod || SendMethod.AUTO,
  contractText: props.initialData?.contractText || '',
  termsAndConditions: props.initialData?.termsAndConditions || '',
  executionDate: props.initialData?.executionDate ? new Date(props.initialData.executionDate).toISOString().slice(0, 16) : ''
})

// Carregar templates padrão se estiver vazio (novo orçamento)
watchEffect(() => {
  if (profile.value && !props.initialData?._id) {
    if (!form.value.contractText) form.value.contractText = profile.value.defaultContractTemplate
    if (!form.value.termsAndConditions) form.value.termsAndConditions = profile.value.defaultTermsAndConditions
    form.value.paymentConfig.installments = profile.value.defaultInstallments || 1
    form.value.paymentConfig.cashDiscount = profile.value.defaultCashDiscount || 0
  }
})

// Watch for initialData changes
watch(() => props.initialData, (newVal) => {
  if (newVal) {
    form.value = {
      title: newVal.title,
      status: newVal.status,
      client: { 
        name: newVal.client.name,
        email: newVal.client.email,
        phone: newVal.client.phone || ''
      },
      items: [...newVal.items],
      upsellItems: newVal.upsellItems ? [...newVal.upsellItems] : [],
      totals: {
        additional: newVal.totals?.additional || 0,
        discount: newVal.totals?.discount || 0
      },
      paymentConfig: {
        method: newVal.paymentConfig?.method || PaymentMethod.CASH,
        installments: newVal.paymentConfig?.installments || 1,
        cashDiscount: newVal.paymentConfig?.cashDiscount || 0
      },
      sendMethod: newVal.sendMethod || SendMethod.AUTO,
      contractText: newVal.contractText || '',
      termsAndConditions: newVal.termsAndConditions || '',
      executionDate: newVal.executionDate ? new Date(newVal.executionDate).toISOString().slice(0, 16) : ''
    }
  }
}, { deep: true })

watch(() => props.prefilledItems, (newVal) => {
  if (newVal && !props.initialData) {
    form.value.items = [...newVal]
    if (newVal.length > 0 && !form.value.title) {
      form.value.title = `Orçamento para ${newVal[0].name}`
    }
    // Avancar para o passo 2 automaticamente se houver itens preenchidos?
    // currentStep.value = 2
  }
}, { deep: true })

const isGenerating = ref(false)

async function generateDescription({ index, isUpsell }: { index: number, isUpsell: boolean }) {
  const item = isUpsell ? form.value.upsellItems[index] : form.value.items[index]
  if (!item.name) return notify('Aviso', 'O item precisa de um nome para gerar a descrição.')
  
  isGenerating.value = true
  try {
    const prompt = `Gere uma descrição profissional para um serviço/produto chamado: ${item.name}`
    const data: any = await $fetch('/api/ai/generate', {
      method: 'POST',
      body: { prompt }
    })
    item.description = data.text
  } catch (e) {
    notify('Erro', 'Erro ao gerar descrição')
  } finally {
    isGenerating.value = false
  }
}

const finalTotal = computed(() => {
  const subtotal = form.value.items.reduce((acc, i) => acc + (i.price * i.quantity), 0)
  const baseTotal = subtotal + form.value.totals.additional - form.value.totals.discount
  
  if (form.value.paymentConfig.method === PaymentMethod.CASH) {
    return baseTotal * (1 - (form.value.paymentConfig.cashDiscount / 100))
  }
  return baseTotal
})

function validateStep(step: number): boolean {
  if (step === 1) {
    if (!form.value.title.trim()) {
      notify('Aviso', 'Título do orçamento é obrigatório')
      return false
    }
    if (!form.value.client.name.trim()) {
      notify('Aviso', 'Nome do cliente é obrigatório')
      return false
    }
    if (!form.value.client.email.trim()) {
      notify('Aviso', 'E-mail do cliente é obrigatório')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.value.client.email)) {
      notify('Aviso', 'E-mail informado é inválido')
      return false
    }
  }

  if (step === 2) {
    if (form.value.items.length === 0) {
      notify('Aviso', 'Adicione pelo menos um item obrigatório ao escopo')
      return false
    }
    const allItems = [...form.value.items, ...form.value.upsellItems]
    for (const item of allItems) {
      if (!item.name.trim()) {
        notify('Aviso', 'Todos os itens precisam de um nome')
        return false
      }
      if (item.price < 0) {
        notify('Aviso', 'O preço não pode ser negativo')
        return false
      }
      if (item.quantity <= 0) {
        notify('Aviso', 'A quantidade deve ser maior que zero')
        return false
      }
    }
  }

  return true
}

function nextStep() {
  if (validateStep(currentStep.value)) {
    if (currentStep.value < totalSteps) {
      currentStep.value++
    }
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

async function submit(status: ProposalStatus = ProposalStatus.DRAFT) {
  // Validate all steps before submitting
  if (!validateStep(1) || !validateStep(2)) return
  
  if (form.value.paymentConfig.installments < 1 || form.value.paymentConfig.installments > 12) {
    return notify('Aviso', 'O número de parcelas deve ser entre 1 e 12')
  }

  if (form.value.paymentConfig.cashDiscount < 0 || form.value.paymentConfig.cashDiscount > 100) {
    return notify('Aviso', 'O desconto deve estar entre 0% e 100%')
  }

  const keepStatus = props.isEditing && props.initialData?.status !== ProposalStatus.DRAFT
  const payload = keepStatus ? form.value : { ...form.value, status }
  emit('submit', payload)
}

defineExpose({ submit, isEditingNonDraft: computed(() => props.isEditing && props.initialData?.status !== ProposalStatus.DRAFT) })
</script>

<template>
  <div class="flex flex-col min-h-[60vh] max-h-[85vh]">
    <!-- Steps Header -->
    <div class="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white sticky top-0 z-20">
      <div class="flex items-center gap-2">
        <div 
          v-for="step in totalSteps" 
          :key="step"
          class="flex items-center"
        >
          <div 
            :class="[
              'flex items-center justify-center w-8 h-8 rounded-full text-xs font-black transition-all',
              currentStep === step ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 
              currentStep > step ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
            ]"
          >
            <Check v-if="currentStep > step" class="w-4 h-4" />
            <span v-else>{{ step }}</span>
          </div>
          <div v-if="step < totalSteps" class="w-8 h-1 mx-2 rounded-full" :class="currentStep > step ? 'bg-green-500' : 'bg-gray-100'"></div>
        </div>
      </div>
      <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right hidden sm:block">
        <span v-if="currentStep === 1">Passo 1: Cliente</span>
        <span v-else-if="currentStep === 2">Passo 2: Serviços</span>
        <span v-else-if="currentStep === 3">Passo 3: Finalização</span>
      </div>
    </div>

    <!-- Content Area (Scrollable) -->
    <div class="flex-1 overflow-y-auto p-6 scrollbar-hide">
      <form @submit.prevent="submit" class="pb-10">
        <ProposalStepClient 
          v-show="currentStep === 1"
          :form="form"
          :clients="clients"
          v-model:selectedClientId="selectedClientId"
        />

        <ProposalStepScope 
          v-show="currentStep === 2"
          :form="form"
          :catalog-items="catalogItems"
          :total-catalog-items="totalCatalogItems"
          v-model:catalogSearch="catalogSearch"
          :is-generating="isGenerating"
          @generate-description="generateDescription"
        />

        <ProposalStepPayment 
          v-show="currentStep === 3"
          :form="form"
          :final-total="finalTotal"
        />
      </form>
    </div>

    <!-- Sticky Footer (Navigation & Totals) -->
    <div class="px-6 py-4 bg-white border-t border-gray-100 shrink-0 flex items-center justify-between sticky bottom-0 z-30 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
      <div>
        <BaseButton v-if="currentStep > 1" type="button" variant="secondary" @click="prevStep" :disabled="isSubmitting">
          <ArrowLeft class="w-4 h-4 mr-2" /> Voltar
        </BaseButton>
      </div>

      <!-- Quick Total for Step 2 -->
      <div v-if="currentStep === 2" class="hidden sm:block text-center animate-in fade-in">
        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Total Parcial</span>
        <span class="text-lg font-black text-blue-600">R$ {{ finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
      </div>

      <div class="flex gap-3">
        <template v-if="currentStep < totalSteps">
          <BaseButton type="button" @click="nextStep">
            Próximo Passo <ArrowRight class="w-4 h-4 ml-2" />
          </BaseButton>
        </template>
        
        <template v-else>
          <template v-if="isEditingNonDraft">
            <BaseButton type="button" :disabled="isSubmitting" :loading="isSubmitting" @click="submit()">
              Salvar Alterações
            </BaseButton>
          </template>
          <template v-else>
            <BaseButton type="button" variant="outline" :disabled="isSubmitting" @click="submit('draft')">
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin mr-2" />
              Salvar Rascunho
            </BaseButton>
            <BaseButton type="button" :disabled="isSubmitting" @click="submit('created')" class="bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200">
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin mr-2" />
              Criar e Enviar
            </BaseButton>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>
