<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Component } from 'vue'
import { Info, CheckCircle2, AlertTriangle, AlertCircle, HelpCircle, Sparkles, X } from 'lucide-vue-next'

type VariantType = 'info' | 'success' | 'warning' | 'error' | 'danger' | 'neutral' | 'violet' | string

interface Props {
  variant?: VariantType
  title?: string
  description?: string
  icon?: Component | string | boolean
  compact?: boolean
  dismissible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info',
  title: undefined,
  description: undefined,
  icon: true,
  compact: false,
  dismissible: false
})

const emit = defineEmits<{
  (e: 'dismiss'): void
}>()

const isDismissed = ref(false)

const handleDismiss = () => {
  isDismissed.value = true
  emit('dismiss')
}

// Icon resolution
const defaultIconMap: Record<string, Component> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  danger: AlertCircle,
  neutral: HelpCircle,
  violet: Sparkles,
}

const resolvedIcon = computed(() => {
  if (props.icon === false) return null
  if (typeof props.icon === 'object' || typeof props.icon === 'function') {
    return props.icon as Component
  }
  const v = props.variant?.toLowerCase() || 'info'
  return defaultIconMap[v] || Info
})

// Variant Color Scheme (Background, Icon Container, Title, Description)
const variantStyles = computed(() => {
  const v = props.variant?.toLowerCase() || 'info'

  switch (v) {
    case 'success':
    case 'emerald':
    case 'green':
      return {
        bg: 'bg-emerald-50/70 dark:bg-emerald-950/40',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        titleColor: 'text-emerald-950 dark:text-emerald-100',
        textColor: 'text-emerald-800/90 dark:text-emerald-300/90',
        dismissColor: 'text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
      }

    case 'warning':
    case 'amber':
    case 'yellow':
      return {
        bg: 'bg-amber-50/70 dark:bg-amber-950/40',
        iconBg: 'bg-amber-100 dark:bg-amber-900/50',
        iconColor: 'text-amber-600 dark:text-amber-400',
        titleColor: 'text-amber-950 dark:text-amber-100',
        textColor: 'text-amber-800/90 dark:text-amber-300/90',
        dismissColor: 'text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/60'
      }

    case 'error':
    case 'danger':
    case 'red':
      return {
        bg: 'bg-red-50/70 dark:bg-red-950/40',
        iconBg: 'bg-red-100 dark:bg-red-900/50',
        iconColor: 'text-red-600 dark:text-red-400',
        titleColor: 'text-red-950 dark:text-red-100',
        textColor: 'text-red-800/90 dark:text-red-300/90',
        dismissColor: 'text-red-600 hover:bg-red-100 dark:hover:bg-red-900/60'
      }

    case 'neutral':
    case 'slate':
    case 'gray':
      return {
        bg: 'bg-slate-100/70 dark:bg-gray-800/50',
        iconBg: 'bg-slate-200/80 dark:bg-gray-700/60',
        iconColor: 'text-slate-700 dark:text-gray-300',
        titleColor: 'text-slate-900 dark:text-gray-100',
        textColor: 'text-slate-600 dark:text-gray-400',
        dismissColor: 'text-slate-500 hover:bg-slate-200 dark:hover:bg-gray-700'
      }

    case 'violet':
    case 'purple':
      return {
        bg: 'bg-violet-50/70 dark:bg-violet-950/40',
        iconBg: 'bg-violet-100 dark:bg-violet-900/50',
        iconColor: 'text-violet-600 dark:text-violet-400',
        titleColor: 'text-violet-950 dark:text-violet-100',
        textColor: 'text-violet-800/90 dark:text-violet-300/90',
        dismissColor: 'text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-900/60'
      }

    case 'info':
    case 'blue':
    default:
      return {
        bg: 'bg-blue-50/70 dark:bg-blue-950/40',
        iconBg: 'bg-blue-100 dark:bg-blue-900/50',
        iconColor: 'text-blue-600 dark:text-blue-400',
        titleColor: 'text-blue-950 dark:text-blue-100',
        textColor: 'text-blue-800/90 dark:text-blue-300/90',
        dismissColor: 'text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/60'
      }
  }
})

const paddingClasses = computed(() => {
  return props.compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5'
})
</script>

<template>
  <Transition
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div
      v-if="!isDismissed"
      class="rounded-[.5rem] border-0 border-transparent transition-all flex items-start justify-between gap-4 mb-4"
      :class="[variantStyles.bg, paddingClasses]"
      role="alert"
    >
      <div class="flex items-start gap-3.5 min-w-0 flex-1 items-center content-center">
        <!-- Slot de Ícone ou Ícone Padrão -->
        <div
          v-if="$slots.icon || resolvedIcon"
          class="w-9 h-9 rounded-[0.5rem] flex items-center justify-center shrink-0 mt-0.5 !font-normal !text-white"
          :class="[variantStyles.iconColor]"
        >
          <slot name="icon">
            <component :is="resolvedIcon" class="w-8 h-8" />
          </slot>
        </div>

        <!-- Conteúdo Principal (Título + Descrição) -->
        <div class="space-y-1 min-w-0 flex-1">
          <h4
            v-if="title || $slots.title"
            class="text-xs font-black uppercase tracking-wider leading-snug truncate"
            :class="variantStyles.titleColor"
          >
            <slot name="title">{{ title }}</slot>
          </h4>

          <div
            v-if="description || $slots.default"
            class="text-sm font-medium leading-relaxed"
            :class="variantStyles.textColor"
          >
            <slot>{{ description }}</slot>
          </div>
        </div>
      </div>

      <!-- Slot de Ações / Botão de Fechar -->
      <div class="flex items-center gap-2 shrink-0">
        <slot name="actions" />

        <button
          v-if="dismissible"
          type="button"
          @click="handleDismiss"
          class="p-1 rounded-lg transition-colors cursor-pointer"
          :class="variantStyles.dismissColor"
          aria-label="Fechar aviso"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  </Transition>
</template>
