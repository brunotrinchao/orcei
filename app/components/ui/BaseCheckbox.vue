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
      class="flex h-6 w-6 appearance-none items-center justify-center rounded-lg bg-gray-50 border-2 border-gray-100 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
    >
      <CheckboxIndicator class="flex items-center justify-center text-white">
        <Check class="w-4 h-4" />
      </CheckboxIndicator>
    </CheckboxRoot>
    <label v-if="label" class="text-sm font-bold text-gray-700 cursor-pointer select-none">
      {{ label }}
    </label>
  </div>
</template>
