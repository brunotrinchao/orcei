<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Component } from 'vue'
import { IMaskDirective } from 'vue-imask'
import { RefreshCcw } from 'lucide-vue-next'
import { useFieldValidation } from '~/composables/useFormValidation'

// Expose directive for template: vImask → v-imask
const vImask = IMaskDirective

const props = defineProps<{
  modelValue?: string | number | null
  label?: string
  mask?: string | any
  placeholder?: string
  error?: string
  type?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  suffix?: string
  prefix?: string
  icon?: Component
  loading?: boolean
}>()

const emit = defineEmits(['update:modelValue', 'blur', 'focus'])

// Guard: undefined/null → '' so native input never receives invalid value
const safeValue = computed(() => props.modelValue ?? '')

// No mask: plain input event
const onInput = (event: Event) => {
  if (maskOptions.value) return
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

// imask fires 'accept' AFTER formatting — use this for masked inputs
const onAccept = (event: Event) => {
  const detail = (event as CustomEvent).detail as { value: string; _value: string } | undefined
  if (detail) emit('update:modelValue', detail.value)
}

const maskOptions = computed(() => {
  if (!props.mask) return undefined

  if (props.mask === 'currency') {
    return {
      mask: Number,
      scale: 2,
      thousandsSeparator: '.',
      padFractionalZeros: true,
      normalizeZeros: true,
      radix: ',',
      mapToRadix: ['.'],
      min: 0,
    }
  }

  if (props.mask === 'phone') {
    return [
      { mask: '(00) 0000-0000' },
      { mask: '(00) 00000-0000' },
    ]
  }

  if (props.mask === 'cep') return { mask: '00000-000' }
  if (props.mask === 'cpf') return { mask: '000.000.000-00' }
  if (props.mask === 'cnpj') return { mask: '00.000.000/0000-00' }

  if (props.mask === 'document') {
    return [
      { mask: '000.000.000-00' },
      { mask: '00.000.000/0000-00' },
    ]
  }

  // Raw string mask passed directly — translate maska '#' (digit) → imask '0' (digit)
  if (typeof props.mask === 'string') return { mask: props.mask.replace(/#/g, '0') }

  return props.mask
})

const inputId = useId()
const inputEl = ref<HTMLInputElement | null>(null)

// Auto-registro no formulário pai (useFormValidation) — sem wiring manual.
// Só mostra "Campo obrigatório" depois da 1ª tentativa de envio (submitAttempted).
const isEmpty = () => !!props.required && (props.modelValue === null || props.modelValue === undefined || String(props.modelValue).trim() === '')
const { submitAttempted } = useFieldValidation({ isEmpty, focus: () => inputEl.value?.focus() })
const showRequiredError = computed(() => submitAttempted.value && isEmpty())
const displayError = computed(() => props.error || (showRequiredError.value ? 'Campo obrigatório' : ''))
</script>

<template>
  <div class="space-y-2">
    <label v-if="label" :for="inputId" class="block text-xs font-black text-slate-700 dark:text-gray-400 uppercase tracking-widest ml-1">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </label>
    <div class="relative flex items-center">
      <!-- Ícone ou Prefixo na esquerda -->
      <div v-if="icon || prefix || $slots.icon" class="absolute left-4 z-10 flex items-center gap-1.5 text-slate-500 dark:text-gray-500 pointer-events-none">
        <slot name="icon">
          <component :is="icon" v-if="icon" class="w-4 h-4" />
        </slot>
        <span v-if="prefix" class="text-xs font-black uppercase">{{ prefix }}</span>
      </div>

      <input
        :id="inputId"
        ref="inputEl"
        :value="safeValue"
        v-imask="maskOptions"
        @input="onInput"
        @accept="onAccept"
        @blur="emit('blur', $event)"
        @focus="emit('focus', $event)"
        :type="type || 'text'"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :class="[
          'w-full py-4 bg-white dark:bg-gray-950 border-2 border-gray-300 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-700 rounded-[0.75rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none font-bold text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:cursor-not-allowed shadow-xs',
          icon || prefix || $slots.icon ? 'pl-12' : 'pl-5',
          suffix || loading ? 'pr-16' : 'pr-5',
          displayError ? 'border-red-500 dark:border-red-500/50 focus:border-red-500 dark:focus:border-red-500 focus:ring-red-500/20' : ''
        ]"
      >

      <!-- Símbolo de carregamento ou Sufixo na direita -->
      <div v-if="loading || suffix" class="absolute right-5 flex items-center gap-2 pointer-events-none">
        <RefreshCcw v-if="loading" class="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
        <span v-if="suffix" class="text-xs font-black text-gray-400 dark:text-gray-500 uppercase">{{ suffix }}</span>
      </div>
    </div>
    <!-- Altura sempre reservada (min-h) — aparecer/sumir o erro não desloca o layout -->
    <span class="block min-h-[14px] text-[10px] font-bold text-red-500 ml-1 uppercase leading-[14px]"
    :class="displayError ? 'block' : 'hidden'">{{ displayError }}</span>
  </div>
</template>
