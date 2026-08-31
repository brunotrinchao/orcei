<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { Component } from 'vue'
import { Info, CheckCircle2, AlertTriangle, AlertCircle, HelpCircle, Sparkles, X } from 'lucide-vue-next'

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'violet' | string
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'

interface Props {
  title?: string
  description?: string
  delay?: number
  variant?: ToastVariant
  icon?: Component | string | boolean
  position?: ToastPosition
  standalone?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  description: undefined,
  delay: 4000,
  variant: 'info',
  icon: true,
  position: 'top-right',
  standalone: false
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'dismiss'): void
}>()

const isVisible = ref(true)
const isPaused = ref(false)
const progress = ref(100)

let timer: ReturnType<typeof setTimeout> | null = null
let interval: ReturnType<typeof setInterval> | null = null
const startTime = ref(Date.now())
const remainingTime = ref(props.delay)

// Resolução de Ícone
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

// Estilos de Variantes (Background, Borda, Ícone, Barra de Progresso) - TÍTULO E DESCRIÇÃO BRANCOS
const variantStyles = computed(() => {
  const v = props.variant?.toLowerCase() || 'info'

  switch (v) {
    case 'success':
    case 'emerald':
    case 'green':
      return {
        bg: 'bg-green-950/90 dark:bg-green-950/95 text-white border-green-800/60 shadow-green-950/20',
        iconBg: 'bg-green-500/20 text-green-400',
        titleColor: 'text-white font-semibold',
        textColor: 'text-white/90',
        progressBg: 'bg-green-400',
        closeHover: 'hover:bg-green-800/50 text-white'
      }

    case 'warning':
    case 'amber':
    case 'yellow':
      return {
        bg: 'bg-amber-950/90 dark:bg-amber-950/95 text-white border-amber-800/60 shadow-amber-950/20',
        iconBg: 'bg-amber-500/20 text-amber-400',
        titleColor: 'text-white font-semibold',
        textColor: 'text-white/90',
        progressBg: 'bg-amber-400',
        closeHover: 'hover:bg-amber-800/50 text-white'
      }

    case 'error':
    case 'danger':
    case 'red':
      return {
        bg: 'bg-red-950/90 dark:bg-red-950/95 text-white border-red-800/60 shadow-red-950/20',
        iconBg: 'bg-red-500/20 text-red-400',
        titleColor: 'text-white font-semibold',
        textColor: 'text-white/90',
        progressBg: 'bg-red-400',
        closeHover: 'hover:bg-red-800/50 text-white'
      }

    case 'neutral':
    case 'slate':
    case 'gray':
      return {
        bg: 'bg-slate-900/90 dark:bg-gray-900/95 text-white border-slate-700/60 shadow-slate-950/20',
        iconBg: 'bg-slate-700/50 text-slate-300',
        titleColor: 'text-white font-semibold',
        textColor: 'text-white/90',
        progressBg: 'bg-slate-400',
        closeHover: 'hover:bg-slate-800 text-white'
      }

    case 'violet':
    case 'purple':
      return {
        bg: 'bg-violet-950/90 dark:bg-violet-950/95 text-white border-violet-800/60 shadow-violet-950/20',
        iconBg: 'bg-violet-500/20 text-violet-400',
        titleColor: 'text-white font-semibold',
        textColor: 'text-white/90',
        progressBg: 'bg-violet-400',
        closeHover: 'hover:bg-violet-800/50 text-white'
      }

    case 'info':
    case 'blue':
    default:
      return {
        bg: 'bg-blue-950/90 dark:bg-blue-950/95 text-white border-blue-800/60 shadow-blue-950/20',
        iconBg: 'bg-blue-500/20 text-blue-400',
        titleColor: 'text-white font-semibold',
        textColor: 'text-white/90',
        progressBg: 'bg-blue-400',
        closeHover: 'hover:bg-blue-800/50 text-white'
      }
  }
})

// Posição no Container (quando em uso standalone)
const positionClasses = computed(() => {
  if (!props.standalone) return ''
  switch (props.position) {
    case 'top-left':
      return 'fixed top-5 left-5 z-[99999]'
    case 'top-center':
      return 'fixed top-5 left-1/2 -translate-x-1/2 z-[99999]'
    case 'bottom-right':
      return 'fixed bottom-5 right-5 z-[99999]'
    case 'bottom-left':
      return 'fixed bottom-5 left-5 z-[99999]'
    case 'bottom-center':
      return 'fixed bottom-5 left-1/2 -translate-x-1/2 z-[99999]'
    case 'top-right':
    default:
      return 'fixed top-5 right-5 z-[99999]'
  }
})

function dismiss() {
  if (props.standalone) {
    isVisible.value = false
  }
  emit('close')
  emit('dismiss')
}

