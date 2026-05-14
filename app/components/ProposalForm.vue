<script setup lang="ts">
import type { ServiceDTO, ProfileDTO, ProposalDTO } from '~/types'

const props = defineProps<{
  initialData?: ProposalDTO
  isEditing?: boolean
  isSubmitting?: boolean
}>()

const emit = defineEmits(['submit'])

const { data: services } = useFetch<ServiceDTO[]>('/api/services')
const { data: profile } = useFetch<ProfileDTO>('/api/profile')

const form = ref({
  title: props.initialData?.title || '',
  status: props.initialData?.status || 'draft',
  client: {
    name: props.initialData?.client?.name || '',
    email: props.initialData?.client?.email || '',
    phone: props.initialData?.client?.phone || ''
  },
  items: props.initialData?.items ? [...props.initialData.items] : [] as any[],
  paymentConfig: {
    method: props.initialData?.paymentConfig?.method || 'cash',
    installments: props.initialData?.paymentConfig?.installments || 1,
    cashDiscount: props.initialData?.paymentConfig?.cashDiscount || 0
  },
  contractText: props.initialData?.contractText || '',
  termsAndConditions: props.initialData?.termsAndConditions || ''
})

// Carregar templates padrão se estiver vazio (nova proposta)
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
      client: { ...newVal.client },
      items: [...newVal.items],
      paymentConfig: {
        method: newVal.paymentConfig?.method || 'cash',
        installments: newVal.paymentConfig?.installments || 1,
        cashDiscount: newVal.paymentConfig?.cashDiscount || 0
      },
      contractText: newVal.contractText || '',
      termsAndConditions: newVal.termsAndConditions || ''
    }
  }
}, { deep: true })

function toggleService(service: ServiceDTO) {
  const index = form.value.items.findIndex((i: any) => i.serviceId === service._id)
  if (index > -1) {
    form.value.items.splice(index, 1)
  } else {
    form.value.items.push({
      serviceId: service._id,
      name: service.name,
      description: service.description,
      price: service.basePrice,
      quantity: 1
    })
  }
}

const totalPreview = computed(() => {
  const subtotal = form.value.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0)
  if (form.value.paymentConfig.method === 'cash') {
    return subtotal * (1 - (form.value.paymentConfig.cashDiscount / 100))
  }
  return subtotal
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
    const promptTemplate = `Você é um especialista em copywriting corporativo e negociação B2B, ajudando um freelancer a fechar contratos. 
Sua tarefa é transformar um título de serviço e alguns tópicos curtos em uma descrição comercial altamente persuasiva, profissional e clara para ser inserida diretamente em uma proposta de orçamento.

REGRA DE SAÍDA ESTILIZADA:
1. O texto deve ter no máximo 2 parágrafos curtos.
2. Foque no "valor percebido" e nos benefícios para o negócio do cliente, não apenas nas características técnicas.
3. Se os tópicos contiverem vários itens, formate os entregáveis principais em uma 'bullet list' concisa.
4. O tom deve ser confiante, direto e premium.
5. NÃO inclua saudações, conclusões genéricas ou frases como "Aqui está a sua descrição". Retorne EXATAMENTE e APENAS o texto que será impresso no orçamento.
6. Não mencione valores, preços ou prazos de expiração (isso será tratado pelo sistema).
7. A descrição deve ser breve (MAX 150 caracteres).
8. O serviço é feito por apenas uma pessoa, por tanto não trate como equipe.

DADOS DO SERVIÇO:
- Nome do Serviço: ${item.name}
- Tópicos/Detalhes informados pelo freelancer: ${item.description || 'Não informado'}

Escreva a descrição comercial agora:`

    const res = await $fetch<{ text: string }>('/api/ai/generate', {
      method: 'POST',
      body: { prompt: promptTemplate }
    })
    item.description = res.text
  } catch (e) {
    alert('Erro ao gerar descrição')
  } finally {
    generatingIndex.value = null
  }
}

