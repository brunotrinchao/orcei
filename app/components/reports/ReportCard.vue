<script setup lang="ts">
import { Calendar, Eye, Download, Trash2 } from 'lucide-vue-next'

defineProps<{
  report: any
  formatDate: (date: string) => string
}>()

defineEmits<{
  (e: 'view'): void
  (e: 'download'): void
  (e: 'delete'): void
}>()
</script>

<template>
  <div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4">
    <h4 class="text-lg font-black text-gray-900 dark:text-gray-50 leading-tight">Análise Estratégica IA</h4>
    <div class="flex items-center gap-3 mt-2">
      <span class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
        <Calendar class="w-3 h-3" />
        {{ formatDate(report.createdAt) }}
      </span>
    </div>
    <span class="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mt-1">
      {{ report.context?.totalProposals || 0 }} Orçamentos analisados
    </span>

    <div class="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
      <BaseButton variant="ghost" size="icon-sm" @click="$emit('view')" class="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" aria-label="Visualizar relatório" title="Visualizar">
        <Eye class="w-4 h-4" />
      </BaseButton>
      <BaseButton variant="ghost" size="icon-sm" @click="$emit('download')" class="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" aria-label="Download PDF" title="Download PDF">
        <Download class="w-4 h-4" />
      </BaseButton>
      <BaseButton variant="ghost" size="icon-sm" @click="$emit('delete')" class="text-gray-400 hover:text-red-600 dark:hover:text-red-400" aria-label="Excluir relatório" title="Excluir">
        <Trash2 class="w-4 h-4" />
      </BaseButton>
    </div>
  </div>
</template>
