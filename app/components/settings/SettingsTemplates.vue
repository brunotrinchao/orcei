<script setup lang="ts">
import { ref, computed } from 'vue'
import { FileText } from 'lucide-vue-next'

const props = defineProps<{
  contractTemplate: string
  termsAndConditions: string
}>()

const emit = defineEmits<{
  (e: 'update:contractTemplate', val: string): void
  (e: 'update:termsAndConditions', val: string): void
}>()

const activeTab = ref<'contract' | 'terms'>('contract')

const localContractTemplate = computed({
  get: () => props.contractTemplate,
  set: (val) => emit('update:contractTemplate', val)
})

const localTermsAndConditions = computed({
  get: () => props.termsAndConditions,
  set: (val) => emit('update:termsAndConditions', val)
})
</script>

<template>
  <section id="modelos" class="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm scroll-mt-8">
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
        <FileText class="w-5 h-5 text-purple-600" />
      </div>
      <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Modelos Legais</h2>
    </div>

    <div class="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-8 max-w-sm">
      <button
        type="button"
        @click="activeTab = 'contract'"
        :class="activeTab === 'contract' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-700'"
        class="flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
      >
        Contrato
      </button>
      <button
        type="button"
        @click="activeTab = 'terms'"
        :class="activeTab === 'terms' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-700'"
        class="flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
      >
        Termos
      </button>
    </div>

    <div v-show="activeTab === 'contract'" class="space-y-4">
      <label class="block text-xs font-black text-gray-600 uppercase tracking-widest ml-1">Contrato Padrão</label>
      <RichTextEditor v-model="localContractTemplate" class="min-h-[350px] border-2 border-gray-50 rounded-3xl overflow-hidden" />
    </div>
    <div v-show="activeTab === 'terms'" class="space-y-4">
      <label class="block text-xs font-black text-gray-600 uppercase tracking-widest ml-1">Termos e Condições</label>
      <RichTextEditor v-model="localTermsAndConditions" class="min-h-[350px] border-2 border-gray-50 rounded-3xl overflow-hidden" />
    </div>
  </section>
</template>