function startTimer() {
  if (props.delay <= 0) return
  startTime.value = Date.now()

  timer = setTimeout(() => {
    dismiss()
  }, remainingTime.value)

  const updateInterval = 50
  interval = setInterval(() => {
    if (!isPaused.value) {
      const elapsed = Date.now() - startTime.value
      remainingTime.value = Math.max(0, remainingTime.value - updateInterval)
      startTime.value = Date.now()
      progress.value = (remainingTime.value / props.delay) * 100
      if (remainingTime.value <= 0) {
        if (interval) clearInterval(interval)
      }
    }
  }, updateInterval)
}

function pauseTimer() {
  isPaused.value = true
  if (timer) clearTimeout(timer)
}

function resumeTimer() {
  isPaused.value = false
  if (remainingTime.value > 0 && props.delay > 0) {
    startTime.value = Date.now()
    timer = setTimeout(() => {
      dismiss()
    }, remainingTime.value)
  }
}

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
  if (interval) clearInterval(interval)
})
</script>

<template>
  <Transition
    v-if="standalone"
    enter-active-class="transition-all duration-500 ease-out transform"
    enter-from-class="opacity-0 -translate-y-8"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-500 ease-in transform"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-8"
  >
    <div
      v-if="isVisible"
      class="pointer-events-auto flex flex-col w-full max-w-md rounded-[0.75rem] border shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300 ease-out hover:scale-[1.015]"
      :class="[variantStyles.bg, positionClasses]"
      @mouseenter="pauseTimer"
      @mouseleave="resumeTimer"
      role="status"
    >
      <div class="p-4 flex items-start gap-3.5 relative">
        <div
          v-if="$slots.icon || resolvedIcon"
          class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          :class="variantStyles.iconBg"
        >
          <slot name="icon">
            <component :is="resolvedIcon" class="w-5 h-5" />
          </slot>
        </div>

        <div class="flex-1 min-w-0 pr-6">
          <h4
            v-if="title || $slots.title"
            class="text-sm font-semibold tracking-tight truncate leading-snug text-white"
            :class="variantStyles.titleColor"
          >
            <slot name="title">{{ title }}</slot>
          </h4>

          <p
            v-if="description || $slots.default"
            class="text-xs font-normal mt-1 leading-relaxed whitespace-pre-line text-white/90"
            :class="variantStyles.textColor"
          >
            <slot>{{ description }}</slot>
          </p>

          <div v-if="$slots.actions" class="mt-3 flex items-center gap-2">
            <slot name="actions" />
          </div>
        </div>

        <button
          type="button"
          @click="dismiss"
          class="absolute top-3.5 right-3.5 p-1 rounded-md transition-colors duration-200 cursor-pointer text-white/80 hover:text-white"
          :class="variantStyles.closeHover"
          aria-label="Fechar notificação"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div v-if="delay > 0" class="w-full h-1 bg-black/20 overflow-hidden">
        <div
          class="h-full transition-all duration-75 ease-linear"
          :class="variantStyles.progressBg"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </div>
  </Transition>

  <div
    v-else
    class="pointer-events-auto flex flex-col w-full max-w-md rounded-[0.75rem] border shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300 ease-out hover:scale-[1.015]"
    :class="[variantStyles.bg]"
    @mouseenter="pauseTimer"
    @mouseleave="resumeTimer"
    role="status"
  >
    <div class="p-4 flex items-start gap-3.5 relative">
      <div
        v-if="$slots.icon || resolvedIcon"
        class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        :class="variantStyles.iconBg"
      >
        <slot name="icon">
          <component :is="resolvedIcon" class="w-5 h-5" />
        </slot>
      </div>

      <div class="flex-1 min-w-0 pr-6">
        <h4
          v-if="title || $slots.title"
          class="text-sm font-semibold tracking-tight truncate leading-snug text-white"
          :class="variantStyles.titleColor"
        >
          <slot name="title">{{ title }}</slot>
        </h4>

        <p
          v-if="description || $slots.default"
          class="text-xs font-normal mt-1 leading-relaxed whitespace-pre-line text-white/90"
          :class="variantStyles.textColor"
        >
          <slot>{{ description }}</slot>
        </p>

        <div v-if="$slots.actions" class="mt-3 flex items-center gap-2">
          <slot name="actions" />
        </div>
      </div>

      <button
        type="button"
        @click="dismiss"
        class="absolute top-3.5 right-3.5 p-1 rounded-md transition-colors duration-200 cursor-pointer text-white/80 hover:text-white"
        :class="variantStyles.closeHover"
        aria-label="Fechar notificação"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <div v-if="delay > 0" class="w-full h-1 bg-black/20 overflow-hidden">
      <div
        class="h-full transition-all duration-75 ease-linear"
        :class="variantStyles.progressBg"
        :style="{ width: `${progress}%` }"
      />
    </div>
  </div>
</template>
