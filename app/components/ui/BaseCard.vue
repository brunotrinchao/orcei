<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title?: string
  subtitle?: string
  color?: 'default' | 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'slate' | 'ia' | string
  noPadding?: boolean
  compact?: boolean
  headerSeparator?: boolean
  headerSeparetor?: boolean
  footerSeparator?: boolean
  footerSeparetor?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  subtitle: undefined,
  color: 'default',
  noPadding: false,
  compact: false,
  headerSeparator: false,
  headerSeparetor: undefined,
  footerSeparator: false,
  footerSeparetor: undefined
})

const showHeaderSeparator = computed(() => {
  if (props.headerSeparetor !== undefined) return props.headerSeparetor
  return props.headerSeparator
})

const showFooterSeparator = computed(() => {
  if (props.footerSeparetor !== undefined) return props.footerSeparetor
  return props.footerSeparator
})

const headerPaddingClasses = computed(() => {
  return props.compact ? 'px-4 py-2.5' : 'px-6 py-4'
})

const bodyPaddingClasses = computed(() => {
  if (props.noPadding) return ''
  return props.compact ? 'p-3.5' : 'p-6'
})

const footerPaddingClasses = computed(() => {
  return props.compact ? 'px-4 py-2.5' : 'px-6 py-4'
})

const cardColorClasses = computed(() => {
  switch (props.color) {
    case 'blue':
      return 'bg-blue-50 dark:bg-blue-950/40 text-slate-900 dark:text-blue-100'
    case 'emerald':
    case 'green':
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-slate-900 dark:text-emerald-100'
    case 'amber':
    case 'yellow':
      return 'bg-amber-50 dark:bg-amber-950/40 text-slate-900 dark:text-amber-100'
    case 'purple':
    case 'violet':
      return 'bg-purple-50 dark:bg-purple-950/40 text-slate-900 dark:text-purple-100'
    case 'rose':
    case 'red':
      return 'bg-rose-50 dark:bg-rose-950/40 text-slate-900 dark:text-rose-100'
    case 'slate':
    case 'gray':
      return 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100'
    case 'ia':
      return 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-indigo-900 dark:text-gray-100'
    case 'default':
    default:
      if (props.color && props.color !== 'default') {
        return props.color
      }
      return 'bg-white dark:bg-gray-900 text-slate-900 dark:text-white'
  }
})
</script>

<template>
  <div
    class="rounded-[.5rem] shadow-sm overflow-hidden transition-all duration-200 border"
    :class="cardColorClasses"
  >
    <!-- Header -->
    <header
      v-if="title || $slots.header"
      class="flex items-center justify-between gap-4"
      :class="[headerPaddingClasses, showHeaderSeparator ? 'border-b border-black/10 dark:border-white/10' : '']"
    >
      <slot name="header">
        <div class="min-w-0 flex-1">
          <h3 v-if="title" class="font-semibold text-inherit truncate" :class="compact ? 'text-base' : 'text-xl'">
            {{ title }}
          </h3>
          <p v-if="subtitle" class="text-xs text-slate-500 dark:text-gray-400 font-medium mt-0.5 truncate">
            {{ subtitle }}
          </p>
        </div>
      </slot>
    </header>

    <!-- Content / Corpo Principal -->
    <div :class="bodyPaddingClasses">
      <slot />
    </div>

    <!-- Footer -->
    <footer
      v-if="$slots.footer"
      class="flex items-center justify-end gap-4"
      :class="[footerPaddingClasses, showFooterSeparator ? 'border-t border-black/10 dark:border-white/10' : '']"
    >
      <slot name="footer" />
    </footer>
  </div>
</template>
