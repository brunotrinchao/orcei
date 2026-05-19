<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

interface Props {
  variant?: 'solid' | 'outline' | 'ghost' | 'primary' | 'secondary'
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
    class="inline-flex items-center justify-center rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
    :class="[
      (variant === 'solid' || variant === 'primary') ? 'bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-200' : '',
      variant === 'outline' ? 'bg-white border-2 border-gray-100 text-gray-900 hover:border-gray-200' : '',
      variant === 'secondary' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : '',
      variant === 'ghost' ? 'text-gray-500 hover:bg-gray-50 hover:text-gray-900' : '',
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
