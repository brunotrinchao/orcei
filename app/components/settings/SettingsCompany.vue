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
  <section id="empresa" class="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm scroll-mt-8">
    <div class="flex items-center gap-3 mb-8">
      <div class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
        <Briefcase class="w-5 h-5 text-purple-600" />
      </div>
      <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Dados da Empresa</h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <BaseInput v-model="localCompany.tradeName" label="Nome Fantasia" required />
      <BaseInput v-model="localCompany.taxId" label="CNPJ" mask="cnpj" required />
      <div class="md:col-span-2">
        <BaseInput v-model="localCompany.legalName" label="Razão Social" required />
      </div>
    </div>
  </section>
</template>
