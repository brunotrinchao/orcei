<!-- app/components/proposal/ProposalStepClient.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Sparkles, Loader2, User, UserPlus, Plus } from 'lucide-vue-next'
import { useFormValidation } from '~/composables/useFormValidation'

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

// Validação padrão do wizard (mesmo composable/UX do Setup Wizard): borda
// vermelha + "Campo obrigatório" abaixo do campo, só depois da 1ª tentativa
// de avançar. Os campos "proxy" de Nome/E-mail do cliente (readonly/disabled,
// abaixo) têm `required` e se auto-registram aqui.
const { validate, reset, submitAttempted } = useFormValidation()

const emailFormatError = computed(() => {
  if (!submitAttempted.value) return ''
  const value = form.client.email?.trim()
  if (!value) return '' // campo vazio já mostra "Campo obrigatório" via required
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value) ? '' : 'E-mail informado é inválido'
})

defineExpose({ validate, reset })

// Cadastro Rápido: cliente inline sem sair da tela de orçamento e sem custo de IA.
// Só exige nome + (e-mail ou telefone) — endereço fica pra completar depois em Clientes.
const isManualOpen = ref(false)
const isCreatingManual = ref(false)
const manualClient = ref({ name: '', email: '', phone: '' })

function openManualCreate(prefillName?: string) {
  isAIExtractOpen.value = false
  isManualOpen.value = true
  if (prefillName) manualClient.value.name = prefillName
}

async function createManualClient() {
  if (!manualClient.value.name.trim()) {
    notify('Aviso', 'Informe o nome do cliente.')
    return
  }
  if (!manualClient.value.email.trim() && !manualClient.value.phone.trim()) {
    notify('Aviso', 'Informe e-mail ou telefone/WhatsApp do cliente.')
    return
  }

  isCreatingManual.value = true
  try {
    const created: any = await $fetch('/api/clients', {
      method: 'POST',
      body: {
        name: manualClient.value.name.trim(),
        email: manualClient.value.email.trim() || undefined,
        phone: manualClient.value.phone.trim() || undefined
      }
    })
    emit('update:selectedClientId', created._id || created.id)
    props.form.client.name = created.name
    props.form.client.email = created.email || ''
    props.form.client.phone = created.phone || ''
    notify('Cliente cadastrado!', `${created.name} foi cadastrado e selecionado.`)
    isManualOpen.value = false
    manualClient.value = { name: '', email: '', phone: '' }
  } catch (e: any) {
    const html = parseApiErrors(e)
    notify(html ? 'Dados inválidos' : 'Erro', html ?? (e.data?.statusMessage || 'Não foi possível cadastrar o cliente.'))
  } finally {
    isCreatingManual.value = false
  }
}

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

    <BaseSectionCard title="Dados do Cliente" :icon="User" :noBorder="true">
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
        <div v-if="isAIExtractOpen" class="space-y-4 p-6 bg-gradient-to-br from-violet-50 to-fuchsia-50/50 dark:from-violet-950/20 dark:to-fuchsia-950/10 border border-violet-100/50 dark:border-violet-900/30 rounded-[0.75rem] animate-in fade-in slide-in-from-bottom-2 duration-300">
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

        <div v-if="!isAIExtractOpen" class="space-y-2">
          <div class="flex items-start gap-2">
            <div class="flex-1">
              <BaseCombobox
                v-model="internalSelectedClient"
                v-model:search="internalSearch"
                label="Buscar Cliente Cadastrado"
                :options="clientOptions"
                :loading="pending"
                placeholder="Selecione ou busque..."
                @update:model-value="onClientSelect"
              />
            </div>
            <!-- Spacer invisível reproduz altura do label do combobox pra botão alinhar com o input, não com o componente inteiro -->
            <div class="flex flex-col gap-2 shrink-0">
              <span class="block text-[10px] ml-2 invisible" aria-hidden="true">&nbsp;</span>
              <BaseButton
                type="button"
                variant="outline"
                title="Cadastrar novo cliente"
                aria-label="Cadastrar novo cliente"
                style="height: 3.5rem; width: 3.5rem; padding: 0;"
                class="flex items-center justify-center"
                @click="openManualCreate()"
              >
                <Plus class="w-4 h-4" />
              </BaseButton>
            </div>
          </div>
          <!-- Busca vazia: atalho direto pro cadastro rápido -->
          <div v-if="!pending && internalSearch.trim() && clientOptions.length === 0" class="flex items-center justify-between gap-3 px-1">
            <span class="text-xs font-bold text-gray-500 dark:text-gray-400">Nenhum cliente encontrado para "{{ internalSearch }}".</span>
            <BaseButton type="button" variant="outline" size="sm" @click="openManualCreate(internalSearch)">
              <UserPlus class="w-3.5 h-3.5 mr-1.5" />
              Cadastrar este cliente
            </BaseButton>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-0">
          <div class="md:col-span-2">
            <BaseInput v-model="form.client.name" label="Nome do Cliente" readonly disabled required />
          </div>
          <BaseInput v-model="form.client.email" label="E-mail" readonly disabled required :error="emailFormatError" />
          <BaseInput v-model="form.client.phone" label="WhatsApp" readonly disabled />
        </div>
      </div>
    </BaseSectionCard>

    <!-- Modal de Cadastro Rápido: nome + e-mail/telefone, sem custo de IA -->
    <BaseDialog
      v-model:open="isManualOpen"
      title="Novo Cliente"
      description="Informe nome e pelo menos um contato. Endereço e demais dados podem ser completados depois em Clientes."
      size="sm"
    >
      <form id="manual-client-form" @submit.prevent="createManualClient" class="grid grid-cols-1 gap-4 py-2">
        <BaseInput v-model="manualClient.name" label="Nome do Cliente" placeholder="Ex: João Silva" required />
        <BaseInput v-model="manualClient.email" type="email" label="E-mail" placeholder="cliente@email.com" />
        <BaseInput v-model="manualClient.phone" label="Telefone / WhatsApp" placeholder="(00) 00000-0000" mask="phone" />
      </form>

      <template #footer>
        <BaseButton type="button" variant="secondary" @click="isManualOpen = false">
          Cancelar
        </BaseButton>
        <BaseButton type="submit" form="manual-client-form" :loading="isCreatingManual">
          Cadastrar
        </BaseButton>
      </template>
    </BaseDialog>

    <ConfirmCreditDialog
      v-model:open="isCreditConfirmOpen"
      :title="confirmTitle"
      :description="confirmDescription"
      @confirm="handleCreditConfirm"
      @cancel="handleCreditCancel"
    />
  </div>
</template>
