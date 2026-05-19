<script setup lang="ts">
import { IMaskDirective } from 'vue-imask'

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
}>()

const emit = defineEmits(['update:modelValue'])

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
</script>

<template>
  <div class="space-y-2">
    <label v-if="label" :for="inputId" class="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </label>
    <input
      :id="inputId"
      :value="safeValue"
      v-imask="maskOptions"
      @input="onInput"
      @accept="onAccept"
      :type="type || 'text'"
      :placeholder="placeholder"
      class="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-gray-900 placeholder:text-gray-300 disabled:opacity-50 disabled:bg-gray-50"
      :class="{ 'border-red-200 focus:border-red-500 focus:ring-red-500/10': error }"
    >
    <span v-if="error" class="text-[10px] font-bold text-red-500 ml-1 uppercase">{{ error }}</span>
  </div>
</template>
