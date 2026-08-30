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
  color?: 'green' | 'blue' | 'purple' | 'orange' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'red' | string
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
  badge: '',
  value: undefined,
  loading: false
})

const cardTitle = computed(() => props.title || props.titulo || '')
const cardSubtitle = computed(() => props.subtitle || props.subtitulo || '')
const cardIcon = computed(() => props.icon || props.icone)

const colorStyles: Record<string, { iconBg: string; badge: string }> = {
  green: {
    iconBg: 'bg-green-200 dark:bg-green-950/30 text-green-600 dark:text-green-400',
    badge: 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/50'
  },
  emerald: {
    iconBg: 'bg-emerald-200 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
  },
  blue: {
    iconBg: 'bg-blue-200 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50'
  },
  purple: {
    iconBg: 'bg-purple-200 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/50'
  },
  orange: {
    iconBg: 'bg-orange-200 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/50'
  },
  amber: {
    iconBg: 'bg-amber-200 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
  },
  indigo: {
    iconBg: 'bg-indigo-200 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400',
    badge: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50'
  },
  rose: {
    iconBg: 'bg-rose-200 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400',
    badge: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50'
  },
  sky: {
    iconBg: 'bg-sky-200 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400',
    badge: 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800/50'
  },
  violet: {
    iconBg: 'bg-violet-200 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400',
    badge: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800/50'
  },
  red: {
    iconBg: 'bg-red-200 dark:bg-red-950/30 text-red-600 dark:text-red-400',
    badge: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50'
  }
}

const computedColorStyle = computed(() => {
  return colorStyles[props.color] || colorStyles.blue
})
</script>

<template>
  <!-- Skeleton Loading State -->
  <div v-if="loading"
    class="bg-white dark:bg-gray-900 p-4 md:p-5 rounded-[0.75rem] flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-3 md:gap-0">
    <div class="flex flex-row justify-between w-auto md:w-full items-center md:items-start mb-0 md:mb-4 shrink-0">
      <div class="flex items-center md:items-start flex-1 min-w-0">
        <BaseSkeleton width="2.5rem" height="2.5rem" borderRadius="0.75rem" customClass="md:w-12 md:h-12 w-10 h-10" />
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
    class="bg-white dark:bg-gray-900 p-4 md:p-5 rounded-[0.75rem]  flex flex-col transition-all">
    <div class="group flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-3 md:gap-0 w-full md:w-auto">
      <div class="flex flex-row justify-between w-auto md:w-full items-center md:items-start mb-0 shrink-0 w-ful">
        <div class="flex items-center flex-1 min-w-0 w-full">
          <div v-if="cardIcon"
            class="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-full flex items-center justify-center transition-colors shrink-0"
            :class="computedColorStyle.iconBg">
            <component :is="cardIcon" class="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div class="ml-2.5 md:ml-3 min-w-0 w-full">
            <p v-if="cardTitle"
              class="text-right sm:text-sm text-xs font-semibold text-gray-700 dark:text-gray-400 tracking-wider mb-0 md:mb-1 truncate">
              {{ cardTitle }}
            </p>
            <div
              class="min-w-0 w-full text-right">
              <h3 v-if="value !== undefined && value !== null"
                class="text-base sm:text-lg md:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight truncate">
                {{ value }}
              </h3>
              <slot v-else name="value" />

            </div>
            <div v-if="$slots.footer" class="mt-1.5 md:mt-2 w-full">
              <slot name="footer" />
            </div>
            <p v-if="cardSubtitle"
              class="hidden text-right md:block text-[11px] text-slate-500 dark:text-gray-500 mt-0.5 font-medium truncate">
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
