<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFieldValidation } from '~/composables/useFormValidation'

const props = defineProps<{
  modelValue?: string | null
  label?: string
  placeholder?: string
  error?: string
  rows?: number
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  maxLength?: number
}>()

const emit = defineEmits(['update:modelValue', 'blur', 'focus'])

const safeValue = computed(() => props.modelValue ?? '')

const onInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}

const inputId = useId()
const textareaEl = ref<HTMLTextAreaElement | null>(null)

const isEmpty = () => !!props.required && (!props.modelValue || props.modelValue.trim() === '')
const { submitAttempted } = useFieldValidation({ isEmpty, focus: () => textareaEl.value?.focus() })
const showRequiredError = computed(() => submitAttempted.value && isEmpty())
const displayError = computed(() => props.error || (showRequiredError.value ? 'Campo obrigatório' : ''))
</script>

<template>
  <div class="space-y-2">
    <div v-if="label || maxLength" class="flex justify-between items-center ml-1">
      <label v-if="label" :for="inputId" class="block text-xs font-black text-slate-700 dark:text-gray-400 uppercase tracking-widest">
        {{ label }} <span v-if="required" class="text-red-500">*</span>
      </label>
      <span v-if="maxLength" class="text-[10px] font-bold text-gray-500 dark:text-gray-500">
        {{ safeValue.length }}/{{ maxLength }}
      </span>
    </div>

    <textarea
      :id="inputId"
      ref="textareaEl"
      :value="safeValue"
      @input="onInput"
      @blur="emit('blur', $event)"
      @focus="emit('focus', $event)"
      :rows="rows || 4"
      :maxlength="maxLength"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :class="[
        'w-full p-4 bg-white dark:bg-gray-950 border-2 border-gray-300 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none font-bold text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:cursor-not-allowed resize-y shadow-xs',
        displayError ? 'border-red-500 dark:border-red-500/50 focus:border-red-500 dark:focus:border-red-500 focus:ring-red-500/20' : ''
      ]"
    />
    <span class="block min-h-[14px] text-[10px] font-bold text-red-500 ml-1 uppercase leading-[14px]">{{ displayError }}</span>
  </div>
</template>
