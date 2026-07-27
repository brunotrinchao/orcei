<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue?: string | null
  label?: string
  required?: boolean
  disabled?: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const colorValue = computed({
  get: () => props.modelValue || '#2563EB',
  set: (val: string) => emit('update:modelValue', val)
})

const inputId = useId()
</script>

<template>
  <div class="space-y-2">
    <label v-if="label" :for="inputId" class="block text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest ml-1">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </label>

    <div class="flex items-center gap-3">
      <div class="relative w-14 h-14 rounded-[0.5rem] overflow-hidden border-2 border-gray-100 dark:border-gray-800 shadow-sm shrink-0">
        <input
          :id="inputId"
          type="color"
          v-model="colorValue"
          :disabled="disabled"
          class="absolute -inset-2 w-[200%] h-[200%] cursor-pointer border-0 p-0 disabled:cursor-not-allowed"
        >
      </div>

      <div class="relative flex-1">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 dark:text-gray-500 pointer-events-none">#</span>
        <input
          type="text"
          :value="colorValue.replace('#', '')"
          @input="(e) => colorValue = '#' + (e.target as HTMLInputElement).value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6)"
          placeholder="2563EB"
          maxlength="6"
          :disabled="disabled"
          class="w-full pl-8 pr-5 py-4 bg-white dark:bg-gray-950 border-2 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 rounded-[0.5rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:focus:border-blue-500 transition-all outline-none font-mono font-bold text-gray-900 dark:text-gray-50 uppercase placeholder:text-gray-400 dark:placeholder:text-gray-500"
        >
      </div>
    </div>
  </div>
</template>
