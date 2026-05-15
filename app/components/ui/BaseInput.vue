<script setup lang="ts">
const props = defineProps<{
  modelValue: string | number | null
  label?: string
  mask?: string | any
  placeholder?: string
  error?: string
  type?: string
  required?: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

// Map named masks to Maska configurations
const computedMask = computed(() => {
  if (!props.mask) return undefined
  
  if (props.mask === 'currency') {
    return {
      mask: 'R$ !#*.##0,00',
      tokens: { '0': { pattern: /[0-9]/, repeated: true } },
      reversed: true
    }
  }

  if (props.mask === 'phone') {
    return '(##) #####-####'
  }

  if (props.mask === 'cep') {
    return '#####-###'
  }

  if (props.mask === 'cpf') {
    return '###.###.###-##'
  }

  if (props.mask === 'cnpj') {
    return '##.###.###/####-##'
  }

  if (props.mask === 'document') {
    // Dynamic CPF/CNPJ
    const val = String(props.modelValue || '').replace(/\D/g, '')
    return val.length <= 11 ? '###.###.###-##' : '##.###.###/####-##'
  }

  return props.mask
})
</script>
<template>
  <div class="space-y-2">
    <label v-if="label" class="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </label>
    <input
      :value="modelValue"
      @input="onInput"
      v-maska="computedMask"
      :type="type || 'text'"
      :placeholder="placeholder"
      class="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-gray-900 placeholder:text-gray-300 disabled:opacity-50 disabled:bg-gray-50"
      :class="{ 'border-red-200 focus:border-red-500 focus:ring-red-500/10': error }"
    >
    <span v-if="error" class="text-[10px] font-bold text-red-500 ml-1 uppercase">{{ error }}</span>
  </div>
</template>
