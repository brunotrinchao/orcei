<script setup lang="ts">
import BulkImportModal from '../BulkImportModal.vue'
import { useSettingsBulkImport } from './index'

const {
  modalOpen,
  modalType,
  openModal,
  cards,
  importSteps,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles
} = useSettingsBulkImport()
</script>

<template>
  <BaseCard title="Múltiplos Cadastros">
    <div class="space-y-8 settings-bulk-import-container">
      
      <!-- Seção de Guia Passo a Passo -->
       <BaseCard color="slate" compact>
                <div class="flex items-center gap-2 mb-3">
          <Sparkles class="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 class="text-xs font-normal tracking-wide text-gray-900 dark:text-gray-100">Como funciona a importação em lote</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            v-for="step in importSteps"
            :key="step.step"
            class="bg-white dark:bg-gray-950 rounded-xl p-4 border border-slate-200/60 dark:border-gray-800 space-y-2 flex flex-col justify-between"
          >
            <div class="flex items-center justify-between">
              <span class="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-normal text-xs flex items-center justify-center">
                {{ step.step }}
              </span>
              <FileSpreadsheet class="w-4 h-4 text-gray-400 opacity-60" />
            </div>
            <div>
              <h4 class="text-xs font-semibold uppercase tracking-tight text-gray-900 dark:text-gray-100">{{ step.title }}</h4>
              <p class="text-xs text-gray-500 dark:text-gray-400 font-base leading-relaxed mt-1">{{ step.description }}</p>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Cards de Importação (Clientes & Catálogo) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          v-for="card in cards"
          :key="card.type"
          compact
        >
          <!-- Cabeçalho do Card -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div class="w-12 h-12 rounded-[.5rem] bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 flex items-center justify-center shadow-sm">
                <component :is="card.icon" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <BaseBadge :variant="card.badgeVariant" light>{{ card.badge }}</BaseBadge>
              <!-- <span class="px-3 py-1 rounded-full text-[10px] font-normal uppercase tracking-wider" :class="card.badgeClass">
                {{ card.badge }}
              </span> -->
            </div>

            <div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white uppercase tracking-tight">{{ card.title }}</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 font-base leading-relaxed mt-1">{{ card.description }}</p>
            </div>

            <!-- Lista de Campos Suportados -->
            <div class="pt-2 space-y-2">
              <span class="text-[10px] font-normal tracking-wide text-gray-400">Campos incluídos no modelo:</span>
              <div class="flex flex-wrap gap-1.5">
                <BaseBadge v-for="field in card.fields" rounded="full" outline light> <CheckCircle2 class="w-3 h-3 mr-1 text-emerald-500" />{{ field }}</BaseBadge>
                <!-- <span
                  v-for="field in card.fields"
                  :key="field"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-gray-950 border border-slate-200/80 dark:border-gray-800 text-[11px] font-semibold text-gray-600 dark:text-gray-300"
                >
                  <CheckCircle2 class="w-3 h-3 text-emerald-500" />
                  {{ field }}
                </span> -->
              </div>
            </div>
          </div>

          <!-- Ações do Card (Baixar Modelo & Processar) -->
          <div class="pt-4 flex flex-col sm:flex-row items-center gap-3">
            <a
              :href="card.templateHref"
              download
              class="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-950 hover:bg-slate-50 dark:hover:bg-gray-900 text-xs font-normal text-gray-700 dark:text-gray-200 transition-all shadow-sm cursor-pointer"
            >
              <Download class="w-4 h-4 text-gray-500" />
              Baixar Modelo CSV
            </a>

            <BaseButton
              type="button"
              variant="primary"
              size="md"
              class="w-full sm:w-auto flex-1 cursor-pointer"
              @click="openModal(card.type)"
            >
              <Upload class="w-4 h-4 mr-2" />
              Processar Importação
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Importação em Lote -->
    <BulkImportModal v-model:open="modalOpen" :type="modalType" />
  </BaseCard>
</template>

<style scoped src="./index.css"></style>
