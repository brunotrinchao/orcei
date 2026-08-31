<script setup lang="ts">
import { useSettingsPrivacy } from './index'

const props = defineProps<{
  isExporting?: boolean
  isResetting?: boolean
  isDeleting?: boolean
  isSaving?: boolean
}>()

const emit = defineEmits<{
  (e: 'export'): void
  (e: 'reset'): void
  (e: 'delete'): void
  (e: 'save'): void
}>()

const { Shield } = useSettingsPrivacy()
</script>

<template>
  <BaseCard
    id="privacidade"
    data-tour="config-privacidade"
    title="Privacidade e Dados"
    :icon="Shield"
    icon-bg-class="bg-red-50 dark:bg-red-950/50"
    icon-color-class="text-red-600 dark:text-red-400"
  >
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 settings-privacy-container">
      <div class="p-8 bg-gray-50/50 dark:bg-gray-950/50 rounded-[0.75rem] border border-gray-100 dark:border-gray-800 space-y-4">
        <h3 class="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest">Backup Completo</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
          Exporte todos os seus dados cadastrados (Clientes, Catálogo, Orçamentos e Agenda) em formato JSON. O arquivo será enviado para o seu e-mail.
        </p>
        <BaseButton
          variant="secondary"
          size="sm"
          class="w-full sm:w-auto"
          :disabled="isExporting"
          :loading="isExporting"
          @click="emit('export')"
        >
          {{ isExporting ? 'Processando...' : 'Exportar Meus Dados' }}
        </BaseButton>
      </div>

      <div class="p-8 bg-orange-50/30 dark:bg-orange-950/20 rounded-[0.75rem] border border-orange-100 dark:border-orange-900/30 space-y-4">
        <h3 class="text-sm font-black text-orange-900 dark:text-orange-300 uppercase tracking-widest">Resetar Dados</h3>
        <p class="text-sm text-orange-700/70 dark:text-orange-400/80 font-medium leading-relaxed">
          Apaga Clientes, Catálogo, Orçamentos e Relatórios. Sua conta, plano e créditos permanecem intactos. Ação irreversível.
        </p>
        <BaseButton
          variant="outline"
          size="sm"
          class="w-full sm:w-auto text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/50 hover:bg-orange-50 dark:hover:bg-orange-950/40"
          :disabled="isResetting"
          :loading="isResetting"
          @click="emit('reset')"
        >
          {{ isResetting ? 'Resetando...' : 'Resetar Dados' }}
        </BaseButton>
      </div>

      <div class="p-8 bg-red-50/30 dark:bg-red-950/20 rounded-[0.75rem] border border-red-100 dark:border-red-900/30 space-y-4">
        <h3 class="text-sm font-black text-red-900 dark:text-red-300 uppercase tracking-widest">Encerrar Conta</h3>
        <p class="text-sm text-red-700/70 dark:text-red-400/80 font-medium leading-relaxed">
          Ao excluir sua conta, todos os seus dados serão apagados permanentemente. Esta ação não pode ser desfeita.
        </p>
        <BaseButton
          variant="outline"
          size="sm"
          class="w-full sm:w-auto text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40"
          :disabled="isDeleting"
          :loading="isDeleting"
          @click="emit('delete')"
        >
          {{ isDeleting ? 'Excluindo...' : 'Excluir Minha Conta' }}
        </BaseButton>
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
