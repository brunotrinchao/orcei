<script setup lang="ts">
import BulkImportModal from '../BulkImportModal.vue'
import { useSettingsBulkImport } from './index'

const {
  modalOpen,
  modalType,
  openModal,
  cards,
  Upload,
  Download
} = useSettingsBulkImport()
</script>

<template>
  <div class="space-y-6 settings-bulk-import-container">
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

<style scoped src="./index.css"></style>