function handleSubmit(status: string = 'draft') {
  if (form.value.items.length === 0) return alert('Selecione pelo menos um serviço')
  form.value.status = status as any
  emit('submit', { ...form.value })
}
</script>

<template>
  <form @submit.prevent="handleSubmit(form.status)" class="space-y-10 relative">
    <!-- Grid: Info Básica + Cliente -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Info Básica -->
      <section class="bg-gray-50/50 p-6 rounded-2xl border border-gray-200">
        <h2 class="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Projeto</h2>
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Título da Proposta</label>
          <input v-model="form.title" required type="text" class="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Ex: Landing Page - Cliente X">
        </div>
      </section>

      <!-- Cliente -->
      <section class="bg-gray-50/50 p-6 rounded-2xl border border-gray-200">
        <h2 class="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Cliente</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Nome</label>
            <input v-model="form.client.name" required type="text" class="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">E-mail</label>
            <input v-model="form.client.email" required type="email" class="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all">
          </div>
        </div>
      </section>
    </div>

    <!-- Serviços -->
    <section class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-sm font-black text-gray-900 uppercase tracking-widest">Serviços no Catálogo</h2>
        <NuxtLink to="/dashboard/services" class="text-xs text-blue-600 hover:text-blue-800 font-bold uppercase tracking-wider transition-colors">+ Editar Catálogo</NuxtLink>
      </div>
      <div class="flex flex-wrap gap-2 mb-8">
        <button 
          v-for="service in services" 
          :key="service._id"
          type="button"
          @click="toggleService(service)"
          :class="{
            'px-5 py-2.5 rounded-xl text-xs font-bold transition-all border-2': true,
            'bg-gray-900 border-gray-900 text-white shadow-lg shadow-gray-200': form.items.some((i: any) => i.serviceId === service._id),
            'bg-white border-gray-200 text-gray-600 hover:border-gray-400': !form.items.some((i: any) => i.serviceId === service._id)
          }"
        >
          {{ service.name }}
        </button>
      </div>

      <div v-if="form.items.length > 0" class="space-y-8 pt-6 border-t border-gray-100">
        <div v-for="(item, index) in form.items" :key="index" class="p-6 bg-gray-50 rounded-2xl relative group border border-gray-100 hover:border-gray-300 transition-all">
          <button @click="form.items.splice(index, 1)" type="button" class="absolute -right-3 -top-3 bg-white text-red-600 p-2 rounded-full opacity-0 group-hover:opacity-100 transition shadow-xl border border-red-50 hover:bg-red-50">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="md:col-span-2">
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Serviço</label>
              <input v-model="item.name" class="w-full bg-transparent font-black text-gray-900 border-b-2 border-gray-200 focus:border-blue-500 focus:ring-0 px-0 outline-none text-lg">
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Preço (R$)</label>
              <input v-model.number="item.price" type="number" class="w-full bg-transparent font-bold text-gray-900 border-b-2 border-gray-200 focus:border-blue-500 focus:ring-0 px-0 outline-none text-lg">
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Quantidade</label>
              <input v-model.number="item.quantity" type="number" class="w-full bg-transparent font-bold text-gray-900 border-b-2 border-gray-200 focus:border-blue-500 focus:ring-0 px-0 outline-none text-lg">
            </div>
            <div class="md:col-span-full">
              <div class="flex justify-between items-center mb-2">
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição Comercial</label>
                <button 
                  type="button"
                  @click="generateDescription(index)"
                  :disabled="generatingIndex === index"
                  class="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1.5 disabled:opacity-50 hover:text-blue-800 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {{ generatingIndex === index ? 'Melhorando...' : 'Otimizar com IA' }}
                </button>
              </div>
              <textarea v-model="item.description" class="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner" rows="3"></textarea>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
        <p class="text-gray-400 font-bold uppercase tracking-widest text-xs">Selecione os serviços acima</p>
      </div>
    </section>

    <!-- Condições de Pagamento -->
    <section class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <h2 class="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Condições de Pagamento</h2>
      <div class="flex flex-col sm:flex-row gap-8">
        <div class="flex p-1 bg-gray-100 rounded-xl w-fit shrink-0">
          <button 
            type="button"
            @click="form.paymentConfig.method = 'cash'"
            :class="{
              'px-8 py-2.5 rounded-lg text-xs font-black transition-all': true,
              'bg-white shadow-md text-blue-600': form.paymentConfig.method === 'cash',
              'text-gray-500 hover:text-gray-800': form.paymentConfig.method !== 'cash'
            }"
          >
            À VISTA
          </button>
          <button 
            type="button"
            @click="form.paymentConfig.method = 'credit_card'"
            :class="{
              'px-8 py-2.5 rounded-lg text-xs font-black transition-all': true,
              'bg-white shadow-md text-blue-600': form.paymentConfig.method === 'credit_card',
              'text-gray-500 hover:text-gray-800': form.paymentConfig.method !== 'credit_card'
            }"
          >
            CARTÃO
          </button>
        </div>

        <div v-if="form.paymentConfig.method === 'cash'" class="w-full max-w-[200px] animate-in fade-in slide-in-from-top-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">% Desconto</label>
          <div class="relative">
            <input v-model.number="form.paymentConfig.cashDiscount" type="number" min="0" max="100" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-8 font-bold">
            <span class="absolute right-3 top-3.5 text-gray-400 font-bold">%</span>
          </div>
        </div>

        <div v-else class="w-full max-w-[200px] animate-in fade-in slide-in-from-top-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Parcelamento</label>
          <select v-model.number="form.paymentConfig.installments" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold appearance-none">
            <option v-for="n in 12" :key="n" :value="n">{{ n }}x sem juros</option>
          </select>
        </div>
      </div>
    </section>

    <!-- Contrato -->
    <section class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <h2 class="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Texto do Contrato</h2>
      <RichTextEditor 
        v-model="form.contractText" 
        placeholder="Escreva os detalhes do contrato aqui..."
        class="border border-gray-100 rounded-xl overflow-hidden"
      />
      <div class="mt-4 flex flex-wrap gap-2">
        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Variáveis:</span>
        <code v-pre class="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">{{nome_cliente}}</code>
        <code v-pre class="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">{{valor_total}}</code>
        <code v-pre class="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">{{forma_pagamento}}</code>
      </div>
    </section>

    <!-- Termos -->
    <section class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <h2 class="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Termos e Condições</h2>
      <RichTextEditor 
        v-model="form.termsAndConditions" 
        placeholder="Defina as letras miúdas..."
        class="border border-gray-100 rounded-xl overflow-hidden"
      />
    </section>

    <!-- Totais Sticky Footer -->
    <div class="sticky bottom-0 -mx-8 -mb-8 px-8 py-6 bg-white border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-6 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] rounded-b-3xl">
      <div class="text-center sm:text-left">
        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total da Proposta</p>
        <div class="flex items-center gap-3">
          <p class="text-3xl font-black text-gray-900 tracking-tight">R$ {{ totalPreview.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
          <span class="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">{{ paymentSummary }}</span>
        </div>
      </div>
      <div class="flex flex-wrap justify-center gap-4">
        <button 
          v-if="!isEditing || form.status === 'draft'"
          type="button"
          @click="handleSubmit('draft')"
          :disabled="isSubmitting"
          class="bg-gray-100 text-gray-700 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50"
        >
          Salvar Rascunho
        </button>
        <button 
          type="button"
          @click="handleSubmit('created')"
          :disabled="isSubmitting"
          class="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50 flex items-center gap-2"
        >
          <div v-if="isSubmitting" class="i-heroicons-arrow-path w-4 h-4 animate-spin"></div>
          {{ isEditing ? 'SALVAR ALTERAÇÕES' : 'GERAR PROPOSTA AGORA' }}
        </button>
      </div>
    </div>
  </form>
</template>
