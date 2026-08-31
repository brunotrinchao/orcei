<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFieldValidation } from '~/composables/useFormValidation'

const props = withDefaults(
  defineProps<{
    modelValue?: string | null
    label?: string
    placeholder?: string
    error?: string
    rows?: number
    required?: boolean
    disabled?: boolean
    readonly?: boolean
    maxLength?: number
    maxlength?: number
    background?: 'white' | 'slate' | 'blue' | 'gray' | 'emerald' | 'violet' | 'amber' | 'transparent' | string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | string
    border?: boolean | 'default' | 'none' | 'slate' | 'blue' | 'gray' | 'emerald' | 'violet' | 'amber' | string
    variant?: 'default' | 'slate' | 'blue' | 'gray' | 'emerald' | 'violet' | 'amber' | 'transparent' | string
    color?: 'default' | 'slate' | 'blue' | 'gray' | 'emerald' | 'violet' | 'amber' | string
  }>(),
  {
    background: 'white',
    size: 'md',
    border: true,
    variant: undefined,
    color: undefined,
  }
)

const emit = defineEmits(['update:modelValue', 'blur', 'focus'])

const safeValue = computed(() => props.modelValue ?? '')

const bgClasses = computed(() => {
  const bg = (props.variant || props.background || 'white').trim()

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
    case 'amber':
      return 'bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 placeholder:text-amber-600/70 dark:placeholder:text-amber-400'
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
  if (props.border === false || props.border === 'none' || props.variant === 'transparent') {
    return 'border-0 focus:ring-4 focus:ring-blue-500/10'
  }

  const borderVal = props.variant || props.border

  switch (borderVal) {
    case 'slate':
      return 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 focus:ring-4 focus:ring-slate-500/10'
    case 'blue':
      return 'border-blue-300 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-700 focus:ring-4 focus:ring-blue-500/10'
    case 'gray':
      return 'border-gray-300 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-700 focus:ring-4 focus:ring-gray-500/10'
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
      if (typeof borderVal === 'string' && borderVal.startsWith('border')) {
        return borderVal
      }
      return 'border-gray-300 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-700 focus:border-blue-600 dark:focus:border-blue-500'
  }
})

const colorClasses = computed(() => {
  if (!props.color) return ''
  switch (props.color) {
    case 'slate': return '!text-slate-900 dark:!text-slate-100'
    case 'blue': return '!text-blue-600 dark:!text-blue-400'
    case 'gray': return '!text-gray-900 dark:!text-gray-100'
    case 'emerald': return '!text-emerald-600 dark:!text-emerald-400'
    case 'violet': return '!text-violet-600 dark:!text-violet-400'
    case 'amber': return '!text-amber-600 dark:!text-amber-400'
    default: return props.color
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'py-1.5 px-3 text-xs rounded-[.5rem]'
    case 'sm':
      return 'py-2.5 px-3 text-xs rounded-[.5rem]'
    case 'lg':
      return 'py-4 px-5 text-base rounded-[.5rem]'
    case 'xl':
      return 'py-5 px-5 text-lg rounded-[.5rem]'
    case '2xl':
      return 'py-6 px-6 text-xl rounded-[.5rem]'
    case 'md':
    default:
      if (props.size && (props.size.startsWith('p-') || props.size.startsWith('py-') || props.size.startsWith('text-'))) {
        return props.size
      }
      return 'py-3.5 px-4 text-sm rounded-[.5rem]'
  }
})

const effectiveMaxLength = computed(() => props.maxLength ?? props.maxlength)

const onInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  let val = target.value
  if (effectiveMaxLength.value && val.length > effectiveMaxLength.value) {
    val = val.slice(0, effectiveMaxLength.value)
    target.value = val
  }
  emit('update:modelValue', val)
}

const onPaste = (event: ClipboardEvent) => {
  const max = effectiveMaxLength.value
  if (!max) return

  const pastedText = event.clipboardData?.getData('text') || ''
  const target = event.target as HTMLTextAreaElement
  const currentVal = target.value || ''
  const selectionStart = target.selectionStart || 0
  const selectionEnd = target.selectionEnd || 0

  const availableSpace = max - (currentVal.length - (selectionEnd - selectionStart))
  if (availableSpace <= 0) {
    event.preventDefault()
    return
  }

  if (pastedText.length > availableSpace) {
    event.preventDefault()
    const allowedText = pastedText.slice(0, availableSpace)
    const newVal =
      currentVal.slice(0, selectionStart) +
      allowedText +
      currentVal.slice(selectionEnd)
    target.value = newVal
    target.setSelectionRange(
      selectionStart + allowedText.length,
      selectionStart + allowedText.length
    )
    emit('update:modelValue', newVal)
  }
}

const inputId = useId()
const textareaEl = ref<HTMLTextAreaElement | null>(null)

const isEmpty = () => !!props.required && (!props.modelValue || props.modelValue.trim() === '')
const { submitAttempted } = useFieldValidation({
  isEmpty,
  focus: () => textareaEl.value?.focus(),
})
const showRequiredError = computed(() => submitAttempted.value && isEmpty())
const displayError = computed(
  () => props.error || (showRequiredError.value ? 'Campo obrigatório' : '')
)
</script>

<template>
  <div class="space-y-2">
    <div v-if="label" class="flex justify-between items-center ml-1">
      <label
        :for="inputId"
        class="block text-sm font-medium text-slate-500 dark:text-gray-500 tracking-wide"
      >
        {{ label }} <span v-if="required" class="text-red-500">*</span>
      </label>
    </div>

    <textarea
      :id="inputId"
      ref="textareaEl"
      :value="safeValue"
      @input="onInput"
      @paste="onPaste"
      @blur="emit('blur', $event)"
      @focus="emit('focus', $event)"
      :rows="rows || 4"
      :maxlength="effectiveMaxLength"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :class="[
        'w-full transition-all outline-none font-normal disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:cursor-not-allowed shadow-xs border resize-none',
        borderClasses,
        bgClasses,
        colorClasses,
        sizeClasses,
        displayError
          ? 'border-red-500 dark:border-red-500/50 focus:border-red-500 dark:focus:border-red-500 focus:ring-red-500/20'
          : '',
      ]"
    />

    <span
      class="block text-[10px] font-bold text-right ml-1"
      v-if="effectiveMaxLength && effectiveMaxLength > 0"
      :class="
        safeValue.length >= effectiveMaxLength
          ? 'text-red-500 dark:text-red-400 font-black'
          : 'text-slate-500 dark:text-slate-400'
      "
    >
      {{ safeValue.length }}/{{ effectiveMaxLength }}
    </span>
    <span
      class="block min-h-[14px] text-[10px] font-bold text-red-500 ml-1 leading-[14px]"
      :class="displayError ? 'block' : 'hidden'"
      >{{ displayError }}</span
    >
  </div>
</template>
