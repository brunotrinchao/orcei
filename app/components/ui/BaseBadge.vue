<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'ia' | 'price'
  outline?: boolean
  light?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  outline: false,
  light: false,
  size: 'sm',
  rounded: 'md'
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'px-1.5 py-0.5 text-[9px]'
    case 'md':
      return 'px-3 py-1 text-[11px]'
    case 'lg':
      return 'px-3.5 py-1.5 text-[14px]'
    case 'sm':
      return 'px-2.5 py-0.5 text-[10px]'
    default:
      return 'px-2.5 py-0.5 text-[11px]'
  }
})

const roundedClasses = computed(() => {
  if (props.rounded === true || props.rounded === 'full') return 'rounded-full'
  if (props.rounded === false || props.rounded === 'none') return 'rounded-none'
  switch (props.rounded) {
    case 'sm':
      return 'rounded-[0.5rem]'
    case 'lg':
      return 'rounded-[0.5rem]'
    case 'xl':
      return 'rounded-[0.5rem]'
    case 'md':
    default:
      return 'rounded-[0.5rem]'
  }
})

const variantClasses = computed(() => {
  if (props.outline) {
    switch (props.variant) {
      case 'success':
        return 'bg-transparent text-emerald-700 dark:text-emerald-400 border border-emerald-500/60 dark:border-emerald-500/50'
      case 'warning':
        return 'bg-transparent text-amber-700 dark:text-amber-400 border border-amber-500/60 dark:border-amber-500/50'
      case 'error':
        return 'bg-transparent text-rose-700 dark:text-rose-400 border border-rose-500/60 dark:border-rose-500/50'
      case 'info':
        return 'bg-transparent text-blue-700 dark:text-blue-400 border border-blue-500/60 dark:border-blue-500/50'
      case 'ia':
        return 'bg-transparent text-violet-700 dark:text-violet-400 border border-violet-500/60 dark:border-violet-500/50'
      case 'price':
        return 'bg-transparent text-indigo-700 dark:text-indigo-400 border border-indigo-500/60 dark:border-indigo-500/50'
      case 'default':
      default:
        return 'bg-transparent text-slate-700 dark:text-gray-300 border border-slate-300 dark:border-gray-600'
    }
  }

  if (props.light) {
    switch (props.variant) {
      case 'success':
        return 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-200 border border-emerald-200/50 dark:border-emerald-800/40'
      case 'warning':
        return 'bg-amber-100 dark:bg-amber-950/70 text-amber-950 dark:text-amber-200 border border-amber-200/50 dark:border-amber-800/40'
      case 'error':
        return 'bg-rose-100 dark:bg-rose-950/70 text-rose-950 dark:text-rose-200 border border-rose-200/50 dark:border-rose-800/40'
      case 'info':
        return 'bg-blue-100 dark:bg-blue-950/70 text-blue-950 dark:text-blue-200 border border-blue-200/50 dark:border-blue-800/40'
      case 'ia':
        return 'bg-violet-100 dark:bg-violet-950/70 text-violet-950 dark:text-violet-200 border border-violet-200/50 dark:border-violet-800/40'
      case 'price':
        return 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-950 dark:text-indigo-200 border border-indigo-200/50 dark:border-indigo-800/40'
      case 'default':
      default:
        return 'bg-slate-200/80 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-300/50 dark:border-slate-700/40'
    }
  }

  switch (props.variant) {
    case 'success':
      return 'bg-emerald-50 dark:bg-green-900/30 text-emerald-800 dark:text-green-400 border border-emerald-200 dark:border-green-800/50'
    case 'warning':
      return 'bg-amber-50 dark:bg-yellow-900/30 text-amber-800 dark:text-yellow-400 border border-amber-200 dark:border-amber-800/50'
    case 'error':
      return 'bg-rose-50 dark:bg-red-900/30 text-rose-800 dark:text-red-400 border border-rose-200 dark:border-red-800/50'
    case 'info':
      return 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50'
    case 'ia':
      return 'bg-violet-200 dark:bg-violet-900/30 text-violet-800 dark:text-violet-400 border border-violet-700/50 dark:border-violet-800/50'
    case 'price':
      return 'bg-indigo-900/50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 border border-indigo-700/50 dark:border-indigo-800/50'
    case 'default':
    default:
      return 'bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-gray-700'
  }
})
</script>

<template>
  <span 
    class="inline-flex items-center font-bold"
    :class="[
      variantClasses,
      sizeClasses,
      roundedClasses
    ]"
  >
    <slot></slot>
  </span>
</template>
