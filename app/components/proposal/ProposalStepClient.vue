<!-- app/components/proposal/ProposalStepClient.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Sparkles, Loader2, User } from 'lucide-vue-next'

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
  get: () => props.clientSearch || '',
  set: (val) => emit('update:clientSearch', val)
})

function onClientSelect(clientId: string | undefined) {
  internalSelectedClient.value = clientId || ''
  if (!clientId) {
    props.form.client.name = ''
    props.form.client.email = ''
    props.form.client.phone = ''
    return
  }

  const found = props.clients.find((c: any) => c._id === clientId)
  if (found) {
    props.form.client.name = found.name
    props.form.client.email = found.email
    props.form.client.phone = found.phone || ''
  }
}

// Extrator de Leads com IA
const isAIExtractOpen = ref(false)
const rawLeadText = ref('')
const isExtracting = ref(false)
const { notify } = useAlerts()
const { 
  isCreditConfirmOpen, 
  confirmTitle, 
  confirmDescription, 
  executeWithCreditCheck, 
  handleCreditConfirm, 
  handleCreditCancel 
} = useConfirmCreditAction()

async function extractClient() {
  if (!rawLeadText.value.trim()) return

  executeWithCreditCheck('clientExtract', async () => {
    isExtracting.value = true
    try {
      const data: any = await $fetch('/api/ai/client-extract', {
        method: 'POST',
        body: { text: rawLeadText.value }
      })

      if (!data.name || !data.email) {
        notify('Extração Parcial', 'A IA não conseguiu identificar nome e e-mail com clareza. Verifique o texto.')
        return
      }

      // Tenta salvar/cadastrar o cliente extraído via API
      const createdClient: any = await $fetch('/api/clients', {
        method: 'POST',
        body: {
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          notes: `Importado via IA em ${new Date().toLocaleDateString('pt-BR')}`
        }
      })

      emit('update:selectedClientId', createdClient._id || createdClient.id)
      props.form.client.name = createdClient.name
      props.form.client.email = createdClient.email
      props.form.client.phone = createdClient.phone || ''

      notify('Cliente Cadastrado!', `${createdClient.name} foi extraído e selecionado automaticamente.`)
      isAIExtractOpen.value = false
      rawLeadText.value = ''
    } catch (e: any) {
      notify('Erro', e.data?.statusMessage || 'Não foi possível extrair os dados do cliente com IA.')
    } finally {
      isExtracting.value = false
    }
  }, { title: 'Extrair Dados do Cliente com IA' })
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div class="space-y-2">
      <h3 class="text-lg font-black text-gray-900 dark:text-white tracking-tight">Detalhes do Orçamento</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Comece dando um nome ao seu projeto e identificando o cliente.</p>
    </div>

    <BaseSectionCard title="Dados do Cliente" :icon="User">
      <template #header-actions>
        <BaseButton 
          type="button"
          variant="ghost"
          size="sm"
          @click="isAIExtractOpen = !isAIExtractOpen"
          class="text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30"
        >
          <Sparkles class="w-3.5 h-3.5 mr-1 shrink-0" />
          {{ isAIExtractOpen ? 'Buscar Cadastrado' : 'Importar Conversa/E-mail com IA' }}
        </BaseButton>
      </template>

      <div class="space-y-6">
        <!-- Extrator de Leads com IA (Design Glassmorphic/Premium) -->
        <div v-if="isAIExtractOpen" class="space-y-4 p-6 bg-gradient-to-br from-violet-50 to-fuchsia-50/50 dark:from-violet-950/20 dark:to-fuchsia-950/10 border border-violet-100/50 dark:border-violet-900/30 rounded-[0.5rem] animate-in fade-in slide-in-from-bottom-2 duration-300">
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
              class="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white"
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
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-0">
          <div class="md:col-span-2">
            <BaseInput v-model="form.client.name" label="Nome do Cliente" readonly disabled required />
          </div>
          <BaseInput v-model="form.client.email" label="E-mail" readonly disabled required />
          <BaseInput v-model="form.client.phone" label="WhatsApp" readonly disabled />
        </div>
      </div>
    </BaseSectionCard>

    <ConfirmCreditDialog
      v-model:open="isCreditConfirmOpen"
      :title="confirmTitle"
      :description="confirmDescription"
      @confirm="handleCreditConfirm"
      @cancel="handleCreditCancel"
    />
  </div>
</template>
