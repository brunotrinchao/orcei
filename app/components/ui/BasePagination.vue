<script setup lang="ts">
import {
  PaginationRoot,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
  PaginationFirst,
  PaginationLast,
  PaginationEllipsis
} from 'radix-vue'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-vue-next'

interface Props {
  total: number
  itemsPerPage?: number
  defaultPage?: number
  siblingCount?: number
  showEdges?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  itemsPerPage: 10,
  defaultPage: 1,
  siblingCount: 1,
  showEdges: true
})

const emit = defineEmits(['update:page'])

const handlePageChange = (page: number) => {
  emit('update:page', page)
}
</script>

<template>
  <PaginationRoot
    :total="total"
    :items-per-page="itemsPerPage"
    :default-page="defaultPage"
    :sibling-count="siblingCount"
    :show-edges="showEdges"
    @update:page="handlePageChange"
  >
    <PaginationList v-slot="{ items }" class="flex items-center gap-2">
      <PaginationFirst
        class="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:text-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronsLeft class="w-4 h-4" />
      </PaginationFirst>
      
      <PaginationPrev
        class="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:text-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft class="w-4 h-4" />
      </PaginationPrev>

      <template v-for="(item, index) in items">
        <PaginationListItem
          v-if="item.type === 'page'"
          :key="index"
          :value="item.value"
          class="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-gray-100 bg-white text-sm font-bold text-gray-500 hover:border-gray-200 hover:text-gray-900 transition-all data-[selected]:bg-gray-900 data-[selected]:border-gray-900 data-[selected]:text-white"
        >
          {{ item.value }}
        </PaginationListItem>
        <PaginationEllipsis
          v-else
          :key="item.type"
          :index="index"
          class="w-10 h-10 flex items-center justify-center text-gray-400"
        >
          <MoreHorizontal class="w-4 h-4" />
        </PaginationEllipsis>
      </template>

      <PaginationNext
        class="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:text-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight class="w-4 h-4" />
      </PaginationNext>

      <PaginationLast
        class="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:text-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronsRight class="w-4 h-4" />
      </PaginationLast>
    </PaginationList>
  </PaginationRoot>
</template>
