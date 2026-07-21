<script setup lang="ts">
import { FileSearch } from 'lucide-vue-next'
import { useIntersectionObserver } from '@vueuse/core'

interface Props {
  items: any[] | null
  pending: boolean
  type?: 'table' | 'grid'
  emptyTitle?: string
  emptySubtitle?: string
  skeletonCount?: number
  hasMore?: boolean
  loadingMore?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'table',
  emptyTitle: 'Nenhum registro encontrado',
  emptySubtitle: 'Sua busca não retornou resultados ou a lista está vazia.',
  skeletonCount: 5,
  hasMore: false,
  loadingMore: false,
})

const emit = defineEmits(['load-more'])

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
    <div v-if="type === 'table'" class="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden transition-all">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead v-if="$slots.header">
            <tr class="bg-gray-50/50 border-b border-gray-200">
              <slot name="header" />
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <!-- Initial Loading State -->
            <template v-if="pending && (!items || items.length === 0)">
              <slot name="skeleton">
                <tr v-for="i in skeletonCount" :key="i">
                  <td colspan="100%" class="px-8 py-6">
                    <div class="flex items-center gap-4">
                      <BaseSkeleton width="3rem" height="3rem" borderRadius="1rem" />
                      <div class="space-y-2 flex-1">
                        <BaseSkeleton width="60%" height="1.25rem" />
                        <BaseSkeleton width="30%" height="0.75rem" />
                      </div>
                    </div>
                  </td>
                </tr>
              </slot>
            </template>

            <!-- Real Data -->
            <template v-else-if="items && items.length > 0">
              <slot name="item" v-for="(item, index) in items" :key="item._id || index" :item="item" :index="index" />
            </template>

            <!-- Load More Skeleton -->
            <template v-if="loadingMore && items && items.length > 0">
              <tr v-for="i in 3" :key="`more-${i}`">
                <td colspan="100%" class="px-8 py-6">
                  <div class="flex items-center gap-4">
                    <BaseSkeleton width="3rem" height="3rem" borderRadius="1rem" />
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
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="!pending && (!items || items.length === 0)" class="text-center py-24 bg-white">
        <slot name="empty">
          <div class="w-20 h-20 bg-gray-50 text-gray-300 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
            <FileSearch class="w-10 h-10" />
          </div>
          <h3 class="text-xl font-black text-gray-900 uppercase tracking-tight">{{ emptyTitle }}</h3>
          <p class="text-gray-400 font-bold mt-2 px-6 max-w-sm mx-auto">{{ emptySubtitle }}</p>
        </slot>
      </div>
    </div>

    <!-- GRID TYPE -->
    <div v-else class="space-y-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Initial Loading State -->
        <template v-if="pending && (!items || items.length === 0)">
          <slot name="skeleton">
            <div v-for="i in skeletonCount" :key="i" class="bg-white rounded-[2.5rem] border-2 border-gray-100 p-8 space-y-6 shadow-sm">
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
          <slot name="item" v-for="(item, index) in items" :key="item._id || index" :item="item" :index="index" />
        </template>
      </div>

      <!-- Load More Skeleton (grid) -->
      <div v-if="loadingMore && items && items.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="i in 3" :key="`more-${i}`" class="bg-white rounded-[2.5rem] border-2 border-gray-100 p-8 space-y-6 shadow-sm">
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
      <div v-if="!pending && (!items || items.length === 0)" class="text-center py-32 bg-white rounded-[3rem] border-2 border-gray-100">
        <slot name="empty">
          <div class="w-24 h-24 bg-gray-50 text-gray-300 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
            <FileSearch class="w-12 h-12" />
          </div>
          <h3 class="text-2xl font-black text-gray-900 uppercase tracking-tight">{{ emptyTitle }}</h3>
          <p class="text-gray-400 font-bold mt-2 px-6 max-w-sm mx-auto">{{ emptySubtitle }}</p>
        </slot>
      </div>
    </div>
  </div>
</template>
