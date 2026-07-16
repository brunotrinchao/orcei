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
  <div class="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
    <h4 class="text-lg font-black text-gray-900 leading-tight">Análise Estratégica IA</h4>
    <div class="flex items-center gap-3 mt-2">
      <span class="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
        <Calendar class="w-3 h-3" />
        {{ formatDate(report.createdAt) }}
      </span>
    </div>
    <span class="text-xs font-bold text-blue-600 uppercase tracking-widest block mt-1">
      {{ report.context?.totalProposals || 0 }} Orçamentos analisados
    </span>

    <div class="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100">
      <button @click="$emit('view')" class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Visualizar" aria-label="Visualizar relatório">
        <Eye class="w-5 h-5" />
      </button>
      <button @click="$emit('download')" class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Download PDF" aria-label="Download PDF">
        <Download class="w-5 h-5" />
      </button>
      <button @click="$emit('delete')" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Excluir" aria-label="Excluir relatório">
        <Trash2 class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>
