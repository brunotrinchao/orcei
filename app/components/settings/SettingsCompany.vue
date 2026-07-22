<script setup lang="ts">
import { computed } from 'vue'
import { Briefcase } from 'lucide-vue-next'

const props = defineProps<{
  company: {
    taxId: string
    legalName: string
    tradeName: string
  }
}>()

const emit = defineEmits<{
  (e: 'update:company', val: any): void
}>()

const localCompany = computed({
  get: () => props.company,
  set: (val) => emit('update:company', val)
})
</script>

<template>
  <BaseSectionCard id="empresa" data-tour="config-empresa" title="Dados da Empresa" :icon="Briefcase" icon-bg-class="bg-purple-50 dark:bg-purple-950/50" icon-color-class="text-purple-600 dark:text-purple-400">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <BaseInput v-model="localCompany.tradeName" label="Nome Fantasia" required />
      <BaseInput v-model="localCompany.taxId" label="CNPJ" mask="cnpj" required />
      <div class="md:col-span-2">
        <BaseInput v-model="localCompany.legalName" label="Razão Social" required />
      </div>
    </div>
  </BaseSectionCard>
</template>
