<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

interface Props {
  variant?: 'solid' | 'outline' | 'ghost' | 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  to?: string
}
withDefaults(defineProps<Props>(), {
  variant: 'solid',
  size: 'md'
})

const NuxtLink = resolveComponent('NuxtLink')
</script>

<template>
  <component
    :is="to ? NuxtLink : 'button'"
    :to="to"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 disabled:opacity-50"
    :class="[
      variant === 'solid' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-black dark:hover:bg-white shadow-lg shadow-gray-200 dark:shadow-gray-800' : '',
      variant === 'primary' ? 'bg-[#3147F6] text-white hover:bg-[#2638d4] shadow-lg shadow-blue-200 dark:shadow-blue-950/50' : '',
      variant === 'danger' ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-red-950/50' : '',
      variant === 'outline' ? 'bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50 hover:border-gray-300 dark:hover:border-gray-600' : '',
      variant === 'secondary' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700' : '',
      variant === 'ghost' ? 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white' : '',
      size === 'sm' ? 'px-4 py-2 text-[10px]' : '',
      size === 'md' ? 'px-8 py-4 text-xs' : '',
      size === 'lg' ? 'px-12 py-5 text-sm' : ''
    ]"
  >
    <slot v-if="!loading" />
    <span v-else class="animate-spin w-5 h-5 flex items-center justify-center">
      <Loader2 class="w-5 h-5" />
    </span>
  </component>
</template>
