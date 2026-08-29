<script setup lang="ts">
import { ref } from 'vue'
import { FileSearch } from 'lucide-vue-next'
import { useIntersectionObserver } from '@vueuse/core'
import type { BaseTableColumn } from './BaseTable.vue'

interface Props {
  items: any[] | null
  pending?: boolean
  type?: 'table' | 'grid'
  columns?: BaseTableColumn[]
  emptyTitle?: string
  emptySubtitle?: string
  skeletonCount?: number
  hasMore?: boolean
  loadingMore?: boolean
  total?: number
  itemsPerPage?: number
  currentPage?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'table',
  columns: () => [],
  emptyTitle: 'Nenhum registro encontrado',
  emptySubtitle: 'Sua busca não retornou resultados ou a lista está vazia.',
  skeletonCount: 5,
  hasMore: false,
  loadingMore: false,
  pending: false,
  itemsPerPage: 10,
  currentPage: 1
})

const emit = defineEmits(['load-more', 'update:currentPage'])

const sentinelRef = ref<HTMLElement | null>(null)

useIntersectionObserver(sentinelRef, ([entry]) => {
  if (entry?.isIntersecting && props.hasMore && !props.loadingMore) {
    emit('load-more')
  }
}, { threshold: 0.1 })
</script>

<template>
  <div class="w-full">
    <!-- TABLE TYPE -->
    <div v-if="type === 'table'">
      <BaseTable
        :columns="columns"
        :items="items || []"
        :pending="pending"
        :skeleton-count="skeletonCount"
        :total="total"
        :items-per-page="itemsPerPage"
        :current-page="currentPage"
        @update:current-page="$emit('update:currentPage', $event)"
      >
        <!-- Forward header slot -->
        <template v-if="$slots.header" #header>
          <slot name="header" />
        </template>

        <!-- Forward body / item slot fallback -->
        <template v-if="$slots.item || $slots.body || loadingMore || hasMore" #body>
          <slot name="body">
            <slot
              v-for="(item, index) in (items || [])"
              :key="item.id || item._id || index"
              name="item"
              :item="item"
              :index="index"
            />
          </slot>

          <!-- Load More Skeleton -->
          <template v-if="loadingMore && items && items.length > 0">
            <tr v-for="i in 3" :key="`more-${i}`" class="block md:table-row p-4 sm:p-5 md:p-0 space-y-2 md:space-y-0">
              <td colspan="100%" class="px-6 py-4">
                <div class="flex items-center gap-4">
                  <BaseSkeleton width="2.5rem" height="2.5rem" borderRadius="0.75rem" />
                  <div class="space-y-2 flex-1">
                    <BaseSkeleton width="60%" height="1.25rem" />
                    <BaseSkeleton width="30%" height="0.75rem" />
                  </div>
                </div>
              </td>
            </tr>
          </template>

          <!-- Intersection Sentinel -->
          <tr v-if="hasMore">
            <td colspan="100%">
              <div ref="sentinelRef" class="h-1" />
            </td>
          </tr>
        </template>

        <!-- Forward cell slots dynamically (#cell-{key}) -->
        <template v-for="col in columns" :key="col.key" #[`cell-${col.key}`]="cellProps">
          <slot :name="`cell-${col.key}`" v-bind="cellProps">
            <slot :name="col.key" v-bind="cellProps" />
          </slot>
        </template>

        <!-- Empty State -->
        <template #empty>
          <slot name="empty">
            <div class="py-12 text-center">
              <div class="w-16 h-16 bg-slate-100 dark:bg-gray-800 text-slate-400 dark:text-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileSearch class="w-8 h-8" />
              </div>
              <h3 class="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ emptyTitle }}</h3>
              <p class="text-slate-400 dark:text-gray-500 text-xs font-bold mt-1 max-w-xs mx-auto">{{ emptySubtitle }}</p>
            </div>
          </slot>
        </template>
      </BaseTable>
    </div>

    <!-- GRID TYPE -->
    <div v-else class="space-y-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Initial Loading State -->
        <template v-if="pending && (!items || items.length === 0)">
          <slot name="skeleton">
            <div v-for="i in skeletonCount" :key="i" class="bg-white dark:bg-gray-900 rounded-[2.5rem] border-2 border-gray-100 dark:border-gray-800 p-8 space-y-6 shadow-sm">
              <BaseSkeleton width="100%" height="12rem" borderRadius="1.5rem" />
              <div class="space-y-3">
                <BaseSkeleton width="70%" height="1.5rem" />
                <BaseSkeleton width="100%" height="3rem" />
              </div>
            </div>
          </slot>
        </template>

        <!-- Real Data -->
        <template v-else-if="items && items.length > 0">
          <slot name="item" v-for="(item, index) in (items || [])" :key="item.id || item._id || index" :item="item" :index="index" />
        </template>
      </div>

      <!-- Load More Skeleton (grid) -->
      <div v-if="loadingMore && items && items.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="i in 3" :key="`more-${i}`" class="bg-white dark:bg-gray-900 rounded-[2.5rem] border-2 border-gray-100 dark:border-gray-800 p-8 space-y-6 shadow-sm">
          <BaseSkeleton width="100%" height="12rem" borderRadius="1.5rem" />
          <div class="space-y-3">
            <BaseSkeleton width="70%" height="1.5rem" />
            <BaseSkeleton width="100%" height="3rem" />
          </div>
        </div>
      </div>

      <!-- Intersection Sentinel (grid) -->
      <div ref="sentinelRef" v-if="hasMore" class="h-1" />

      <!-- Empty State -->
      <div v-if="!pending && (!items || items.length === 0)" class="text-center py-32 bg-white dark:bg-gray-900 rounded-[3rem] border-2 border-gray-100 dark:border-gray-800">
        <slot name="empty">
          <div class="w-24 h-24 bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
            <FileSearch class="w-12 h-12" />
          </div>
          <h3 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ emptyTitle }}</h3>
          <p class="text-gray-400 dark:text-gray-500 font-bold mt-2 px-6 max-w-sm mx-auto">{{ emptySubtitle }}</p>
        </slot>
      </div>
    </div>
  </div>
</template>
