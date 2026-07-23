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
  <div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4">
    <div class="flex flex-col">
      <span class="font-black text-lg text-gray-900 dark:text-gray-50">{{ client.name }}</span>
      <span class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">{{ client.taxId || 'Sem documento' }}</span>
    </div>

    <div class="mt-3 space-y-1">
      <span class="text-sm font-bold text-gray-600 dark:text-gray-300 block">{{ client.email }}</span>
      <div class="flex items-center gap-2">
        <span class="text-xs font-black text-gray-400 dark:text-gray-500">{{ formatPhone(client.phone) }}</span>
        <img v-if="client.isWhatsapp" :src="'/images/icons/whatsapp-svg.svg'" class="w-3.5 h-3.5" alt="WhatsApp" loading="lazy" />
      </div>
    </div>

    <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
      <span class="text-[10px] font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest">{{ client.address?.city || '-' }} - {{ client.address?.state || '-' }}</span>
      <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mt-1">{{ client.address?.street }}, {{ client.address?.number }}</span>
    </div>

    <div class="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
      <BaseButton variant="ghost" size="icon-sm" @click="$emit('edit')" class="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" aria-label="Editar cliente" title="Editar">
        <Pencil class="w-4 h-4" />
      </BaseButton>
      <BaseButton variant="ghost" size="icon-sm" @click="$emit('delete')" class="text-gray-400 hover:text-red-600 dark:hover:text-red-400" aria-label="Excluir cliente" title="Excluir">
        <Trash2 class="w-4 h-4" />
      </BaseButton>
    </div>
  </div>
</template>
