<script setup lang="ts">
import { ref } from 'vue'
import { Upload, Download } from 'lucide-vue-next'
import BulkImportModal from './BulkImportModal.vue'

const modalOpen = ref(false)
const modalType = ref<'client' | 'catalog'>('client')

function openModal(type: 'client' | 'catalog') {
  modalType.value = type
  modalOpen.value = true
}

const cards = [
  {
    type: 'client' as const,
    title: 'Clientes',
    description: 'Importe vários clientes de uma vez a partir de um arquivo CSV.',
    templateHref: '/templates/modelo-clientes.csv'
  },
  {
    type: 'catalog' as const,
    title: 'Catálogo',
    description: 'Importe vários produtos ou serviços de uma vez a partir de um arquivo CSV.',
    templateHref: '/templates/modelo-catalogo.csv'
  }
]
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div
        v-for="card in cards"
        :key="card.type"
        class="rounded-[0.75rem] border border-gray-200 dark:border-gray-800 p-6 space-y-4"
      >
        <div>
          <h3 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wide">{{ card.title }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ card.description }}</p>
        </div>

        <a
          :href="card.templateHref"
          download
          class="inline-flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:underline"
        >
          <Download class="w-4 h-4" />
          Baixar modelo CSV
        </a>

        <BaseButton type="button" class="w-full" @click="openModal(card.type)">
          <Upload class="w-4 h-4 mr-2" />
          Processar importação
        </BaseButton>
      </div>
    </div>

    <BulkImportModal v-model:open="modalOpen" :type="modalType" />
  </div>
</template>
