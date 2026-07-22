<script setup lang="ts">
import { CheckboxIndicator, CheckboxRoot } from 'radix-vue'
import { Check } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  label?: string
}>()

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="flex items-center gap-3">
    <CheckboxRoot
      :checked="modelValue"
      @update:checked="emit('update:modelValue', $event)"
      class="flex h-6 w-6 appearance-none items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 transition-all data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
    >
      <CheckboxIndicator class="flex items-center justify-center text-white">
        <Check class="w-4 h-4" />
      </CheckboxIndicator>
    </CheckboxRoot>
    <label v-if="label" class="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
      {{ label }}
    </label>
  </div>
</template>
