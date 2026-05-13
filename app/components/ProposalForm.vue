<script setup lang="ts">
const props = defineProps<{
  initialData?: any
  isEditing?: boolean
  isSubmitting?: boolean
}>()

const emit = defineEmits(['submit'])

const { data: services } = useFetch('/api/services')
const { data: profile } = useFetch('/api/profile')

const form = ref({
  title: props.initialData?.title || '',
  status: props.initialData?.status || 'draft',
  client: {
    name: props.initialData?.client?.name || '',
    email: props.initialData?.client?.email || '',
    phone: props.initialData?.client?.phone || ''
  },
  items: props.initialData?.items || [],
  contractText: props.initialData?.contractText || '',
  termsAndConditions: props.initialData?.termsAndConditions || ''
})

// Carregar templates padrão se estiver vazio (nova proposta)
watchEffect(() => {
  if (profile.value && !props.initialData?._id) {
    if (!form.value.contractText) form.value.contractText = profile.value.defaultContractTemplate
    if (!form.value.termsAndConditions) form.value.termsAndConditions = profile.value.defaultTermsAndConditions
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
      contractText: newVal.contractText || '',
      termsAndConditions: newVal.termsAndConditions || ''
    }
  }
}, { deep: true })

function toggleService(service: any) {
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
  return form.value.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0)
})

const generatingIndex = ref<number | null>(null)
const isGeneratingContract = ref(false)
const isGeneratingTerms = ref(false)

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
7. A descrição deve ser breve (MAX 280 caracteres).
8. O serviço é feito por apenas uma pessoa, por tanto não trate como equipe.

DADOS DO SERVIÇO:
- Nome do Serviço: ${item.name}
- Tópicos/Detalhes informados pelo freelancer: ${item.description || 'Não informado'}

