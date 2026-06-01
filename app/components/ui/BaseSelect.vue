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
  options: Option[]
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
}>()

const modelValue = defineModel<string>()
const id = useId()
</script>

<template>
  <div class="space-y-2">
    <label v-if="label" :id="`label-${id}`" class="block text-xs font-black text-gray-600 uppercase tracking-widest ml-1">
      {{ label }}
    </label>
    
    <SelectRoot v-model="modelValue" :disabled="disabled">
      <SelectTrigger
        :aria-labelledby="label ? `label-${id}` : undefined"
        class="inline-flex items-center justify-between w-full px-5 py-4 bg-white border-2 border-gray-200 hover:border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none font-bold text-gray-900 group disabled:opacity-50 disabled:cursor-not-allowed"
        :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500/20': error }"
      >
        <SelectValue :placeholder="placeholder || 'Selecione...'" />
        <SelectIcon>
          <ChevronDown class="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
        </SelectIcon>
      </SelectTrigger>

      <SelectPortal>
        <SelectContent
          class="z-[9999] min-w-[var(--radix-select-trigger-width)] bg-white rounded-2xl border-2 border-gray-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          position="popper"
          :side-offset="8"
          :avoid-collisions="true"
          @pointer-down-outside="(e) => {
            // Prevent closing the parent dialog when clicking outside the select but within the portal
            if (e.detail.originalEvent.type === 'pointerdown') return;
          }"
        >
          <SelectScrollUpButton class="flex items-center justify-center h-8 bg-white text-gray-400 cursor-default">
            <ChevronUp class="w-4 h-4" />
          </SelectScrollUpButton>

          <SelectViewport class="p-2">
            <SelectItem
              v-for="option in options"
              :key="option.value"
              :value="option.value || '__EMPTY__'"
              class="relative flex items-center px-8 py-3 text-sm font-bold text-gray-600 rounded-xl cursor-pointer outline-none focus:bg-gray-50 focus:text-gray-900 data-[state=checked]:text-gray-900 data-[state=checked]:bg-gray-50 transition-colors"
            >
              <SelectItemIndicator class="absolute left-2 inline-flex items-center justify-center">
                <Check class="w-4 h-4 text-gray-900" />
              </SelectItemIndicator>
              <SelectItemText>{{ option.label }}</SelectItemText>
            </SelectItem>
            <div v-if="!options || options.length === 0" class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">
              Sem Opções
            </div>
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
