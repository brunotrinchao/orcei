<script setup lang="ts">
import type { Component } from 'vue'
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
import { computed, ref } from 'vue'
import { useFieldValidation } from '~/composables/useFormValidation'

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
  required?: boolean
  icon?: Component
}>()

const modelValue = defineModel<string>()
const id = useId()

// SelectTrigger é um botão Radix real por baixo — dá pra focar via $el.
const triggerRef = ref<InstanceType<typeof SelectTrigger> | null>(null)

const isEmpty = () => !!props.required && !modelValue.value
const { submitAttempted } = useFieldValidation({
  isEmpty,
  focus: () => (triggerRef.value as any)?.$el?.focus?.()
})
const showRequiredError = computed(() => submitAttempted.value && isEmpty())
const displayError = computed(() => props.error || (showRequiredError.value ? 'Campo obrigatório' : ''))
</script>

<template>
  <div class="space-y-2">
    <label v-if="label" :id="`label-${id}`" class="block text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest ml-1">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </label>

    <div class="relative flex items-center w-full">
      <!-- Ícone na esquerda se fornecido -->
      <div v-if="icon || $slots.icon" class="absolute left-4 z-10 flex items-center gap-1.5 text-gray-400 dark:text-gray-500 pointer-events-none">
        <slot name="icon">
          <component :is="icon" v-if="icon" class="w-4 h-4" />
        </slot>
      </div>

      <SelectRoot v-model="modelValue" :disabled="disabled">
        <SelectTrigger
          ref="triggerRef"
          :aria-labelledby="label ? `label-${id}` : undefined"
          :class="[
            'inline-flex items-center justify-between w-full h-[56px] bg-white dark:bg-gray-950 border-2 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 rounded-[0.5rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:focus:border-blue-500 transition-all outline-none font-bold text-sm text-gray-900 dark:text-gray-50 group disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:cursor-not-allowed shadow-sm',
            icon || $slots.icon ? 'pl-12 pr-5' : 'px-5',
            displayError ? 'border-red-300 dark:border-red-500/50 focus:border-red-500 dark:focus:border-red-500 focus:ring-red-500/20' : ''
          ]"
        >
          <SelectValue :placeholder="placeholder || 'Selecione...'" />
          <SelectIcon>
            <ChevronDown class="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
          </SelectIcon>
        </SelectTrigger>

        <SelectPortal>
          <SelectContent
            class="z-[9999] min-w-[var(--radix-select-trigger-width)] bg-white dark:bg-gray-900 rounded-[0.5rem] border-2 border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            position="popper"
            :side-offset="8"
            :avoid-collisions="true"
            @pointer-down-outside="(e) => {
              // Prevent closing the parent dialog when clicking outside the select but within the portal
              if (e.detail.originalEvent.type === 'pointerdown') return;
            }"
          >
            <SelectScrollUpButton class="flex items-center justify-center h-8 bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 cursor-default">
              <ChevronUp class="w-4 h-4" />
            </SelectScrollUpButton>

            <SelectViewport class="p-2">
              <SelectItem
                v-for="option in options"
                :key="option.value"
                :value="option.value || '__EMPTY__'"
                class="relative flex items-center px-8 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 rounded-[0.5rem] cursor-pointer outline-none focus:bg-gray-50 dark:focus:bg-gray-800 focus:text-gray-900 dark:focus:text-white data-[state=checked]:text-gray-900 dark:data-[state=checked]:text-white data-[state=checked]:bg-gray-50 dark:data-[state=checked]:bg-gray-800 transition-colors"
              >
                <SelectItemIndicator class="absolute left-2 inline-flex items-center justify-center">
                  <Check class="w-4 h-4 text-gray-900 dark:text-white" />
                </SelectItemIndicator>
                <SelectItemText>{{ option.label }}</SelectItemText>
              </SelectItem>
              <div v-if="!options || options.length === 0" class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">
                Sem Opções
              </div>
            </SelectViewport>

            <SelectScrollDownButton class="flex items-center justify-center h-8 bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 cursor-default">
              <ChevronDown class="w-4 h-4" />
            </SelectScrollDownButton>
          </SelectContent>
        </SelectPortal>
      </SelectRoot>
    </div>

    <span class="block min-h-[14px] text-[10px] font-bold text-red-500 ml-1 uppercase leading-[14px]">
      {{ displayError }}
    </span>
  </div>
</template>
