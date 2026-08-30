<script setup lang="ts">
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import {
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
  TooltipArrow
} from 'radix-vue'

defineOptions({
  inheritAttrs: false
})

interface Props {
  variant?: 'solid' | 'outline' | 'ghost' | 'primary' | 'secondary' | 'danger' | 'ia' | 'whatsapp'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'
  mobileSize?: 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'
  type?: 'button' | 'submit' | 'reset' | 'link' | 'a'
  iconOnly?: boolean
  disabled?: boolean
  loading?: boolean
  to?: string
  href?: string
  target?: string
  tooltip?: string
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left'
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  iconOnly: false,
  tooltipSide: 'top',
  href: undefined,
  target: undefined
})

const NuxtLink = resolveComponent('NuxtLink')

const componentTag = computed(() => {
  if (props.to) return NuxtLink
  if (props.type === 'link' || props.type === 'a' || props.href) return 'a'
  return 'button'
})

const sizeClasses = computed(() => {
  if (props.iconOnly || props.size === 'icon' || props.size === 'icon-sm') {
    const isSmallIcon = props.size === 'icon-sm' || (props.iconOnly && (props.size === 'sm' || props.mobileSize === 'sm' || props.mobileSize === 'icon-sm'))
    if (isSmallIcon) {
      return 'p-2 w-8 h-8 rounded-[0.75rem] text-xs'
    }
    return 'p-2.5 sm:p-3 w-9 sm:w-10 h-9 sm:h-10 rounded-[0.75rem] text-xs sm:text-sm'
  }

  if (props.mobileSize) {
    const mobileMap: Record<string, string> = {
      xs: 'px-2 py-1 text-[9px]',
      sm: 'px-3 py-1.5 text-[10px]',
      md: 'px-4 py-2 text-xs',
      lg: 'px-6 py-3 text-sm'
    }
    const desktopMap: Record<string, string> = {
      xs: 'sm:px-2 sm:py-1 sm:text-[9px]',
      sm: 'sm:px-4 sm:py-2 sm:text-[10px]',
      md: 'sm:px-8 sm:py-4 sm:text-xs',
      lg: 'sm:px-12 sm:py-5 sm:text-sm'
    }
    const m = mobileMap[props.mobileSize] || 'px-4 py-2 text-xs'
    const d = desktopMap[props.size] || 'sm:px-8 sm:py-4 sm:text-xs'
    return `${m} ${d}`
  }

  if (props.size === 'xs') return 'px-2 py-1 text-[9px]'
  if (props.size === 'sm') return 'px-3 py-1.5 text-[10px] sm:px-4 sm:py-2 sm:text-[10px]'
  if (props.size === 'md') return 'px-4 py-2 text-xs sm:px-8 sm:py-4 sm:text-xs'
  if (props.size === 'lg') return 'px-5 py-2.5 text-xs sm:px-12 sm:py-5 sm:text-sm'

  return 'px-4 py-2 text-xs sm:px-8 sm:py-4 sm:text-xs'
})
</script>

<template>
  <TooltipProvider v-if="tooltip" :delay-duration="150">
    <TooltipRoot>
      <TooltipTrigger as-child>
        <component
          :is="componentTag"
          v-bind="$attrs"
          :to="to"
          :href="componentTag === 'a' ? href : undefined"
          :target="componentTag === 'a' ? target : undefined"
          :type="componentTag === 'button' ? type : undefined"
          :disabled="componentTag === 'button' ? (disabled || loading) : undefined"
          :aria-disabled="componentTag !== 'button' && (disabled || loading) ? 'true' : undefined"
          :title="title || tooltip"
          :aria-label="tooltip || title"
          class="inline-flex items-center justify-center rounded-[0.75rem] font-semibold transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 disabled:opacity-50 disabled:pointer-events-none"
          :class="[
            (disabled || loading) ? 'opacity-50 pointer-events-none' : '',
            variant === 'solid' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-black dark:hover:bg-white shadow-gray-200 dark:shadow-gray-800/50' : '',
            variant === 'primary' ? 'bg-[#3147F6] text-white hover:bg-[#2638d4] dark:hover:bg-[#4359ff] shadow-blue-200 dark:shadow-blue-950/50' : '',
            variant === 'danger' ? 'bg-red-500 text-white hover:bg-red-600 dark:hover:bg-red-400 shadow-red-200 dark:shadow-red-950/50' : '',
            variant === 'outline' ? 'bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/80' : '',
            variant === 'secondary' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white' : '',
            variant === 'ghost' ? 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white' : '',
            variant === 'ia' ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-black tracking-wider shadow-lg shadow-violet-500/20 active:scale-98 transition-all' : '',
            variant === 'whatsapp' ? 'bg-emerald-600 text-white hover:bg-emerald-200 dark:hover:bg-emerald-700 hover:text-white-900 dark:hover:text-white' : '',
            sizeClasses
          ]"
        >
          <slot v-if="!loading" />
          <span v-else class="animate-spin w-5 h-5 flex items-center justify-center">
            <Loader2 class="w-5 h-5" />
          </span>
        </component>
      </TooltipTrigger>

      <TooltipPortal>
        <TooltipContent
          :side="tooltipSide"
          :side-offset="6"
          class="z-[999999] px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold rounded-xl shadow-xl border border-slate-800 dark:border-slate-200 animate-in fade-in zoom-in-95 duration-150 pointer-events-none"
        >
          {{ tooltip }}
          <TooltipArrow class="fill-slate-900 dark:fill-slate-100" />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>

  <component
    v-else
    :is="componentTag"
    v-bind="$attrs"
    :to="to"
    :href="componentTag === 'a' ? href : undefined"
    :target="componentTag === 'a' ? target : undefined"
    :type="componentTag === 'button' ? type : undefined"
    :disabled="componentTag === 'button' ? (disabled || loading) : undefined"
    :aria-disabled="componentTag !== 'button' && (disabled || loading) ? 'true' : undefined"
    :title="title"
    class="inline-flex items-center justify-center rounded-[0.75rem] font-semibold tracking-wide transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 disabled:opacity-50 disabled:pointer-events-none"
    :class="[
      (disabled || loading) ? 'opacity-50 pointer-events-none' : '',
      variant === 'solid' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-black dark:hover:bg-white shadow-gray-200 dark:shadow-gray-800/50' : '',
      variant === 'primary' ? 'bg-[#3147F6] text-white hover:bg-[#2638d4] dark:hover:bg-[#4359ff] shadow-blue-200 dark:shadow-blue-950/50' : '',
      variant === 'danger' ? 'bg-red-500 text-white hover:bg-red-600 dark:hover:bg-red-400 shadow-red-200 dark:shadow-red-950/50' : '',
      variant === 'outline' ? 'bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/80' : '',
      variant === 'secondary' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white' : '',
      variant === 'ghost' ? 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white' : '',
      variant === 'ia' ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-black tracking-wider shadow-lg shadow-violet-500/20 active:scale-98 transition-all' : '',
      variant === 'whatsapp' ? 'bg-emerald-600 text-white hover:bg-emerald-200 dark:hover:bg-emerald-700 hover:text-white-900 dark:hover:text-white' : '',
      sizeClasses
    ]"
  >
    <slot v-if="!loading" />
    <span v-else class="animate-spin w-5 h-5 flex items-center justify-center">
      <Loader2 class="w-5 h-5" />
    </span>
  </component>
</template>
