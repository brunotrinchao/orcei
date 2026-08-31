<script setup lang="ts">
import { useSettingsBusinessRules } from './index'

const props = defineProps<{
  profile: {
    defaultValidityDays?: number
    defaultCashDiscount?: number
    defaultAcceptCreditCard?: boolean
    defaultInstallments?: number
  }
  isSaving?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:profile', val: any): void
  (e: 'save'): void
}>()

const { localProfile, Briefcase } = useSettingsBusinessRules(props, emit)
</script>

<template>
  <BaseCard
    id="negocio"
    data-tour="config-regras-negocio"
    title="Regras de Negócio"
    :icon="Briefcase"
    icon-bg-class="bg-emerald-50 dark:bg-emerald-950/50"
    icon-color-class="text-emerald-600 dark:text-emerald-400"
  >
    <div class="space-y-6 settings-business-rules-container">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <BaseInput
          v-model.number="localProfile.defaultValidityDays"
          label="Validade Padrão"
          type="number"
          suffix="dias"
        />
        <BaseInput
          v-model.number="localProfile.defaultCashDiscount"
          label="Desconto (À Vista)"
          type="number"
          suffix="%"
        />
      </div>

      <!-- Opção de Aceitar Cartão de Crédito -->
      <div class="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <label class="text-xs font-bold text-gray-900 dark:text-white block">Aceitar Cartão de Crédito</label>
            <p class="text-[11px] text-gray-500">Habilita a opção de pagamento via cartão de crédito por padrão em novas propostas</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="localProfile.defaultAcceptCreditCard" class="sr-only peer">
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        <div v-if="localProfile.defaultAcceptCreditCard" class="pt-3 border-t border-gray-200 dark:border-gray-800 max-w-xs">
          <BaseInput
            v-model.number="localProfile.defaultInstallments"
            label="Parcelamento Máximo (Cartão)"
            type="number"
            suffix="x"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <BaseButton type="button" size="md" class="shrink-0" :disabled="isSaving" :loading="isSaving" @click="emit('save')">
        {{ isSaving ? 'Salvando...' : 'Salvar' }}
      </BaseButton>
    </template>
  </BaseCard>
</template>

<style scoped src="./index.css"></style>
