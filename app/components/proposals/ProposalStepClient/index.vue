<script setup lang="ts">
import { ArrowBigDown, ArrowDown, Search } from 'lucide-vue-next';
import { useProposalStepClient } from './index'

const props = defineProps<{
  form: any
  clients: any[]
  selectedClientId: string
  clientSearch?: string
  pending?: boolean
}>()

const emit = defineEmits(['update:selectedClientId', 'update:clientSearch'])

const {
  creditLabel,
  clientOptions,
  internalSelectedClient,
  internalSearch,
  validate,
  reset,
  emailFormatError,
  isManualOpen,
  isCreatingManual,
  manualClient,
  openManualCreate,
  createManualClient,
  onClientSelect,
  isAIExtractOpen,
  isExtracting,
  rawLeadText,
  maxClientExtractLength,
  extractClient,
  isCreditConfirmOpen,
  confirmTitle,
  confirmDescription,
  handleCreditConfirm,
  handleCreditCancel,
  Sparkles,
  Loader2,
  User,
  UserPlus,
  Plus
} = useProposalStepClient(props, emit)

defineExpose({ validate, reset })
</script>

<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 proposal-step-client-container">

    <div>
      <div class="w-full mb-2 flex justify-end">
        <BaseButton 
          type="button"
          :variant="!isAIExtractOpen ? 'ia' : 'ghost'"
          size="xs"
          @click="isAIExtractOpen = !isAIExtractOpen"
        >
        <Sparkles v-if="!isAIExtractOpen"class="w-3.5 h-3.5 mr-1 shrink-0"/>
          <Search v-else class="w-3.5 h-3.5 mr-1 shrink-0" />
          {{ isAIExtractOpen ? 'Buscar Cadastrado' : 'Usar IA' }}
        </BaseButton>
      </div>

      <div class="space-y-6">
        <!-- Extrator de Leads com IA ou Busca de Cliente Cadastrado com transição suave -->
        <Transition name="section-fade-slide" mode="out-in">
          <div v-if="isAIExtractOpen" key="ai-extract-section" class="space-y-4 p-6 bg-gradient-to-br from-violet-50 to-fuchsia-50/50 dark:from-violet-950/20 dark:to-fuchsia-950/10 border border-violet-100/50 dark:border-violet-900/30 rounded-[.5rem]">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-[.5rem] bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 flex items-center justify-center shrink-0">
                  <Sparkles class="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Extração inteligente de dados</h4>
                  <p class="text-xs text-muted">Cole a conversa ou anotação do lead — a IA cadastra o cliente por você.</p>
                </div>
              </div>
            </div>

            <BaseTextarea
              v-model="rawLeadText"
              :rows="4"
              :maxLength="maxClientExtractLength"
              class="font-medium"
              placeholder="Ex: Oi, sou o João Silva. Preciso de uma proposta comercial. Meu e-mail é cliente@email.com e WhatsApp (11) 98888-7777..."
            />
            <div class="flex items-center justify-between gap-3">
              <span class="text-[11px] text-muted tabular-nums">{{ rawLeadText.length }}/{{ maxClientExtractLength }}</span>
              <BaseButton
                type="button"
                @click="extractClient"
                 :tooltip="creditLabel('clientExtract')"
                :disabled="!rawLeadText.trim() || rawLeadText.length > maxClientExtractLength || isExtracting"
                class="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white"
              >
                <Loader2 v-if="isExtracting" class="w-4 h-4 animate-spin mr-2" />
                <Sparkles v-else class="w-4 h-4 mr-2" />
                Extrair e Cadastrar
              </BaseButton>
            </div>
          </div>

          <div v-else key="search-client-section" class="space-y-2">
            <div class="flex items-start gap-2">
              <div class="flex-1">
                <BaseCombobox
                  v-model="internalSelectedClient"
                  v-model:search="internalSearch"
                  label="Buscar Cliente Cadastrado"
                  :options="clientOptions"
                  :loading="pending"
                  :show-avatar="false"
                  placeholder="Selecione ou busque..."
                  @update:model-value="onClientSelect"
                />
              </div>
              <div class="flex flex-col gap-2 shrink-0">
                <span class="block text-[10px] ml-2 invisible" aria-hidden="true">&nbsp;</span>
                <BaseButton
                  type="button"
                  variant="ghost"
                  title="Cadastrar novo cliente"
                  iconOnly
                  @click="openManualCreate()"
                >
                  <Plus class="w-4 h-4" />
                </BaseButton>
              </div>
            </div>
            <div v-if="internalSearch.trim() && internalSearch.trim().length < 2" class="px-1">
              <p class="text-xs text-muted">Digite ao menos 2 caracteres para buscar no cadastro.</p>
            </div>
            <div v-else-if="!pending && internalSearch.trim().length >= 2 && clientOptions.length === 0" class="flex items-center justify-between gap-3 px-1">
              <span class="text-xs font-semibold text-muted">Nenhum cliente encontrado para "{{ internalSearch }}".</span>
              <BaseButton type="button" variant="outline" size="sm" @click="openManualCreate(internalSearch)">
                <UserPlus class="w-3.5 h-3.5 mr-1.5" />
                Cadastrar este cliente
              </BaseButton>
            </div>
          </div>
        </Transition>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-0">
          <div class="md:col-span-2">
            <BaseInput v-model="form.client.name" label="Nome do Cliente" readonly disabled required />
          </div>
          <BaseInput v-model="form.client.email" label="E-mail" readonly disabled required :error="emailFormatError" />
          <BaseInput v-model="form.client.phone" label="WhatsApp" readonly disabled />
        </div>
      </div>
    </div>

    <!-- Drawer de Cadastro Rápido -->
    <BaseDrawer
      v-model:open="isManualOpen"
      title="Novo Cliente"
      description="Informe nome e pelo menos um contato. Endereço e demais dados podem ser completados depois em Clientes."
      size="lg"
    >
      <form id="manual-client-form" @submit.prevent="createManualClient" class="grid grid-cols-1 gap-4 py-2">
        <BaseInput v-model="manualClient.name" label="Nome do Cliente" placeholder="Ex: João Silva" required />
        <BaseInput v-model="manualClient.email" type="email" label="E-mail" placeholder="cliente@email.com" />
        <BaseInput v-model="manualClient.phone" label="Telefone / WhatsApp" placeholder="(00) 00000-0000" mask="phone"/>
      </form>

      <template #footer>
        <BaseButton type="button" variant="secondary" @click="isManualOpen = false">
          Cancelar
        </BaseButton>
        <BaseButton type="submit" form="manual-client-form" :loading="isCreatingManual">
          Cadastrar
        </BaseButton>
      </template>
    </BaseDrawer>

    <ConfirmCreditDialog
      v-model:open="isCreditConfirmOpen"
      :title="confirmTitle"
      :description="confirmDescription"
      @confirm="handleCreditConfirm"
      @cancel="handleCreditCancel"
    />
  </div>
</template>

<style scoped src="./index.css"></style>
