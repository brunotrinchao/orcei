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

const { data: clientsData, error: clientsError } = useFetch<any>('/api/clients', {
  query: { limit: 100 }
})
const { data: profile } = useFetch<ProfileDTO>('/api/profile')
const { notify } = useAlerts()

const clients = computed(() => clientsData.value?.items || [])

onMounted(() => {
  console.log('ProposalForm Mounted. Clients Initial State:', clients.value)
})

watch(clientsData, (val) => {
  console.log('Clients Data Changed:', val)
}, { immediate: true })

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

function onClientSelect(clientId: string | undefined) {
  if (!clientId) return
  const client = clients.value?.find((c: any) => c._id === clientId)
  if (client) {
    form.value.client.name = client.name
    form.value.client.email = client.email
    form.value.client.phone = client.phone || ''
  }
}

const clientOptions = computed(() => {
  return clients.value?.map((c: any) => ({
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

const isGenerating = ref(false)

async function generateDescription(itemIndex: number) {
  const item = form.value.items[itemIndex]
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
  
  if (form.value.paymentConfig.method === 'cash') {
    return baseTotal * (1 - (form.value.paymentConfig.cashDiscount / 100))
  }
  return baseTotal
})

async function submit() {
  if (form.value.items.length === 0) return notify('Aviso', 'Selecione pelo menos um item do catálogo')
  emit('submit', form.value)
}
</script>

<template>
  <form @submit.prevent="submit" class="space-y-12 py-6">
    <!-- Cliente & Título -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="space-y-6">
        <BaseInput v-model="form.title" label="Título do Orçamento" placeholder="Ex: Site Institucional - Empresa X" required />
        
        <div class="space-y-4">
          <BaseSelect 
            v-model="selectedClientId" 
            label="Escolher Cliente Cadastrado" 
            :options="clientOptions"
            @update:model-value="onClientSelect"
          />
          <div class="p-6 bg-gray-50 rounded-3xl border border-gray-100 grid grid-cols-1 gap-4">
            <BaseInput v-model="form.client.name" label="Nome do Cliente" required />
            <BaseInput v-model="form.client.email" label="E-mail" required />
            <BaseInput v-model="form.client.phone" label="WhatsApp (Opcional)" mask="(##) #####-####" />
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="flex items-center justify-between ml-1">
          <label class="block text-xs font-black text-gray-500 uppercase tracking-widest">Itens do Catálogo</label>
          <div class="relative w-48">
            <input 
              v-model="catalogSearch" 
              type="text" 
              placeholder="Buscar..." 
              class="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-[10px] focus:ring-2 focus:ring-blue-500/20 outline-none"
            >
            <Search class="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        <div class="bg-white border-2 border-gray-100 rounded-[2.5rem] overflow-hidden flex flex-col">
          <div class="max-h-[300px] overflow-y-auto divide-y divide-gray-50 scrollbar-hide">
            <div 
              v-for="item in catalogItems" 
              :key="item._id"
              @click="toggleItem(item)"
              class="p-5 flex items-center justify-between cursor-pointer hover:bg-blue-50/50 transition-all group"
            >
              <div class="flex items-center gap-4">
                <div 
                  :class="form.items.some(i => i.catalogItemId === item._id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'"
                  class="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all"
                >
                  <Plus v-if="!form.items.some(i => i.catalogItemId === item._id)" class="w-3 h-3 text-gray-300" />
                  <div v-else class="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div>
                  <p class="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{{ item.name }}</p>
                  <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">R$ {{ (item.price as number).toLocaleString('pt-BR') }} / {{ item.unit }}</p>
                </div>
              </div>
            </div>
            <div v-if="!catalogItems?.length" class="p-10 text-center text-gray-400 text-sm font-medium">
              Nenhum item encontrado.
            </div>
          </div>
          <!-- Catalog Pagination -->
          <div v-if="totalCatalogItems > catalogLimit" class="p-4 bg-gray-50/50 border-t border-gray-100 flex justify-center">
            <BasePagination 
              :total="totalCatalogItems" 
              :items-per-page="catalogLimit" 
              v-model:page="catalogPage" 
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Tabela de Itens Selecionados -->
    <div class="space-y-6">
      <h3 class="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Escopo do Orçamento</h3>
      <div class="space-y-4">
        <div v-for="(item, idx) in form.items" :key="idx" class="bg-white p-6 rounded-[2.5rem] border-2 border-gray-100 shadow-sm space-y-4">
          <div class="flex justify-between items-start gap-4">
            <div class="flex-1 space-y-4">
              <input v-model="item.name" class="w-full text-xl font-black text-gray-900 bg-transparent border-none focus:ring-0 p-0" placeholder="Nome do Serviço">
              <div class="relative">
                <textarea 
                  v-model="item.description" 
                  rows="2" 
                  class="w-full text-sm font-medium text-gray-500 bg-gray-50 p-4 rounded-2xl border-none focus:ring-4 focus:ring-blue-500/5 outline-none resize-none" 
                  placeholder="Descreva o que será entregue..."
                ></textarea>
                <button 
                  type="button"
                  @click="generateDescription(idx)"
                  class="absolute bottom-3 right-3 p-2 bg-white rounded-xl shadow-lg border border-gray-100 text-blue-600 hover:scale-110 transition-all"
                  title="Melhorar com IA"
                >
                  <Sparkles class="w-4 h-4" />
                </button>
              </div>
            </div>
            <button @click="form.items.splice(idx, 1)" type="button" class="p-3 text-red-300 hover:text-red-500 transition-colors">
              <Trash2 class="w-5 h-5" />
            </button>
          </div>
          
          <div class="flex flex-wrap items-center gap-6 pt-2">
            <div class="flex items-center gap-3">
              <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preço R$</span>
              <input v-model.number="item.price" type="number" class="w-24 bg-gray-50 px-4 py-2 rounded-xl font-bold text-sm border-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div class="flex items-center gap-3">
              <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Qtd</span>
              <input v-model.number="item.quantity" type="number" class="w-16 bg-gray-50 px-4 py-2 rounded-xl font-bold text-sm border-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div class="ml-auto text-right">
              <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Subtotal</span>
              <span class="text-lg font-black text-gray-900">R$ {{ (item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Ajustes & Pagamento -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
      <div class="space-y-8">
        <div class="bg-gray-50 p-8 rounded-[3rem] space-y-6">
          <h3 class="text-xs font-black text-gray-900 uppercase tracking-widest">Condições de Pagamento</h3>
          
          <div class="grid grid-cols-2 gap-4">
            <BaseInput v-model.number="form.paymentConfig.installments" label="Max. Parcelas" type="number" />
            <BaseInput v-model.number="form.paymentConfig.cashDiscount" label="Desc. À Vista (%)" type="number" />
          </div>

          <div class="space-y-3">
            <label class="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Método de Envio</label>
            <div class="flex gap-2 p-1 bg-white rounded-2xl border border-gray-100">
              <button 
                type="button"
                @click="form.sendMethod = 'auto'"
                :class="form.sendMethod === 'auto' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'"
                class="flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
              >
                Auto (E-mail)
              </button>
              <button 
                type="button"
                @click="form.sendMethod = 'manual'"
                :class="form.sendMethod === 'manual' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'"
                class="flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
              >
                Manual (Link)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-8">
        <div class="bg-blue-600 text-white p-10 rounded-[3.5rem] shadow-2xl shadow-blue-200 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          
          <div class="relative z-10 space-y-6">
            <div class="flex justify-between items-center text-blue-100">
              <span class="text-[10px] font-black uppercase tracking-widest">Resumo Financeiro</span>
              <span class="bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Investimento Final</span>
            </div>

            <div class="space-y-2">
              <div class="flex justify-between text-sm opacity-80">
                <span>Subtotal</span>
                <span>R$ {{ form.items.reduce((acc, i) => acc + (i.price * i.quantity), 0).toLocaleString('pt-BR') }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs font-bold">Acréscimo R$</span>
                <input v-model.number="form.totals.additional" type="number" class="w-24 bg-white/10 border-none rounded-xl text-right font-black py-1 focus:ring-2 focus:ring-white/30">
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs font-bold">Desconto R$</span>
                <input v-model.number="form.totals.discount" type="number" class="w-24 bg-white/10 border-none rounded-xl text-right font-black py-1 focus:ring-2 focus:ring-white/30">
              </div>
            </div>

            <div class="pt-6 border-t border-white/20">
              <p class="text-5xl font-black tracking-tighter">R$ {{ finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
              <p class="text-[10px] font-black uppercase tracking-widest mt-4 text-blue-200">
                À vista com {{ form.paymentConfig.cashDiscount }}% desc. ou {{ form.paymentConfig.installments }}x sem juros
              </p>
            </div>
          </div>
        </div>

        <BaseButton 
          type="submit" 
          :disabled="isSubmitting"
          class="w-full py-6 rounded-[2rem] text-sm shadow-2xl shadow-blue-100"
        >
          <Loader2 v-if="isSubmitting" class="w-5 h-5 animate-spin mr-3" />
          {{ isEditing ? 'SALVAR ALTERAÇÕES' : 'GERAR ORÇAMENTO AGORA' }}
        </BaseButton>
      </div>
    </div>
  </form>
</template>
