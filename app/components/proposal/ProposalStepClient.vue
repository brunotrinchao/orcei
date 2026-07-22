<!-- app/components/proposal/ProposalStepClient.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Sparkles, Loader2 } from 'lucide-vue-next'

const props = defineProps<{
  form: any
  clients: any[]
  selectedClientId: string
  clientSearch?: string
  pending?: boolean
}>()

const emit = defineEmits(['update:selectedClientId', 'update:clientSearch'])

const { creditLabel } = useCreditCosts()

const clientOptions = computed(() => {
  return props.clients.map((c: any) => ({
    label: c.name,
    value: c._id
  })) || []
})

const internalSelectedClient = computed({
  get: () => props.selectedClientId,
  set: (val) => emit('update:selectedClientId', val)
})

const internalSearch = computed({
  get: () => props.clientSearch,
  set: (val) => emit('update:clientSearch', val)
})

function onClientSelect(clientId: string | undefined) {
  internalSelectedClient.value = clientId || ''
  if (!clientId) return
  const client = props.clients.find((c: any) => c._id === clientId)
  if (client) {
    props.form.client.name = client.name
    props.form.client.email = client.email
    props.form.client.phone = client.phone || ''
  }
}

// Controle do Extrator Cognitivo de Leads com IA
const isAIExtractOpen = ref(false)
const rawLeadText = ref('')
const isExtracting = ref(false)
const { notify } = useAlerts()

async function extractClient() {
  if (!rawLeadText.value.trim()) return
  
  isExtracting.value = true
  try {
    // 1. Chamar o serviço de extração com IA
    const extractedData: any = await $fetch('/api/ai/client-extract', {
      method: 'POST',
      body: { text: rawLeadText.value }
    })
    
    if (!extractedData.name) {
      throw new Error('Não foi possível identificar o nome do cliente. Tente detalhar mais.')
    }
    
    // 2. Criar o cliente no banco de dados automaticamente
    const createdClient: any = await $fetch('/api/clients', {
      method: 'POST',
      body: {
        name: extractedData.name,
        email: extractedData.email || `${extractedData.name.toLowerCase().replace(/\s+/g, '')}@empresa.com`,
        phone: extractedData.phone || ''
      }
    })
    
    // 3. Selecionar o cliente recém-criado e preencher o formulário
    emit('update:selectedClientId', createdClient._id || createdClient.id)
    props.form.client.name = createdClient.name
    props.form.client.email = createdClient.email
    props.form.client.phone = createdClient.phone || ''
    
    // Feedback de Sucesso e Fechamento
    notify('Sucesso', 'Lead extraído e cliente cadastrado com sucesso!')
    isAIExtractOpen.value = false
    rawLeadText.value = ''
  } catch (e: any) {
    console.error('Extraction client error:', e)
    notify('Erro na Extração', e.message || e.data?.statusMessage || 'Erro ao processar dados com IA.')
  } finally {
    isExtracting.value = false
  }
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div class="space-y-2">
      <h3 class="text-lg font-black text-gray-900 dark:text-white tracking-tight">Detalhes do Orçamento</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Comece dando um nome ao seu projeto e identificando o cliente.</p>
    </div>

    <div class="space-y-6">
      
      <div class="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label class="block text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest ml-1">Dados do Cliente</label>
          <button 
            type="button"
            @click="isAIExtractOpen = !isAIExtractOpen"
            class="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 rounded-xl hover:bg-violet-100/80 transition-all inline-flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Sparkles class="w-3.5 h-3.5 shrink-0" />
            {{ isAIExtractOpen ? 'Buscar Cadastrado' : 'Importar Conversa/E-mail com IA' }}
          </button>
        </div>
        
        <!-- Extrator de Leads com IA (Design Glassmorphic/Premium) -->
        <div v-if="isAIExtractOpen" class="space-y-4 p-6 bg-gradient-to-br from-violet-50 to-fuchsia-50/50 dark:from-violet-950/20 dark:to-fuchsia-950/10 border border-violet-100/50 dark:border-violet-900/30 rounded-3xl animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div class="flex items-start gap-3">
            <Sparkles class="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5 animate-pulse" />
            <p class="text-xs text-slate-600 dark:text-slate-400 font-bold leading-relaxed">
              Cole o texto bruto recebido do seu lead (conversa do WhatsApp, e-mail ou anotação). A IA extrairá os dados e cadastrará o cliente automaticamente!
            </p>
          </div>
          
          <BaseTextarea
            v-model="rawLeadText"
            :rows="4"
            placeholder="Ex: Oi, sou o Bruno Trinchão. Preciso de uma proposta comercial. Meu e-mail é bruno@trinchao.dev e WhatsApp 11988887777..."
          />
          
          <div class="flex justify-end">
            <BaseButton 
              type="button" 
              @click="extractClient" 
              :disabled="!rawLeadText.trim() || isExtracting"
              class="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg shadow-violet-500/20 active:scale-98 transition-all"
            >
              <Loader2 v-if="isExtracting" class="w-4 h-4 animate-spin mr-2" />
              <Sparkles v-else class="w-4 h-4 mr-2" />
              {{ creditLabel('clientExtract', 'Extrair e Cadastrar') }}
            </BaseButton>
          </div>
        </div>

        <BaseCombobox 
          v-else
          v-model="internalSelectedClient" 
          v-model:search="internalSearch"
          label="Buscar Cliente Cadastrado" 
          :options="clientOptions"
          :loading="pending"
          placeholder="Selecione ou busque..."
          @update:model-value="onClientSelect"
        />
        
        <div class="p-6 bg-gray-50 dark:bg-gray-900/60 rounded-3xl border border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4 relative z-0">
          <div class="md:col-span-2">
            <BaseInput v-model="form.client.name" label="Nome do Cliente" readonly disabled required />
          </div>
          <BaseInput v-model="form.client.email" label="E-mail" readonly disabled required />
          <BaseInput v-model="form.client.phone" label="WhatsApp" readonly disabled />
        </div>
      </div>
    </div>
  </div>
</template>
