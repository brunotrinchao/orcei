<script setup lang="ts">
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
  SelectPortal,
  SelectIcon,
  SelectScrollUpButton,
  SelectScrollDownButton
} from 'radix-vue'
import { ChevronDown, ChevronUp, Check } from 'lucide-vue-next'

interface Option {
  label: string
  value: string
}

const props = defineProps<{
  modelValue?: string
  options: Option[]
  placeholder?: string
  label?: string
  error?: string
}>()

const emit = defineEmits(['update:modelValue'])

const handleUpdate = (value: string) => {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="space-y-2">
    <label v-if="label" class="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">
      {{ label }}
    </label>
    
    <SelectRoot :model-value="modelValue" @update:model-value="handleUpdate">
      <SelectTrigger
        class="inline-flex items-center justify-between w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-gray-900 group"
        :class="{ 'border-red-200 focus:border-red-500 focus:ring-red-500/10': error }"
      >
        <SelectValue :placeholder="placeholder" />
        <SelectIcon>
          <ChevronDown class="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
        </SelectIcon>
      </SelectTrigger>

      <SelectPortal>
        <SelectContent
          class="z-[100] min-w-[var(--radix-select-trigger-width)] bg-white rounded-2xl border-2 border-gray-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          position="popper"
          :side-offset="8"
        >
          <SelectScrollUpButton class="flex items-center justify-center h-8 bg-white text-gray-400 cursor-default">
            <ChevronUp class="w-4 h-4" />
          </SelectScrollUpButton>

          <SelectViewport class="p-2">
            <SelectItem
              v-for="option in options"
              :key="option.value"
              :value="option.value"
              class="relative flex items-center px-8 py-3 text-sm font-bold text-gray-600 rounded-xl cursor-pointer outline-none focus:bg-gray-50 focus:text-gray-900 data-[state=checked]:text-gray-900 data-[state=checked]:bg-gray-50 transition-colors"
            >
              <SelectItemIndicator class="absolute left-2 inline-flex items-center justify-center">
                <Check class="w-4 h-4 text-gray-900" />
              </SelectItemIndicator>
              <SelectItemText>{{ option.label }}</SelectItemText>
            </SelectItem>
          </SelectViewport>

          <SelectScrollDownButton class="flex items-center justify-center h-8 bg-white text-gray-400 cursor-default">
            <ChevronDown class="w-4 h-4" />
          </SelectScrollDownButton>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>

    <span v-if="error" class="text-[10px] font-bold text-red-500 ml-1 uppercase">
      {{ error }}
    </span>
  </div>
</template>
