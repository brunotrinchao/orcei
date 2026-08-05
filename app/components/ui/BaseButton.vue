<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

interface Props {
  variant?: 'solid' | 'outline' | 'ghost' | 'primary' | 'secondary' | 'danger' | 'ia'
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'
  type?: 'button' | 'submit' | 'reset'
  iconOnly?: boolean
  disabled?: boolean
  loading?: boolean
  to?: string
}

withDefaults(defineProps<Props>(), {
  variant: 'solid',
  size: 'md',
  type: 'button',
  iconOnly: false
})

const NuxtLink = resolveComponent('NuxtLink')
</script>

<template>
  <component
    :is="to ? NuxtLink : 'button'"
    :to="to"
    :type="!to ? type : undefined"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center rounded-[0.75rem] font-black uppercase tracking-widest transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 disabled:opacity-50 disabled:pointer-events-none"
    :class="[
      variant === 'solid' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-black dark:hover:bg-white shadow-gray-200 dark:shadow-gray-800/50' : '',
      variant === 'primary' ? 'bg-[#3147F6] text-white hover:bg-[#2638d4] dark:hover:bg-[#4359ff] shadow-blue-200 dark:shadow-blue-950/50' : '',
      variant === 'danger' ? 'bg-red-500 text-white hover:bg-red-600 dark:hover:bg-red-400 shadow-red-200 dark:shadow-red-950/50' : '',
      variant === 'outline' ? 'bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/80' : '',
      variant === 'secondary' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white' : '',
      variant === 'ghost' ? 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white' : '',
      variant === 'ia' ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-black tracking-wider shadow-lg shadow-violet-500/20 active:scale-98 transition-all' : '',
      size === 'sm' && !iconOnly ? 'px-4 py-2 text-[10px]' : '',
      size === 'md' && !iconOnly ? 'px-8 py-4 text-xs' : '',
      size === 'lg' && !iconOnly ? 'px-12 py-5 text-sm' : '',
      (size === 'icon-sm' || (iconOnly && size === 'sm')) ? 'p-2 w-8 h-8 rounded-[0.75rem] text-xs' : '',
      (size === 'icon' || iconOnly) && size !== 'sm' && size !== 'icon-sm' ? 'p-3 w-10 h-10 rounded-[0.75rem] text-sm' : ''
    ]"
  >
    <slot v-if="!loading" />
    <span v-else class="animate-spin w-5 h-5 flex items-center justify-center">
      <Loader2 class="w-5 h-5" />
    </span>
  </component>
</template>
