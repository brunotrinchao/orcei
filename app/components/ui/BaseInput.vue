<script setup lang="ts">
defineProps<{
  modelValue: string | number | null
  label?: string
  mask?: string
  placeholder?: string
  error?: string
  type?: string
}>()
defineEmits(['update:modelValue'])
</script>
<template>
  <div class="space-y-2">
    <label v-if="label" class="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">{{ label }}</label>
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      v-maska="mask"
      :type="type || 'text'"
      :placeholder="placeholder"
      class="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-gray-900 placeholder:text-gray-300"
      :class="{ 'border-red-200 focus:border-red-500 focus:ring-red-500/10': error }"
    >
    <span v-if="error" class="text-[10px] font-bold text-red-500 ml-1 uppercase">{{ error }}</span>
  </div>
</template>
