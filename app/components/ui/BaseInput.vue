<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Component } from 'vue'
import { IMaskDirective } from 'vue-imask'
import { RefreshCcw } from 'lucide-vue-next'
import { useFieldValidation } from '~/composables/useFormValidation'

// Expose directive for template: vImask → v-imask
const vImask = IMaskDirective

const props = withDefaults(defineProps<{
  modelValue?: string | number | null
  label?: string
  mask?: string | any
  placeholder?: string
  error?: string
  type?: string
  min?: number | string
  max?: number | string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  suffix?: string
  prefix?: string
  icon?: Component
  loading?: boolean
  background?: 'white' | 'slate' | 'blue' | 'gray' | 'emerald' | 'violet' | 'transparent' | string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | string
  border?: boolean | 'default' | 'none' | 'slate' | 'blue' | 'gray' | 'emerald' | 'violet' | 'amber' | string
}>(), {
  background: 'white',
  size: 'md',
  border: true
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus'])

// Guard: undefined/null → '' so native input never receives invalid value
const safeValue = computed(() => props.modelValue ?? '')

const bgClasses = computed(() => {
  const bg = props.background?.trim() || 'white'

  switch (bg) {
    case 'slate':
    case 'slate-100':
      return 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500'
    case 'slate-900':
    case 'slate-950':
      return 'bg-slate-900 dark:bg-slate-950 text-slate-100 placeholder:text-slate-500'
    case 'blue':
    case 'blue-50':
      return 'bg-blue-50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 placeholder:text-blue-400 dark:placeholder:text-blue-400'
    case 'blue-900':
    case 'blue-950':
      return 'bg-blue-950 text-blue-100 placeholder:text-blue-400'
    case 'gray':
    case 'gray-100':
      return 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500'
    case 'gray-900':
    case 'gray-950':
      return 'bg-gray-900 dark:bg-gray-950 text-gray-100 placeholder:text-gray-500'
    case 'zinc':
    case 'zinc-100':
      return 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500'
    case 'zinc-900':
    case 'zinc-950':
      return 'bg-zinc-900 dark:bg-zinc-950 text-zinc-100 placeholder:text-zinc-500'
    case 'emerald':
    case 'green':
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 placeholder:text-emerald-600/70 dark:placeholder:text-emerald-400'
    case 'violet':
    case 'purple':
      return 'bg-violet-50 dark:bg-violet-950/40 text-violet-950 dark:text-violet-100 placeholder:text-violet-400 dark:placeholder:text-violet-400'
    case 'transparent':
      return 'bg-transparent text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500'
    case 'white':
      return 'bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500'
    default: {
      if (bg.startsWith('bg-')) {
        const isDarkBg = /900|950|800|black/.test(bg)
        const textFallback = isDarkBg ? 'text-white placeholder:text-slate-400' : 'text-slate-900 placeholder:text-slate-400'
        return `${bg} ${textFallback}`
      }
      return 'bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500'
    }
  }
})

const borderClasses = computed(() => {
  if (props.border === false || props.border === 'none') {
    return 'border-0 focus:ring-4 focus:ring-blue-500/10'
  }

  switch (props.border) {
    case 'slate':
      return 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 focus:ring-4 focus:ring-slate-500/10'
    case 'blue':
      return 'border-blue-300 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-700 focus:ring-4 focus:ring-blue-500/10'
    case 'gray':
      return 'border-gray-300 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-700 ffocus:ring-4 focus:ring-gray-500/10'
    case 'emerald':
    case 'green':
      return 'border-emerald-300 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-700 focus:ring-4 focus:ring-emerald-500/10'
    case 'violet':
    case 'purple':
      return 'border-violet-300 dark:border-violet-800 hover:border-violet-400 dark:hover:border-violet-700 focus:ring-4 focus:ring-violet-500/10'
    case 'amber':
      return 'border-amber-300 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-700 focus:ring-4 focus:ring-amber-500/10'
    case true:
    case 'default':
    default:
      if (typeof props.border === 'string' && props.border.startsWith('border')) {
        return props.border
      }
      return 'border-gray-300 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-700  focus:border-blue-600 dark:focus:border-blue-500'
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'py-1.5 text-xs rounded-[.5rem]'
    case 'sm':
      return 'py-2.5 text-xs rounded-[.5rem]'
    case 'lg':
      return 'py-4 text-base rounded-[.5rem]'
    case 'xl':
      return 'py-5 text-lg rounded-[.5rem]'
    case '2xl':
      return 'py-6 text-xl rounded-[.5rem]'
    case 'md':
    default:
      if (props.size && (props.size.startsWith('py-') || props.size.startsWith('text-'))) {
        return props.size
      }
      return 'py-3.5 text-sm rounded-[.5rem]'
  }
})

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

  if (props.mask === 'money') {
    return {
      mask: 'R$ num',
      blocks: {
        num: {
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
    <label v-if="label" :for="inputId" class="block text-sm font-medium text-slate-500 dark:text-gray-500 tracking-wide ml-1">
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
        :min="min"
        :max="max"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :class="[
          'w-full transition-all outline-none font-normal disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:cursor-not-allowed shadow-xs border ',
          borderClasses,
          bgClasses,
          sizeClasses,
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
    <span class="block min-h-[14px] text-[10px] font-bold text-red-500 ml-1 leading-[14px]"
    :class="displayError ? 'block' : 'hidden'">{{ displayError }}</span>
  </div>
</template>
