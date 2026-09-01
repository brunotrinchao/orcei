<script setup lang="ts">
import { useWizardProductStep, type WizardProductData } from './index'

const props = defineProps<{
  modelValue: WizardProductData
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: WizardProductData): void
}>()

const { Package, Tag, DollarSign, FileText, Wrench, Sparkles } = useWizardProductStep()

function updateField(key: keyof WizardProductData, val: any) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: val
  })
}
</script>

<template>
  <div class="space-y-6 max-w-xl mx-auto py-2 wizard-product-container">
    <!-- Dica Inicial -->
    <div class="flex items-center gap-3 p-4 bg-blue-50/60 dark:bg-blue-950/20 rounded-[.5rem] border border-blue-100 dark:border-blue-900/40">
      <Sparkles class="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
      <p class="text-xs text-blue-700 dark:text-blue-300 font-medium">
        Adicione um serviço ou produto padrão para montar orçamentos mais rápido.
      </p>
    </div>

    <!-- Campos do Formulário -->
    <div class="space-y-4">
      <!-- Seletor de Tipo (Serviço x Produto) -->
      <div class="space-y-2">
        <label class="form-label block mb-1.5 ml-1">
          Tipo de Item
        </label>
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            @click="updateField('type', 'service')"
            :class="[
              'flex items-center justify-center gap-2 p-3 rounded-[.5rem] border text-xs font-bold transition-all cursor-pointer',
              modelValue.type === 'service'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'border-gray-200 dark:border-gray-800 text-gray-500 hover:border-gray-300 dark:hover:border-gray-700'
            ]"
          >
            <Wrench class="w-4 h-4" />
            Serviço
          </button>
          <button
            type="button"
            @click="updateField('type', 'product')"
            :class="[
              'flex items-center justify-center gap-2 p-3 rounded-[.5rem] border text-xs font-bold transition-all cursor-pointer',
              modelValue.type === 'product'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'border-gray-200 dark:border-gray-800 text-gray-500 hover:border-gray-300 dark:hover:border-gray-700'
            ]"
          >
            <Package class="w-4 h-4" />
            Produto
          </button>
        </div>
      </div>

      <!-- Nome do Item (Obrigatório) -->
      <BaseInput
        :model-value="modelValue.name"
        @update:model-value="updateField('name', $event)"
        :label="modelValue.type === 'service' ? 'Nome do Serviço' : 'Nome do Produto'"
        placeholder="Ex: Consultoria Técnica ou Peça de Reposição"
        :icon="Tag"
        :required="true"
      />

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Preço Base -->
        <BaseInput
          :model-value="modelValue.price"
          @update:model-value="updateField('price', $event)"
          label="Valor Unitário ou Hora (R$)"
          mask="currency"
          placeholder="R$ 0,00"
          :icon="DollarSign"
        />

        <!-- Unidade de Medida -->
        <BaseInput
          :model-value="modelValue.unit"
          @update:model-value="updateField('unit', $event)"
          label="Unidade de Medida"
          placeholder="UN, Hora, M², Serviço"
        />
      </div>

      <!-- Descrição (Opcional) -->
      <div class="space-y-2">
        <label class="form-label block mb-1.5 ml-1">
          Descrição Detalhada (Opcional)
        </label>
        <textarea
          :value="modelValue.description"
          @input="updateField('description', ($event.target as HTMLTextAreaElement).value)"
          rows="3"
          placeholder="Descreva o que está incluso neste serviço ou produto..."
          class="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[.5rem] text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<style scoped src="./index.css"></style>
