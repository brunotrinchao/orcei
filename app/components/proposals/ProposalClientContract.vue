<script setup lang="ts">
import { Shield } from 'lucide-vue-next'

defineProps<{
  contractText: string
}>()
</script>

<template>
  <section class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
    <details class="group">
      <summary class="px-8 py-6 flex items-center justify-between cursor-pointer select-none list-none outline-none focus-visible:ring-2 focus-visible:ring-[#3147F6] focus-visible:ring-inset">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-[#3147F6]/10 rounded-xl flex items-center justify-center">
            <Shield class="w-4 h-4 text-[#3147F6]" />
          </div>
          <h2 class="text-[10px] font-black text-gray-600 uppercase tracking-[0.25em]">Contrato e Detalhes</h2>
        </div>
        <span class="text-xs font-black text-gray-600 uppercase tracking-widest group-open:hidden">Expandir</span>
        <span class="text-xs font-black text-gray-600 uppercase tracking-widest hidden group-open:block">Recolher</span>
      </summary>
      <div class="px-8 pb-8 border-t border-gray-50 pt-6 prose-contract">
        <div v-html="contractText"></div>
      </div>
    </details>
  </section>
</template>
