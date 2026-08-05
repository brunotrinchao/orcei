<script setup lang="ts">
interface Props {
  total?: number
  itemsPerPage?: number
  currentPage?: number
}

const props = withDefaults(defineProps<Props>(), {
  total: 0,
  itemsPerPage: 10,
  currentPage: 1
})

defineEmits(['update:currentPage'])
</script>

<template>
  <div class="overflow-hidden bg-white dark:bg-gray-900 rounded-[0.75rem] border border-slate-200 dark:border-gray-800 shadow-sm shadow-slate-200/50 dark:shadow-none">
    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead class="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800">
          <tr class="text-xs font-black text-slate-600 dark:text-gray-400 uppercase tracking-wider">
            <slot name="header"></slot>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-gray-800">
          <slot name="body"></slot>
          <tr v-if="total === 0">
            <td colspan="100%" class="px-6 py-10 text-center text-slate-500 dark:text-gray-400 font-bold">
              Nenhum registro encontrado.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="total > itemsPerPage" class="p-4 border-t border-slate-200 dark:border-gray-800 flex items-center justify-center">
      <BasePagination 
        :total="total" 
        :items-per-page="itemsPerPage" 
        :model-value="currentPage"
        @update:model-value="$emit('update:currentPage', $event)"
      />
    </div>
  </div>
</template>
