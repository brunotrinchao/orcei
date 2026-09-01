<script setup lang="ts">
import { computed } from 'vue'
import BaseSkeleton from './BaseSkeleton.vue'

interface Props {
  title?: string
  titulo?: string
  subtitle?: string
  subtitulo?: string
  icon?: any
  icone?: any
  color?: 'default' | 'white' | 'green' | 'blue' | 'purple' | 'orange' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'red' | 'slate' | string
  variant?: boolean
  badge?: string
  value?: string | number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  titulo: '',
  subtitle: '',
  subtitulo: '',
  color: 'blue',
  variant: false,
  badge: '',
  value: undefined,
  loading: false
})

const cardTitle = computed(() => props.title || props.titulo || '')
const cardSubtitle = computed(() => props.subtitle || props.subtitulo || '')
const cardIcon = computed(() => props.icon || props.icone)

interface ColorTheme {
  // Variant = false (Default Card: Fundo Branco)
  defaultCardBg: string
  defaultIconBg: string
  defaultTitle: string
  defaultValue: string
  defaultSubtitle: string

  // Variant = true (Card Colorido: Fundo com cor base)
  variantCardBg: string
  variantIconBg: string
  variantTitle: string
  variantValue: string
  variantSubtitle: string
}

const colorThemes: Record<string, ColorTheme> = {
  sky: {
    defaultCardBg: 'bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800',
    defaultIconBg: 'bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400',
    defaultTitle: 'text-gray-700 dark:text-gray-400',
    defaultValue: 'text-gray-900 dark:text-white',
    defaultSubtitle: 'text-slate-500 dark:text-gray-500',

    variantCardBg: 'bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50',
    variantIconBg: 'bg-sky-500 text-white dark:bg-sky-600',
    variantTitle: 'text-sky-800 dark:text-sky-300',
    variantValue: 'text-sky-900 dark:text-sky-100',
    variantSubtitle: 'text-sky-600 dark:text-sky-400'
  },
  blue: {
    defaultCardBg: 'bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800',
    defaultIconBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
    defaultTitle: 'text-gray-700 dark:text-gray-400',
    defaultValue: 'text-gray-900 dark:text-white',
    defaultSubtitle: 'text-slate-500 dark:text-gray-500',

    variantCardBg: 'bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50',
    variantIconBg: 'bg-blue-600 text-white dark:bg-blue-500',
    variantTitle: 'text-blue-800 dark:text-blue-300',
    variantValue: 'text-blue-900 dark:text-blue-100',
    variantSubtitle: 'text-blue-600 dark:text-blue-400'
  },
  emerald: {
    defaultCardBg: 'bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800',
    defaultIconBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    defaultTitle: 'text-gray-700 dark:text-gray-400',
    defaultValue: 'text-gray-900 dark:text-white',
    defaultSubtitle: 'text-slate-500 dark:text-gray-500',

    variantCardBg: 'bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50',
    variantIconBg: 'bg-emerald-600 text-white dark:bg-emerald-500',
    variantTitle: 'text-emerald-800 dark:text-emerald-300',
    variantValue: 'text-emerald-900 dark:text-emerald-100',
    variantSubtitle: 'text-emerald-600 dark:text-emerald-400'
  },
  green: {
    defaultCardBg: 'bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800',
    defaultIconBg: 'bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-400',
    defaultTitle: 'text-gray-700 dark:text-gray-400',
    defaultValue: 'text-gray-900 dark:text-white',
    defaultSubtitle: 'text-slate-500 dark:text-gray-500',

    variantCardBg: 'bg-green-50/70 dark:bg-green-950/40 border border-green-100 dark:border-green-900/50',
    variantIconBg: 'bg-green-600 text-white dark:bg-green-500',
    variantTitle: 'text-green-800 dark:text-green-300',
    variantValue: 'text-green-900 dark:text-green-100',
    variantSubtitle: 'text-green-600 dark:text-green-400'
  },
  amber: {
    defaultCardBg: 'bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800',
    defaultIconBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
    defaultTitle: 'text-gray-700 dark:text-gray-400',
    defaultValue: 'text-gray-900 dark:text-white',
    defaultSubtitle: 'text-slate-500 dark:text-gray-500',

    variantCardBg: 'bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50',
    variantIconBg: 'bg-amber-500 text-white dark:bg-amber-600',
    variantTitle: 'text-amber-800 dark:text-amber-300',
    variantValue: 'text-amber-900 dark:text-amber-100',
    variantSubtitle: 'text-amber-600 dark:text-amber-400'
  },
  orange: {
    defaultCardBg: 'bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800',
    defaultIconBg: 'bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400',
    defaultTitle: 'text-gray-700 dark:text-gray-400',
    defaultValue: 'text-gray-900 dark:text-white',
    defaultSubtitle: 'text-slate-500 dark:text-gray-500',

    variantCardBg: 'bg-orange-50/70 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/50',
    variantIconBg: 'bg-orange-500 text-white dark:bg-orange-600',
    variantTitle: 'text-orange-800 dark:text-orange-300',
    variantValue: 'text-orange-900 dark:text-orange-100',
    variantSubtitle: 'text-orange-600 dark:text-orange-400'
  },
  purple: {
    defaultCardBg: 'bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800',
    defaultIconBg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
    defaultTitle: 'text-gray-700 dark:text-gray-400',
    defaultValue: 'text-gray-900 dark:text-white',
    defaultSubtitle: 'text-slate-500 dark:text-gray-500',

    variantCardBg: 'bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50',
    variantIconBg: 'bg-purple-600 text-white dark:bg-purple-500',
    variantTitle: 'text-purple-800 dark:text-purple-300',
    variantValue: 'text-purple-900 dark:text-purple-100',
    variantSubtitle: 'text-purple-600 dark:text-purple-400'
  },
  violet: {
    defaultCardBg: 'bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800',
    defaultIconBg: 'bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400',
    defaultTitle: 'text-gray-700 dark:text-gray-400',
    defaultValue: 'text-gray-900 dark:text-white',
    defaultSubtitle: 'text-slate-500 dark:text-gray-500',

    variantCardBg: 'bg-violet-50/70 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/50',
    variantIconBg: 'bg-violet-600 text-white dark:bg-violet-500',
    variantTitle: 'text-violet-800 dark:text-violet-300',
    variantValue: 'text-violet-900 dark:text-violet-100',
    variantSubtitle: 'text-violet-600 dark:text-violet-400'
  },
  rose: {
    defaultCardBg: 'bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800',
    defaultIconBg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
    defaultTitle: 'text-gray-700 dark:text-gray-400',
    defaultValue: 'text-gray-900 dark:text-white',
    defaultSubtitle: 'text-slate-500 dark:text-gray-500',

    variantCardBg: 'bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50',
    variantIconBg: 'bg-rose-600 text-white dark:bg-rose-500',
    variantTitle: 'text-rose-800 dark:text-rose-300',
    variantValue: 'text-rose-900 dark:text-rose-100',
    variantSubtitle: 'text-rose-600 dark:text-rose-400'
  },
  red: {
    defaultCardBg: 'bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800',
    defaultIconBg: 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400',
    defaultTitle: 'text-gray-700 dark:text-gray-400',
    defaultValue: 'text-gray-900 dark:text-white',
    defaultSubtitle: 'text-slate-500 dark:text-gray-500',

    variantCardBg: 'bg-red-50/70 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50',
    variantIconBg: 'bg-red-600 text-white dark:bg-red-500',
    variantTitle: 'text-red-800 dark:text-red-300',
    variantValue: 'text-red-900 dark:text-red-100',
    variantSubtitle: 'text-red-600 dark:text-red-400'
  },
  indigo: {
    defaultCardBg: 'bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800',
    defaultIconBg: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    defaultTitle: 'text-gray-700 dark:text-gray-400',
    defaultValue: 'text-gray-900 dark:text-white',
    defaultSubtitle: 'text-slate-500 dark:text-gray-500',

    variantCardBg: 'bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50',
    variantIconBg: 'bg-indigo-600 text-white dark:bg-indigo-500',
    variantTitle: 'text-indigo-800 dark:text-indigo-300',
    variantValue: 'text-indigo-900 dark:text-indigo-100',
    variantSubtitle: 'text-indigo-600 dark:text-indigo-400'
  },
  slate: {
    defaultCardBg: 'bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800',
    defaultIconBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    defaultTitle: 'text-gray-700 dark:text-gray-400',
    defaultValue: 'text-gray-900 dark:text-white',
    defaultSubtitle: 'text-slate-500 dark:text-gray-500',

    variantCardBg: 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
    variantIconBg: 'bg-slate-700 text-white dark:bg-slate-600',
    variantTitle: 'text-slate-800 dark:text-slate-300',
    variantValue: 'text-slate-900 dark:text-slate-100',
    variantSubtitle: 'text-slate-600 dark:text-slate-400'
  }
}

