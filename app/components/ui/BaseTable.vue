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

defineEmits(['page-change'])
</script>

<template>
  <div class="overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm">
    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr class="text-xs font-bold text-gray-500 uppercase tracking-wider">
            <slot name="header"></slot>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <slot name="body"></slot>
          <tr v-if="total === 0">
            <td colspan="100%" class="px-6 py-10 text-center text-gray-400">
              Nenhum registro encontrado.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="total > itemsPerPage" class="p-4 border-t border-gray-50 flex items-center justify-center">
      <BasePagination 
        :total="total" 
        :items-per-page="itemsPerPage" 
        :default-page="currentPage" 
        @update:page="$emit('page-change', $event)" 
      />
    </div>
  </div>
</template>
