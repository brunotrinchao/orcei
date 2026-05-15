<script setup lang="ts">
import { ref, computed, watch, watchEffect } from 'vue'
import { Plus, Trash2, Sparkles, Loader2 } from 'lucide-vue-next'
import type { CatalogItemDTO, ProfileDTO, ProposalDTO } from '../../types'

const props = defineProps<{
  initialData?: ProposalDTO
  isEditing?: boolean
  isSubmitting?: boolean
}>()

const emit = defineEmits(['submit'])

const { data: catalogItems } = useFetch<CatalogItemDTO[]>('/api/catalog')
const { data: clients } = useFetch<any[]>('/api/clients')
const { data: profile } = useFetch<ProfileDTO>('/api/profile')
const { notify } = useAlerts()

const selectedClientId = ref('')

function onClientSelect(clientId: string) {
  const client = clients.value?.find(c => c._id === clientId)
  if (client) {
    form.value.client.name = client.name
    form.value.client.email = client.email
    form.value.client.phone = client.phone || ''
  }
}

const clientOptions = computed(() => {
  return clients.value?.map(c => ({
    label: c.name,
    value: c._id
  })) || []
})

const form = ref({
  title: props.initialData?.title || '',
  status: props.initialData?.status || 'draft',
  client: {
    name: props.initialData?.client?.name || '',
    email: props.initialData?.client?.email || '',
    phone: props.initialData?.client?.phone || ''
  },
  items: props.initialData?.items ? [...props.initialData.items] : [] as any[],
  totals: {
    additional: props.initialData?.totals?.additional || 0,
    discount: props.initialData?.totals?.discount || 0
  },
  paymentConfig: {
    method: props.initialData?.paymentConfig?.method || 'cash',
    installments: props.initialData?.paymentConfig?.installments || 1,
    cashDiscount: props.initialData?.paymentConfig?.cashDiscount || 0
  },
  sendMethod: props.initialData?.sendMethod || 'auto',
  contractText: props.initialData?.contractText || '',
  termsAndConditions: props.initialData?.termsAndConditions || ''
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
      totals: {
        additional: newVal.totals?.additional || 0,
        discount: newVal.totals?.discount || 0
      },
      paymentConfig: {
        method: newVal.paymentConfig?.method || 'cash',
        installments: newVal.paymentConfig?.installments || 1,
        cashDiscount: newVal.paymentConfig?.cashDiscount || 0
      },
      sendMethod: newVal.sendMethod || 'auto',
      contractText: newVal.contractText || '',
      termsAndConditions: newVal.termsAndConditions || ''
    }
  }
}, { deep: true })

function toggleItem(item: CatalogItemDTO) {
  const index = form.value.items.findIndex((i: any) => i.catalogItemId === item._id)
  if (index > -1) {
    form.value.items.splice(index, 1)
  } else {
    form.value.items.push({
      catalogItemId: item._id,
      name: item.name,
      description: item.description,
      price: item.price,
      quantity: 1
    })
  }
}

const totalPreview = computed(() => {
  const subtotal = form.value.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0)
  const baseTotal = subtotal + (form.value.totals.additional || 0) - (form.value.totals.discount || 0)
  
  if (form.value.paymentConfig.method === 'cash') {
    return baseTotal * (1 - (form.value.paymentConfig.cashDiscount / 100))
  }
  return baseTotal
})

