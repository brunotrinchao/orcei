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
  type?: 'button' | 'submit' | 'reset' | 'link' | 'a'
  block?: boolean
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
  block: false,
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
  if (props.iconOnly || props.size === 'icon') {
    return 'p-3 min-w-[56px] min-h-[56px] rounded-[.5rem]'
  }
  if (props.size === 'icon-sm') {
    return 'p-2 w-8 h-8 rounded-[.5rem]'
  }

  switch (props.size) {
    case 'xs':
      return 'px-3 py-1.5 text-xs'
    case 'sm':
      return 'px-4 py-2.5 text-xs'
    case 'lg':
      return 'px-8 py-5 text-base font-bold'
    case 'md':
    default:
      return 'px-5 py-3 text-[0.813rem] leading-[1.5]'
  }
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
          class="rounded-[.5rem] inline-flex items-center justify-center font-semibold transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 disabled:opacity-50 disabled:pointer-events-none cursor-pointer align-middle select-none border border-solid transition-colors duration-150 ease-in-out font-medium text-[0.813rem] leading-[1.5]"
          :class="[
            block ? 'w-full' : '',
            (disabled || loading) ? 'opacity-50 pointer-events-none' : '',
            variant === 'solid' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-black dark:hover:bg-white shadow-gray-200 dark:shadow-gray-800/50' : '',
            variant === 'primary' ? 'bg-brand text-white hover:bg-brand-dark' : '',
            variant === 'danger' ? 'bg-red-500 text-white hover:bg-red-600 dark:hover:bg-red-400 shadow-red-200 dark:shadow-red-950/50' : '',
            variant === 'outline' ? 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/80' : '',
            variant === 'secondary' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white' : '',
            variant === 'ghost' ? 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white' : '',
            variant === 'ia' ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold tracking-wide' : '',
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
    class="inline-flex items-center justify-center rounded-[.5rem] font-semibold tracking-wide transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
    :class="[
      block ? 'w-full' : '',
      (disabled || loading) ? 'opacity-50 pointer-events-none' : '',
      variant === 'solid' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-black dark:hover:bg-white shadow-gray-200 dark:shadow-gray-800/50' : '',
      variant === 'primary' ? 'bg-brand text-white hover:bg-brand-dark' : '',
      variant === 'danger' ? 'bg-red-500 text-white hover:bg-red-600 dark:hover:bg-red-400 shadow-red-200 dark:shadow-red-950/50' : '',
      variant === 'outline' ? 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/80' : '',
      variant === 'secondary' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white' : '',
      variant === 'ghost' ? 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white' : '',
      variant === 'ia' ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold tracking-wide' : '',
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