Escreva a descrição comercial agora:`

    const { text } = await $fetch('/api/ai/generate', {
      method: 'POST',
      body: { prompt: promptTemplate }
    })
    item.description = text
  } catch (e) {
    alert('Erro ao gerar descrição')
  } finally {
    generatingIndex.value = null
  }
}

async function generateContract() {
  isGeneratingContract.value = true
  try {
    const { text } = await $fetch('/api/ai/generate', {
      method: 'POST',
      body: { prompt: `Reescreva este contrato de prestação de serviços de forma mais profissional e jurídica, mantendo as variáveis {{tags}} intactas. Texto atual: ${form.value.contractText}` }
    })
    form.value.contractText = text
  } catch (e) {
    alert('Erro ao gerar contrato')
  } finally {
    isGeneratingContract.value = false
  }
}

async function generateTerms() {
  isGeneratingTerms.value = true
  try {
    const { text } = await $fetch('/api/ai/generate', {
      method: 'POST',
      body: { prompt: `Melhore estes termos e condições para uma proposta de freelancer, mantendo as variáveis {{tags}} intactas. Texto atual: ${form.value.termsAndConditions}` }
    })
    form.value.termsAndConditions = text
  } catch (e) {
    alert('Erro ao gerar termos')
  } finally {
    isGeneratingTerms.value = false
  }
}

function handleSubmit(status: string = 'draft') {
  if (form.value.items.length === 0) return alert('Selecione pelo menos um serviço')
  form.value.status = status
  emit('submit', { ...form.value })
}
</script>

<template>
  <form @submit.prevent="handleSubmit(form.status)" class="space-y-8">
    <!-- Info Básica -->
    <section class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 class="text-lg font-semibold mb-4">Informações do Projeto</h2>
      <div class="grid grid-cols-1 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Título da Proposta (Interno)</label>
          <input v-model="form.title" required type="text" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Ex: Landing Page - Cliente X">
        </div>
      </div>
    </section>

    <!-- Cliente -->
    <section class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 class="text-lg font-semibold mb-4">Dados do Cliente</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente</label>
          <input v-model="form.client.name" required type="text" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">E-mail do Cliente</label>
          <input v-model="form.client.email" required type="email" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
        </div>
      </div>
    </section>

    <!-- Serviços -->
    <section class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold">Selecione os Serviços</h2>
        <NuxtLink to="/dashboard/services" class="text-sm text-blue-600 hover:underline font-medium">+ Editar Catálogo</NuxtLink>
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button 
          v-for="service in services" 
          :key="service._id"
          type="button"
          @click="toggleService(service)"
          :class="{
            'px-4 py-2 rounded-full text-sm font-medium transition border-2': true,
            'bg-blue-600 border-blue-600 text-white': form.items.some((i: any) => i.serviceId === service._id),
            'bg-white border-gray-200 text-gray-600 hover:border-blue-300': !form.items.some((i: any) => i.serviceId === service._id)
          }"
        >
          {{ service.name }}
        </button>
      </div>

      <div v-if="form.items.length > 0" class="space-y-6 pt-4 border-t border-gray-50">
        <div v-for="(item, index) in form.items" :key="index" class="p-4 bg-gray-50 rounded-xl relative group">
          <button @click="form.items.splice(index, 1)" type="button" class="absolute -right-2 -top-2 bg-red-100 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Serviço</label>
              <input v-model="item.name" class="w-full bg-transparent font-bold text-gray-900 border-b border-gray-200 focus:border-blue-500 focus:ring-0 px-0">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Preço (R$)</label>
              <input v-model.number="item.price" type="number" class="w-full bg-transparent border-b border-gray-200 focus:border-blue-500 focus:ring-0 px-0">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Qtd</label>
              <input v-model.number="item.quantity" type="number" class="w-full bg-transparent border-b border-gray-200 focus:border-blue-500 focus:ring-0 px-0">
            </div>
            <div class="md:col-span-full">
              <div class="flex justify-between items-center mb-1">
                <label class="block text-xs font-bold text-gray-500 uppercase">Descrição Personalizada</label>
                <button 
                  type="button"
                  @click="generateDescription(index)"
                  :disabled="generatingIndex === index"
                  class="text-[10px] font-bold text-blue-600 uppercase flex items-center gap-1 disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {{ generatingIndex === index ? 'Gerando...' : 'Melhorar com IA' }}
                </button>
              </div>
              <textarea v-model="item.description" class="w-full bg-white border border-gray-100 rounded-lg p-2 text-sm text-gray-600 focus:ring-2 focus:ring-blue-500" rows="2"></textarea>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-8 border-2 border-dashed rounded-xl">
        <p class="text-gray-500">Selecione os serviços acima para compor sua proposta.</p>
      </div>
    </section>

    <!-- Contrato -->
    <section class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold">Texto do Contrato</h2>
        <button 
          type="button"
          @click="generateContract"
          :disabled="isGeneratingContract"
          class="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {{ isGeneratingContract ? 'Gerando...' : 'Melhorar com IA' }}
        </button>
      </div>
      <RichTextEditor 
        v-model="form.contractText" 
        placeholder="Escreva os detalhes do contrato aqui..."
      />
      <p class="mt-2 text-xs text-gray-400 font-medium">
        Variáveis disponíveis: {{nome_cliente}}, {{nome_empresa}}, {{valor_total}}, {{dias_validade}}
      </p>
    </section>

    <!-- Termos -->
    <section class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold">Termos e Condições</h2>
        <button 
          type="button"
          @click="generateTerms"
          :disabled="isGeneratingTerms"
          class="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {{ isGeneratingTerms ? 'Gerando...' : 'Melhorar com IA' }}
        </button>
      </div>
      <RichTextEditor 
        v-model="form.termsAndConditions" 
        placeholder="Defina as letras miúdas..."
      />
    </section>

    <!-- Totais -->
    <div class="sticky bottom-0 bg-white py-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div class="text-center sm:text-left">
        <p class="text-sm text-gray-500">Total da Proposta</p>
        <p class="text-2xl font-bold text-gray-900">R$ {{ totalPreview.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
      </div>
      <div class="flex flex-wrap justify-center gap-3">
        <button 
          v-if="!isEditing || form.status === 'draft'"
          type="button"
          @click="handleSubmit('draft')"
          :disabled="isSubmitting"
          class="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition disabled:opacity-50"
        >
          Salvar Rascunho
        </button>
        <button 
          type="button"
          @click="handleSubmit('created')"
          :disabled="isSubmitting"
          class="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100 disabled:opacity-50"
        >
          <template v-if="isSubmitting">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processando...
          </template>
          <template v-else>
            {{ isEditing ? 'Salvar e Gerar' : 'Gerar Proposta' }}
          </template>
        </button>
      </div>
    </div>
  </form>
</template>
