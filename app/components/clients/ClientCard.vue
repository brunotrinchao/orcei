<script setup lang="ts">
import { Pencil, Trash2 } from 'lucide-vue-next'
import type { ClientDTO } from '../../../../types'

defineProps<{
  client: ClientDTO
  formatPhone: (phone: string) => string
}>()

defineEmits<{
  (e: 'edit'): void
  (e: 'delete'): void
}>()
</script>

<template>
  <div class="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
    <div class="flex flex-col">
      <span class="font-black text-lg text-gray-900">{{ client.name }}</span>
      <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{{ client.taxId || 'Sem documento' }}</span>
    </div>

    <div class="mt-3 space-y-1">
      <span class="text-sm font-bold text-gray-600 block">{{ client.email }}</span>
      <div class="flex items-center gap-2">
        <span class="text-xs font-black text-gray-400">{{ formatPhone(client.phone) }}</span>
        <img v-if="client.isWhatsapp" :src="'/images/icons/whatsapp-svg.svg'" class="w-3.5 h-3.5" alt="WhatsApp" loading="lazy" />
      </div>
    </div>

    <div class="mt-3 pt-3 border-t border-gray-100">
      <span class="text-[10px] font-black text-gray-900 uppercase tracking-widest">{{ client.address?.city || '-' }} - {{ client.address?.state || '-' }}</span>
      <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mt-1">{{ client.address?.street }}, {{ client.address?.number }}</span>
    </div>

    <div class="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100">
      <button @click="$emit('edit')" class="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Editar" aria-label="Editar cliente">
        <Pencil class="w-5 h-5" />
      </button>
      <button @click="$emit('delete')" class="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Excluir" aria-label="Excluir cliente">
        <Trash2 class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>