const activeTheme = computed(() => {
  return colorThemes[props.color] || colorThemes.blue
})

const cardBgClass = computed(() => {
  return props.variant ? activeTheme.value.variantCardBg : activeTheme.value.defaultCardBg
})

const iconBgClass = computed(() => {
  return props.variant ? activeTheme.value.variantIconBg : activeTheme.value.defaultIconBg
})

const titleTextClass = computed(() => {
  return props.variant ? activeTheme.value.variantTitle : activeTheme.value.defaultTitle
})

const valueTextClass = computed(() => {
  return props.variant ? activeTheme.value.variantValue : activeTheme.value.defaultValue
})

const subtitleTextClass = computed(() => {
  return props.variant ? activeTheme.value.variantSubtitle : activeTheme.value.defaultSubtitle
})
</script>

<template>
  <!-- Skeleton Loading State -->
  <div v-if="loading"
    class="p-4 md:p-5 rounded-[.5rem] flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-3 md:gap-0 transition-all duration-200"
    :class="cardBgClass">
    <div class="flex flex-row justify-between w-auto md:w-full items-center md:items-start mb-0 md:mb-4 shrink-0">
      <div class="flex items-center md:items-start flex-1 min-w-0">
        <BaseSkeleton width="2.5rem" height="2.5rem" borderRadius="0.5rem" customClass="md:w-12 md:h-12 w-10 h-10" />
        <div class="ml-2.5 md:ml-3 space-y-1.5 min-w-0">
          <BaseSkeleton width="5rem" height="0.65rem" borderRadius="0.375rem" customClass="md:w-24" />
          <BaseSkeleton width="7rem" height="0.6rem" borderRadius="0.375rem" customClass="hidden md:block" />
        </div>
      </div>

      <BaseSkeleton width="3.5rem" height="1.2rem" borderRadius="0.5rem" customClass="hidden md:block ml-2" />
    </div>

    <div class="flex-1 min-w-0 w-full flex flex-col justify-center items-end md:items-start space-y-2">
      <BaseSkeleton width="45%" height="1.25rem" borderRadius="0.375rem" customClass="md:h-8 md:w-3/5 w-24" />
      <BaseSkeleton width="100%" height="0.5rem" borderRadius="9999px" customClass="mt-1" />
    </div>
  </div>

  <!-- Metric Card Content -->
  <div v-else
    class="p-4 md:p-5 rounded-[.5rem] flex flex-col transition-all duration-200"
    :class="cardBgClass">
    <div class="group flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-3 md:gap-0 w-full md:w-auto">
      <div class="flex flex-row justify-between w-auto md:w-full items-center md:items-start mb-0 shrink-0 w-full">
        <div class="flex items-center flex-1 min-w-0 w-full">
          <div v-if="cardIcon"
            class="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-full flex items-center justify-center transition-colors shrink-0"
            :class="iconBgClass">
            <component :is="cardIcon" class="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div class="ml-2.5 md:ml-3 min-w-0 w-full">
            <p v-if="cardTitle"
              class="text-right sm:text-sm text-xs font-semibold tracking-wider mb-0 md:mb-1 truncate"
              :class="titleTextClass">
              {{ cardTitle }}
            </p>
            <div class="min-w-0 w-full text-right">
              <h3 v-if="value !== undefined && value !== null"
                class="text-base sm:text-lg md:text-3xl font-semibold tracking-tight truncate"
                :class="valueTextClass">
                {{ value }}
              </h3>
              <slot v-else name="value" />
            </div>
            <div v-if="$slots.footer" class="mt-1.5 md:mt-2 w-full">
              <slot name="footer" />
            </div>
            <p v-if="cardSubtitle"
              class="hidden text-right md:block text-[11px] mt-0.5 font-medium truncate"
              :class="subtitleTextClass">
              {{ cardSubtitle }}
            </p>
          </div>
        </div>

        <span v-if="badge" class="hidden md:inline-block shrink-0 ml-2">
          <BaseBadge size="sm">
            {{ badge }}
          </BaseBadge>
        </span>
      </div>
    </div>
  </div>
</template>
