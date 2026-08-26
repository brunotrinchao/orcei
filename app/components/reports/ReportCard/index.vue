<script setup lang="ts">
import { useReportCard } from './index'

const props = defineProps<{
  report: any
  formatDate: (date: string) => string
}>()

defineEmits<{
  (e: 'view'): void
  (e: 'download'): void
  (e: 'delete'): void
}>()

const {
  score,
  Calendar,
  Eye,
  Download,
  Trash2,
  ShieldCheck
} = useReportCard(props)
</script>

<template>
  <div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5 relative overflow-hidden flex flex-col justify-between report-card-container">
    <div>
      <div class="flex items-start justify-between gap-2">
        <h4 class="text-lg font-black text-gray-900 dark:text-gray-50 leading-tight">Análise Estratégica IA</h4>
        
        <div 
          v-if="score !== null"
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border shrink-0"
          :class="{
            'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800': score >= 70,
            'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800': score >= 50 && score < 70,
            'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800': score < 50
          }"
        >
          <ShieldCheck class="w-3.5 h-3.5 shrink-0" />
          Score {{ score }}/100
        </div>
      </div>

      <div class="flex items-center gap-3 mt-2">
        <span class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
          <Calendar class="w-3 h-3" />
          {{ formatDate(report.createdAt) }}
        </span>
      </div>

      <span class="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mt-2">
        {{ report.context?.totalProposals || 0 }} Orçamentos analisados
      </span>
    </div>

    <div class="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
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

<style scoped src="./index.css"></style>
