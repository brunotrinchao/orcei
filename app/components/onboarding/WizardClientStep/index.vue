<script setup lang="ts">
import { useWizardClientStep, type WizardClientData } from './index'

const props = defineProps<{
  modelValue: WizardClientData
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: WizardClientData): void
}>()

const { User, Mail, Phone, FileText, MapPin, CheckCircle2 } = useWizardClientStep()

const localData = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

function updateField(key: keyof WizardClientData, val: any) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: val
  })
}
</script>

<template>
  <div class="space-y-6 max-w-xl mx-auto py-2 wizard-client-container">
    <!-- Dica Inicial -->
    <div class="flex items-center gap-3 p-4 bg-blue-50/60 dark:bg-blue-950/20 rounded-[.5rem] border border-blue-100 dark:border-blue-900/40">
      <CheckCircle2 class="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
      <p class="text-xs text-blue-700 dark:text-blue-300 font-medium">
        Cadastre os dados da pessoa ou empresa que receberá seu primeiro orçamento no Orcei.
      </p>
    </div>

    <!-- Campos do Formulário -->
    <div class="space-y-4">
      <!-- Nome / Razão Social (Obrigatório) -->
      <BaseInput
        :model-value="localData.name"
        @update:model-value="updateField('name', $event)"
        label="Nome Completo ou Razão Social"
        placeholder="Ex: Maria Silva ou Empresa XYZ"
        :icon="User"
        :required="true"
      />

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- E-mail -->
        <BaseInput
          :model-value="localData.email"
          @update:model-value="updateField('email', $event)"
          label="E-mail de Contato"
          type="email"
          placeholder="exemplo@cliente.com"
          :icon="Mail"
        />

        <!-- Telefone / WhatsApp -->
        <BaseInput
          :model-value="localData.phone"
          @update:model-value="updateField('phone', $event)"
          label="Telefone / WhatsApp"
          mask="phone"
          placeholder="(00) 00000-0000"
          :icon="Phone"
        />
      </div>

      <!-- CPF ou CNPJ -->
      <BaseInput
        :model-value="localData.taxId"
        @update:model-value="updateField('taxId', $event)"
        label="CPF ou CNPJ (Opcional)"
        mask="document"
        placeholder="000.000.000-00 ou 00.000.000/0000-00"
        :icon="FileText"
      />

      <div class="grid grid-cols-3 gap-4">
        <!-- Cidade (2 cols) -->
        <div class="col-span-2">
          <BaseInput
            :model-value="localData.city"
            @update:model-value="updateField('city', $event)"
            label="Cidade"
            placeholder="Ex: São Paulo"
            :icon="MapPin"
          />
        </div>

        <!-- UF (1 col) -->
        <div>
          <BaseInput
            :model-value="localData.state"
            @update:model-value="updateField('state', $event)"
            label="Estado (UF)"
            placeholder="SP"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./index.css"></style>
