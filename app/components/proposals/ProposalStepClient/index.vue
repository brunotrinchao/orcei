<script setup lang="ts">
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
    <div class="space-y-2 px-3">
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
        <!-- Extrator de Leads com IA -->
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
            :maxLength="maxClientExtractLength"
            placeholder="Ex: Oi, sou o João Silva. Preciso de uma proposta comercial. Meu e-mail é cliente@email.com e WhatsApp (11) 98888-7777..."
          />
          
          <div class="flex justify-end">
            <BaseButton 
              type="button" 
              @click="extractClient" 
              :disabled="!rawLeadText.trim() || rawLeadText.length > maxClientExtractLength || isExtracting"
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

    <!-- Modal de Cadastro Rápido -->
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

<style scoped src="./index.css"></style>
