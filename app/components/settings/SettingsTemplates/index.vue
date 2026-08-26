<script setup lang="ts">
import { useSettingsTemplates } from './index'

const props = defineProps<{
  contractTemplate: string
  termsAndConditions: string
}>()

const emit = defineEmits<{
  (e: 'update:contractTemplate', val: string): void
  (e: 'update:termsAndConditions', val: string): void
}>()

const {
  availableVariables,
  copiedTag,
  copyTag,
  activeTab,
  localContractTemplate,
  localTermsAndConditions,
  FileText,
  Variable,
  Copy,
  Check
} = useSettingsTemplates(props, emit)
</script>

<template>
  <BaseSectionCard id="modelos" title="Modelos Legais" :icon="FileText" icon-bg-class="bg-blue-50 dark:bg-blue-950/50" icon-color-class="text-blue-600 dark:text-blue-400">

    <div class="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-[0.75rem] mb-8 max-w-sm settings-templates-container">
      <BaseButton
        type="button"
        data-tour="config-modelo-contrato"
        @click="activeTab = 'contract'"
        :variant="activeTab === 'contract' ? 'solid' : 'ghost'"
        size="sm"
        class="flex-1"
      >
        Contrato
      </BaseButton>
      <BaseButton
        type="button"
        data-tour="config-modelo-termos"
        @click="activeTab = 'terms'"
        :variant="activeTab === 'terms' ? 'solid' : 'ghost'"
        size="sm"
        class="flex-1"
      >
        Termos
      </BaseButton>
    </div>

    <!-- Lista de Variáveis Dinâmicas -->
    <div class="mb-8 p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-[0.75rem] border border-slate-100 dark:border-slate-800">
      <div class="flex items-center gap-2 mb-4">
        <Variable class="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <h3 class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Variáveis Dinâmicas</h3>
      </div>
      <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">
        Clique em uma variável para copiá-la e use-a no seu texto. Ela será substituída automaticamente na geração do orçamento ou contrato.
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="v in availableVariables"
          :key="v.tag"
          @click="copyTag(v.tag)"
          class="group flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-[0.75rem] transition-all"
          :title="v.desc"
        >
          <span class="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400">{{ v.tag }}</span>
          <Check v-if="copiedTag === v.tag" class="w-3 h-3 text-emerald-500" />
          <Copy v-else class="w-3 h-3 text-slate-300 dark:text-slate-600 group-hover:text-blue-400" />
        </button>
      </div>
    </div>

    <div v-show="activeTab === 'contract'" class="space-y-4">
      <label class="block text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest ml-1">Contrato Padrão</label>
      <LazyRichTextEditor v-model="localContractTemplate" class="min-h-[350px] border-2 border-gray-50 dark:border-gray-800 rounded-[0.75rem] overflow-hidden" />
    </div>
    <div v-show="activeTab === 'terms'" class="space-y-4">
      <label class="block text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest ml-1">Termos e Condições</label>
      <LazyRichTextEditor v-model="localTermsAndConditions" class="min-h-[350px] border-2 border-gray-50 dark:border-gray-800 rounded-[0.75rem] overflow-hidden" />
    </div>
  </BaseSectionCard>
</template>

<style scoped src="./index.css"></style>
