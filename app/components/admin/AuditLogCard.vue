<script setup lang="ts">
import { User, Clock } from 'lucide-vue-next'

defineProps<{
  log: any
  formatDate: (date: string) => string
}>()
</script>

<template>
  <div class="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 text-xs">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2 text-gray-500 font-bold">
        <Clock class="w-3 h-3" />
        {{ formatDate(log.createdAt) }}
      </div>
      <span class="px-2 py-1 bg-gray-100 rounded text-[9px] font-black uppercase tracking-widest text-gray-600 border border-gray-200">
        {{ log.action }}
      </span>
    </div>

    <div class="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
      <User class="w-3.5 h-3.5 text-gray-400" />
      <span class="font-black text-gray-900">{{ log.adminName }}</span>
    </div>

    <pre class="text-[9px] bg-gray-50 p-2 rounded-lg mt-2 overflow-hidden truncate">{{ JSON.stringify(log.details) }}</pre>
  </div>
</template>
