<script setup lang="ts">
interface Props {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})

const variants = {
  default: 'bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-gray-700',
  success: 'bg-emerald-50 dark:bg-green-900/30 text-emerald-800 dark:text-green-400 border border-emerald-200 dark:border-green-800/50',
  warning: 'bg-amber-50 dark:bg-yellow-900/30 text-amber-800 dark:text-yellow-400 border border-amber-200 dark:border-yellow-800/50',
  error: 'bg-rose-50 dark:bg-red-900/30 text-rose-800 dark:text-red-400 border border-rose-200 dark:border-red-800/50',
  info: 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50'
}
</script>

<template>
  <span 
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold"
    :class="variants[variant]"
  >
    <slot></slot>
  </span>
</template>
