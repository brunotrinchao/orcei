<script setup lang="ts">
interface Props {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})

const variants = {
  default: 'bg-gray-100 text-gray-600',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-yellow-50 text-yellow-700',
  error: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700'
}
</script>

<template>
  <span 
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    :class="variants[variant]"
  >
    <slot></slot>
  </span>
</template>
