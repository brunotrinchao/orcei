<script setup lang="ts">
import { computed } from 'vue'

export interface BaseTableColumn {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  class?: string
  headerClass?: string
  hideOnMobile?: boolean
  format?: (value: any, item: any) => string
}

interface Props {
  columns?: BaseTableColumn[]
  items?: Record<string, any>[]
  total?: number
  itemsPerPage?: number
  currentPage?: number
  emptyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  columns: () => [],
  items: () => [],
  total: undefined,
  itemsPerPage: 10,
  currentPage: 1,
  emptyText: 'Nenhum registro encontrado.'
})

defineEmits(['update:currentPage'])

const computedTotal = computed(() => {
  if (props.total !== undefined) return props.total
  if (props.items && Array.isArray(props.items)) return props.items.length
  return 0
})

const getAlignmentClass = (align?: 'left' | 'center' | 'right') => {
  if (align === 'center') return 'text-center'
  if (align === 'right') return 'text-right'
  return 'text-left'
}
</script>

<template>
  <div class="overflow-hidden bg-white dark:bg-gray-900 rounded-[0.75rem] border border-slate-200 dark:border-gray-800 shadow-sm shadow-slate-200/50 dark:shadow-none transition-all">
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <!-- HEADER -->
        <thead
          v-if="columns && columns.length > 0"
          class="hidden md:table-header-group bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800"
        >
          <tr class="text-xs font-black text-slate-600 dark:text-gray-400 uppercase tracking-wider">
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3.5"
              :class="[getAlignmentClass(col.align), col.headerClass || '']"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <thead
          v-else-if="$slots.header"
          class="hidden md:table-header-group bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800"
        >
          <tr class="text-xs font-black text-slate-600 dark:text-gray-400 uppercase tracking-wider">
            <slot name="header"></slot>
          </tr>
        </thead>

        <!-- BODY -->
        <tbody class="divide-y divide-slate-100 dark:divide-gray-800">
          <!-- Declarative items mode -->
          <template v-if="items && items.length > 0">
            <tr
              v-for="(item, itemIndex) in items"
              :key="item.id || item._id || itemIndex"
              class="block md:table-row p-4 sm:p-5 md:p-0 space-y-2 md:space-y-0 hover:bg-slate-50/40 dark:hover:bg-gray-800/30 transition-colors"
            >
              <td
                v-for="col in columns"
                :key="col.key"
                class="block md:table-cell p-0 md:px-4 md:py-3.5"
                :class="[
                  col.hideOnMobile ? 'hidden md:table-cell' : '',
                  getAlignmentClass(col.align),
                  col.class || ''
                ]"
              >
                <!-- Mobile Field Label -->
                <span
                  v-if="col.label"
                  class="inline-block md:hidden text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mr-2"
                >
                  {{ col.label }}:
                </span>

                <!-- Cell Content Slot or Default Renderer -->
                <slot :name="`cell-${col.key}`" :item="item" :value="item[col.key]" :index="itemIndex">
                  <slot :name="col.key" :item="item" :value="item[col.key]" :index="itemIndex">
                    <span class="text-xs font-bold text-gray-900 dark:text-white">
                      {{ col.format ? col.format(item[col.key], item) : (item[col.key] ?? '-') }}
                    </span>
                  </slot>
                </slot>
              </td>
            </tr>
          </template>

          <!-- Fallback slot body mode -->
          <slot v-else name="body"></slot>

          <!-- Empty State -->
          <tr v-if="computedTotal === 0 && !$slots.body">
            <td
              :colspan="columns && columns.length > 0 ? columns.length : 100"
              class="px-6 py-10 text-center text-slate-500 dark:text-gray-400 font-bold text-xs"
            >
              <slot name="empty">
                {{ emptyText }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PAGINATION -->
    <div
      v-if="computedTotal > itemsPerPage"
      class="p-4 border-t border-slate-200 dark:border-gray-800 flex items-center justify-center"
    >
      <BasePagination
        :total="computedTotal"
        :items-per-page="itemsPerPage"
        :model-value="currentPage"
        @update:model-value="$emit('update:currentPage', $event)"
      />
    </div>
  </div>
</template>