const paymentSummary = computed(() => {
  if (form.value.paymentConfig.method === 'cash') {
    return form.value.paymentConfig.cashDiscount > 0 
      ? `Desconto de ${form.value.paymentConfig.cashDiscount}% aplicado` 
      : 'Pagamento à vista'
  }
  const installmentValue = totalPreview.value / form.value.paymentConfig.installments
  return `Parcelado em ${form.value.paymentConfig.installments}x de R$ ${installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
})

const generatingIndex = ref<number | null>(null)

async function generateDescription(index: number) {
  const item = form.value.items[index]
  if (!item.name) return
  
  generatingIndex.value = index
  try {
    const promptTemplate = `Você é um especialista em copywriting corporativo e negociação B2B. 
Sua tarefa é transformar um título de item e alguns tópicos curtos em uma descrição comercial altamente persuasiva e profissional.

REGRA DE SAÍDA ESTILIZADA:
1. O texto deve ter no máximo 150 caracteres.
2. Foque no valor e benefícios.
3. Não inclua saudações.
4. O tom deve ser confiante e premium.

DADOS:
- Nome: ${item.name}
- Detalhes: ${item.description || 'Não informado'}

Escreva a descrição comercial agora:`

    const res: any = await $fetch('/api/ai/generate', {
      method: 'POST',
      body: { prompt: promptTemplate }
    })
    item.description = res.text
  } catch (e) {
    notify('Erro', 'Erro ao gerar descrição')
  } finally {
    generatingIndex.value = null
  }
}

function handleSubmit(status: string = 'draft') {
  if (form.value.items.length === 0) return notify('Aviso', 'Selecione pelo menos um item do catálogo')
  form.value.status = status as any
  emit('submit', { ...form.value })
}
</script>

<template>
  <form @submit.prevent="handleSubmit(form.status)" class="space-y-10 relative">
    <!-- Grid: Info Básica + Cliente -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Info Básica -->
      <section class="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-200">
        <h2 class="text-xs font-black text-gray-900 uppercase tracking-widest mb-6 ml-1">Projeto</h2>
        <div>
          <BaseInput 
            v-model="form.title" 
            label="Título do Orçamento" 
            placeholder="Ex: Landing Page - Cliente X" 
            required 
          />
        </div>
      </section>

      <!-- Cliente -->
      <section class="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-200">
        <div class="flex justify-between items-center mb-6 px-1">
          <h2 class="text-xs font-black text-gray-900 uppercase tracking-widest">Cliente</h2>
          <div v-if="clients && clients.length > 0" class="min-w-[200px]">
            <BaseSelect 
              v-model="selectedClientId" 
              placeholder="Selecionar Cliente..." 
              :options="clientOptions"
              @update:model-value="onClientSelect"
            />
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseInput 
            v-model="form.client.name" 
            label="Nome do Cliente" 
            required 
          />
          <BaseInput 
            v-model="form.client.email" 
            label="E-mail" 
            type="email"
            required 
          />
          <div class="md:col-span-2">
            <BaseInput 
              v-model="form.client.phone" 
              label="Telefone (opcional)" 
              mask="(##) #####-####"
            />
          </div>
        </div>
      </section>
    </div>

    <!-- Catálogo -->
    <section class="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm">
      <div class="flex justify-between items-center mb-6 px-1">
        <h2 class="text-xs font-black text-gray-900 uppercase tracking-widest">Catálogo de Itens</h2>
        <NuxtLink to="/dashboard/catalog" class="text-[10px] text-blue-600 hover:text-blue-800 font-black uppercase tracking-widest transition-colors">+ Gerenciar Catálogo</NuxtLink>
      </div>
      <div class="flex flex-wrap gap-2 mb-8 p-1">
        <button 
          v-for="item in catalogItems" 
          :key="item._id"
          type="button"
          @click="toggleItem(item)"
          :class="{
            'px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2': true,
            'bg-gray-900 border-gray-900 text-white shadow-xl shadow-gray-200': form.items.some((i: any) => i.catalogItemId === item._id),
            'bg-white border-gray-100 text-gray-500 hover:border-gray-300': !form.items.some((i: any) => i.catalogItemId === item._id)
          }"
        >
          {{ item.name }}
        </button>
      </div>

      <div v-if="form.items.length > 0" class="space-y-8 pt-6 border-t border-gray-100">
        <div v-for="(item, index) in form.items" :key="index" class="p-8 bg-gray-50/50 rounded-[2rem] relative group border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
          <button @click="form.items.splice(index, 1)" type="button" class="absolute -right-3 -top-3 bg-white text-red-600 w-10 h-10 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition shadow-2xl border border-red-50 hover:bg-red-50 hover:scale-110 active:scale-95">
            <Trash2 class="w-5 h-5" />
          </button>
          
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="md:col-span-2">
              <BaseInput 
                v-model="item.name" 
                label="Nome do Item" 
                required 
              />
            </div>
            <div>
              <BaseInput 
                v-model.number="item.price" 
                type="number" 
                step="0.01"
                label="Preço (R$)" 
                required 
              />
            </div>
            <div>
              <BaseInput 
                v-model.number="item.quantity" 
                type="number" 
                label="Quantidade" 
                required 
              />
            </div>
            <div class="md:col-span-full">
              <div class="flex justify-between items-center mb-2 ml-1">
                <label class="block text-xs font-black text-gray-500 uppercase tracking-widest">Descrição Comercial</label>
                <button 
                  type="button"
                  @click="generateDescription(index)"
                  :disabled="generatingIndex === index"
                  class="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1.5 disabled:opacity-50 hover:text-blue-800 transition-colors tracking-widest"
                >
                  <Sparkles class="w-3.5 h-3.5" />
                  {{ generatingIndex === index ? 'Melhorando...' : 'Otimizar com IA' }}
                </button>
              </div>
              <textarea 
                v-model="item.description" 
                class="w-full bg-white border-2 border-gray-100 rounded-2xl p-5 text-sm font-bold text-gray-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300" 
                rows="3"
                placeholder="Detalhes que serão exibidos no orçamento..."
              ></textarea>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-16 border-4 border-dashed border-gray-50 rounded-[2rem] bg-gray-50/30">
        <p class="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">Selecione itens do catálogo acima</p>
      </div>
    </section>

    <!-- Condições de Pagamento -->
    <section class="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm">
      <h2 class="text-xs font-black text-gray-900 uppercase tracking-widest mb-8 ml-1">Condições de Pagamento</h2>
      <div class="flex flex-col sm:flex-row gap-8">
        <div class="flex p-1.5 bg-gray-100 rounded-2xl w-fit shrink-0">
          <button 
            type="button"
            @click="form.paymentConfig.method = 'cash'"
            :class="{
              'px-8 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest': true,
              'bg-white shadow-xl text-gray-900': form.paymentConfig.method === 'cash',
              'text-gray-400 hover:text-gray-600': form.paymentConfig.method !== 'cash'
            }"
          >
            À VISTA
          </button>
          <button 
            type="button"
            @click="form.paymentConfig.method = 'credit_card'"
            :class="{
              'px-8 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest': true,
              'bg-white shadow-xl text-gray-900': form.paymentConfig.method === 'credit_card',
              'text-gray-400 hover:text-gray-600': form.paymentConfig.method !== 'credit_card'
            }"
          >
            PARCELADO
          </button>
        </div>

        <div v-if="form.paymentConfig.method === 'cash'" class="w-full max-w-[200px] animate-in fade-in slide-in-from-top-2">
          <BaseInput 
            v-model.number="form.paymentConfig.cashDiscount" 
            type="number" 
            label="% Desconto" 
            placeholder="0"
          />
        </div>

        <div v-else class="w-full max-w-[240px] animate-in fade-in slide-in-from-top-2">
          <BaseSelect 
            v-model="form.paymentConfig.installments" 
            label="Parcelamento"
            :options="Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}x sem juros`, value: (i + 1).toString() }))"
          />
        </div>
      </div>
    </section>

    <!-- Contrato -->
    <section class="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm">
      <h2 class="text-xs font-black text-gray-900 uppercase tracking-widest mb-6 ml-1">Texto do Contrato</h2>
      <RichTextEditor 
        v-model="form.contractText" 
        placeholder="Escreva os detalhes do contrato aqui..."
        class="border-2 border-gray-50 rounded-[2rem] overflow-hidden"
      />
      <div class="mt-6 flex flex-wrap gap-2 ml-1">
        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Variáveis:</span>
        <code v-pre class="text-[9px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-black uppercase tracking-widest">{{nome_cliente}}</code>
        <code v-pre class="text-[9px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-black uppercase tracking-widest">{{valor_total}}</code>
        <code v-pre class="text-[9px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-black uppercase tracking-widest">{{forma_pagamento}}</code>
      </div>
    </section>

    <!-- Termos -->
    <section class="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm">
      <h2 class="text-xs font-black text-gray-900 uppercase tracking-widest mb-6 ml-1">Termos e Condições</h2>
      <RichTextEditor 
        v-model="form.termsAndConditions" 
        placeholder="Defina as letras miúdas..."
        class="border-2 border-gray-50 rounded-[2rem] overflow-hidden"
      />
    </section>

    <!-- Totais Sticky Footer -->
    <div class="py-8 mt-10 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-8">
      <div class="text-center sm:text-left">
        <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Resumo do Orçamento</p>
        <div class="flex items-center gap-4">
          <p class="text-4xl font-black text-gray-900 tracking-tight">R$ {{ totalPreview.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
          <span class="text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full uppercase tracking-widest border border-blue-100">{{ paymentSummary }}</span>
        </div>
      </div>
      <div class="flex flex-wrap justify-center gap-4 w-full sm:w-auto">
        <BaseButton 
          v-if="!isEditing || form.status === 'draft'"
          type="button"
          variant="secondary"
          @click="handleSubmit('draft')"
          :disabled="isSubmitting"
          class="flex-1 sm:flex-none"
        >
          Salvar Rascunho
        </BaseButton>
        <BaseButton 
          type="button"
          @click="handleSubmit('created')"
          :disabled="isSubmitting"
          class="flex-1 sm:flex-none"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin mr-2" />
          {{ isEditing ? 'SALVAR ALTERAÇÕES' : 'GERAR ORÇAMENTO AGORA' }}
        </BaseButton>
      </div>
    </div>
  </form>
</template>

</template>
