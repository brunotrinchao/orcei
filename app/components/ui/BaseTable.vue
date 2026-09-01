<script setup lang="ts">
import { computed } from 'vue'

export interface BaseTableColumn {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  type?: 'currency' | 'badge' | 'text' | 'date' | 'actions' | string
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
  pending?: boolean
  skeletonCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  columns: () => [],
  items: () => [],
  total: undefined,
  itemsPerPage: 10,
  currentPage: 1,
  emptyText: 'Nenhum registro encontrado.',
  pending: false,
  skeletonCount: 5
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

const badgeColumns = computed(() => props.columns.filter((c) => c.type === 'badge'))

const shouldShowMobileLabel = (col: BaseTableColumn) => {
  if (!col.label) return false
  if (col.type === 'badge') return false
  return true
}
</script>

<template>
  <div class="overflow-hidden bg-white dark:bg-gray-900  transition-all">
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse table-fixed">
        <!-- HEADER -->
        <thead
          v-if="columns && columns.length > 0"
          class="hidden md:table-header-group border-b border-black/10 dark:border-white/10"
        >
          <tr class="text-sm font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
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
          class="hidden md:table-header-group bg-slate-50 dark:bg-gray-800/50 border-b border-black/10 dark:border-white/10"
        >
          <tr class="text-xs font-black text-slate-600 dark:text-gray-400 uppercase tracking-wider">
            <slot name="header"></slot>
          </tr>
        </thead>

        <!-- BODY -->
        <tbody class="divide-y divide-slate-100 dark:divide-gray-800">
          <!-- Pending Loading State -->
          <template v-if="pending && (!items || items.length === 0)">
            <slot name="skeleton">
              <tr
                v-for="i in skeletonCount"
                :key="`skel-${i}`"
                class="block md:table-row p-4 sm:p-5 md:p-0 space-y-2 md:space-y-0"
              >
                <template v-if="columns && columns.length > 0">
                  <td
                    v-for="col in columns"
                    :key="`skel-col-${col.key}`"
                    class="block md:table-cell p-0 md:px-4 md:py-3.5"
                    :class="[col.hideOnMobile ? 'hidden md:table-cell' : '']"
                  >
                    <div class="flex items-center gap-2">
                      <span v-if="shouldShowMobileLabel(col)" class="inline-block md:hidden text-[11px] font-medium text-gray-300 dark:text-gray-700 mr-2">
                        {{ col.label }}:
                      </span>
                      <BaseSkeleton width="80%" height="1.25rem" borderRadius="0.5rem" />
                    </div>
                  </td>
                </template>
                <template v-else>
                  <td colspan="100%" class="px-6 py-4">
                    <div class="flex items-center gap-4">
                      <BaseSkeleton width="2.5rem" height="2.5rem" borderRadius="0.5rem" />
                      <div class="space-y-2 flex-1">
                        <BaseSkeleton width="50%" height="1.25rem" />
                        <BaseSkeleton width="30%" height="0.75rem" />
                      </div>
                    </div>
                  </td>
                </template>
              </tr>
            </slot>
          </template>

          <!-- Declarative items mode -->
          <template v-else-if="items && items.length > 0">
            <tr
              v-for="(item, itemIndex) in items"
              :key="item.id || item._id || itemIndex"
              class="flex flex-wrap md:table-row p-4 sm:p-5 md:p-0 mb-3 md:mb-0 rounded-[.5rem] border border-line dark:border-gray-800 shadow-sm md:border-0 md:shadow-none md:rounded-none bg-white dark:bg-gray-900 md:bg-transparent hover:bg-slate-100/80 dark:hover:bg-gray-800/60 transition-colors cursor-pointer group"
              @click="$emit('row-click', item, itemIndex)"
            >
              <td
                v-for="(col, colIndex) in columns"
                :key="col.key"
                class="md:table-cell p-0 md:px-4 md:py-3.5"
                :class="[
                  col.hideOnMobile ? 'hidden md:table-cell' : '',
                  getAlignmentClass(col.align),
                  colIndex === 0
                    ? 'block md:block flex-1 order-0'
                    : col.type === 'badge'
                      ? 'block md:block order-0 ml-auto flex justify-end items-center py-1 md:py-3.5'
                      : 'block md:block order-1 w-full flex items-center gap-1.5 py-2 md:py-3.5',
                  col.class || ''
                ]"
              >
                <!-- Mobile Field Label (colunas secundárias) -->
                <span
                  v-if="shouldShowMobileLabel(col) && colIndex !== 0"
                  class="inline-block md:hidden text-[11px] font-medium text-muted shrink-0"
                >
                  {{ col.label }}:
                </span>

                <!-- Cell Content Slot or Default Renderer -->
                <slot :name="`cell-${col.key}`" :item="item" :value="item[col.key]" :index="itemIndex">
                  <slot :name="col.key" :item="item" :value="item[col.key]" :index="itemIndex">
                    <template v-if="col.type === 'currency'">
                      <span class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ col.format ? col.format(item[col.key], item) : (typeof item[col.key] === 'number' ? item[col.key].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : (item[col.key] ?? 'R$ 0,00')) }}
                      </span>
                    </template>
                    <template v-else-if="col.type === 'badge'">
                      <BaseBadge>{{ col.format ? col.format(item[col.key], item) : (item[col.key] ?? '-') }}</BaseBadge>
                    </template>
                    <template v-else>
                      <span class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ col.format ? col.format(item[col.key], item) : (item[col.key] ?? '-') }}
                      </span>
                    </template>
                  </slot>
                </slot>
              </td>
            </tr>
          </template>

          <!-- Fallback slot body mode -->
          <slot v-else name="body"></slot>

          <!-- Empty State -->
          <tr v-if="!pending && computedTotal === 0 && !$slots.body">
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
      class="p-4 border-t border-black/10 dark:border-white/10 flex items-center justify-center"
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
