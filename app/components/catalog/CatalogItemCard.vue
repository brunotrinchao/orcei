<script setup lang="ts">
import { Pencil, Trash2 } from 'lucide-vue-next'
import type { CatalogItemDTO } from '../../../../types'

const props = defineProps<{
  item: CatalogItemDTO
  getIcon: (name: string) => any
}>()

defineEmits<{
  (e: 'edit'): void
  (e: 'delete'): void
}>()
</script>

<template>
  <div class="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
    <div class="flex items-center gap-4">
      <div class="w-14 h-14 rounded-2xl border-2 border-gray-100 bg-white overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm">
        <img v-if="item.imageUrl" :src="item.imageUrl" class="w-full h-full object-cover" loading="lazy">
        <div v-else class="text-gray-400">
          <component :is="getIcon(item.icon || 'Package')" class="w-7 h-7" />
        </div>
      </div>
      <div class="flex flex-col min-w-0">
        <span class="font-black text-gray-900 truncate">{{ item.name }}</span>
        <span class="text-xs font-bold text-gray-400 line-clamp-1">{{ item.description || 'Sem descrição comercial' }}</span>
      </div>
    </div>

    <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
      <span
        :class="item.type === 'service' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'"
        class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
      >
        {{ item.type === 'service' ? 'Serviço' : 'Produto' }}
      </span>
      <div class="text-right">
        <span class="font-black text-gray-900 block">R$ {{ (item.price ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">por {{ item.unit }}</span>
      </div>
    </div>

    <div class="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100">
      <button @click="$emit('edit')" class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Editar" aria-label="Editar item">
        <Pencil class="w-5 h-5" />
      </button>
      <button @click="$emit('delete')" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Excluir" aria-label="Excluir item">
        <Trash2 class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>
