<script setup lang="ts">
interface Props {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})

const variants = {
  default: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
  success: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  warning: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  error: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  info: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
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
