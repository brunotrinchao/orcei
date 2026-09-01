<script setup lang="ts">
import type { CatalogItemDTO } from '../../../../types'
import { useCatalogItemCard } from './index'

defineProps<{
  item: CatalogItemDTO
  getIcon: (name: string) => any
}>()

defineEmits<{
  (e: 'view'): void
  (e: 'edit'): void
  (e: 'delete'): void
}>()

const { Pencil, Trash2, Eye } = useCatalogItemCard()
</script>

<template>
  <div 
    class="catalog-item-card rounded-[.5rem] border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm p-4 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-all"
    @click="$emit('view')"
  >
    <div class="flex items-center gap-4">
      <div class="w-14 h-14 rounded-[.5rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm">
        <BaseImage v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" container-class="w-full h-full" img-class="w-full h-full object-cover" />
        <div v-else class="text-gray-400 dark:text-gray-500">
          <component :is="getIcon(item.icon || 'Package')" class="w-7 h-7" />
        </div>
      </div>
      <div class="flex flex-col min-w-0">
        <span class="font-black text-gray-900 dark:text-gray-50 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{{ item.name }}</span>
        <span class="text-xs font-bold text-gray-400 dark:text-gray-500 line-clamp-1">{{ item.description || 'Sem descrição comercial' }}</span>
      </div>
    </div>

    <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
      <span
        :class="item.type === 'service' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30' : 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'"
        class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
      >
        {{ item.type === 'service' ? 'Serviço' : 'Produto' }}
      </span>
      <div class="text-right">
        <span class="font-black text-gray-900 dark:text-white block">R$ {{ (item.price ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
        <span class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">por {{ item.unit }}</span>
      </div>
    </div>

    <div class="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800" @click.stop>
      <BaseButton variant="ghost" size="icon-sm" @click.stop="$emit('view')" class="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" aria-label="Ver detalhes" title="Ver detalhes">
        <Eye class="w-4 h-4" />
      </BaseButton>
      <BaseButton variant="ghost" size="icon-sm" @click.stop="$emit('edit')" class="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" aria-label="Editar item" title="Editar">
        <Pencil class="w-4 h-4" />
      </BaseButton>
      <BaseButton variant="ghost" size="icon-sm" @click.stop="$emit('delete')" class="text-gray-400 hover:text-red-600 dark:hover:text-red-400" aria-label="Excluir item" title="Excluir">
        <Trash2 class="w-4 h-4" />
      </BaseButton>
    </div>
  </div>
</template>

<style scoped src="./index.css"></style>
