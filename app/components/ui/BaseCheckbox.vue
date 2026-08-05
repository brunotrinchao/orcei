<script setup lang="ts">
import { computed, ref } from 'vue'
import { CheckboxIndicator, CheckboxRoot } from 'radix-vue'
import { Check } from 'lucide-vue-next'
import { useFieldValidation } from '~/composables/useFormValidation'

const props = defineProps<{
  modelValue: boolean
  label?: string
  required?: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const rootRef = ref<InstanceType<typeof CheckboxRoot> | null>(null)

const isEmpty = () => !!props.required && !props.modelValue
const { submitAttempted } = useFieldValidation({
  isEmpty,
  focus: () => (rootRef.value as any)?.$el?.focus?.()
})
const showRequiredError = computed(() => submitAttempted.value && isEmpty())
</script>

<template>
  <div>
    <div class="flex items-center gap-3">
      <CheckboxRoot
        ref="rootRef"
        :checked="modelValue"
        @update:checked="emit('update:modelValue', $event)"
        :class="[
          'flex h-6 w-6 appearance-none items-center justify-center rounded-[0.75rem] border-gray-300 dark:border-gray-800 border-2 hover:border-gray-300 dark:hover:border-gray-600 outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 transition-all data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600',
          showRequiredError ? 'border-red-300 dark:border-red-500/50' : 'border-gray-200 dark:border-gray-700'
        ]"
      >
        <CheckboxIndicator class="flex items-center justify-center text-white">
          <Check class="w-4 h-4" />
        </CheckboxIndicator>
      </CheckboxRoot>
      <label v-if="label" class="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
        {{ label }}
      </label>
    </div>
    <span class="block min-h-[14px] text-[10px] font-bold text-red-500 ml-1 uppercase leading-[14px]"
    :class="showRequiredError ? 'block' : 'hidden'">
      {{ showRequiredError ? 'Campo obrigatório' : '' }}</span>
  </div>
</template>
