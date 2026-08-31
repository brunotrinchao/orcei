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

// Estilos de Variantes (Tema Claro e Escuro baseados na referência visual do usuário)
const variantStyles = computed(() => {
  const v = props.variant?.toLowerCase() || 'info'

  const cardStyle = {
    bg: 'bg-white dark:bg-[#151d2a] border border-slate-200/90 dark:border-slate-800/90 shadow-xl shadow-slate-900/5 dark:shadow-black/50 rounded-[0.875rem]',
    titleColor: 'text-slate-900 dark:text-white font-semibold',
    textColor: 'text-slate-500 dark:text-slate-300 font-normal',
    closeHover: 'text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
  }

  switch (v) {
    case 'success':
    case 'emerald':
    case 'green':
      return {
        ...cardStyle,
        iconColor: 'text-emerald-500 dark:text-emerald-400',
        progressBg: 'bg-emerald-500 dark:bg-emerald-400'
      }

    case 'warning':
    case 'amber':
    case 'yellow':
      return {
        ...cardStyle,
        iconColor: 'text-amber-500 dark:text-amber-400',
        progressBg: 'bg-amber-500 dark:bg-amber-400'
      }

    case 'error':
    case 'danger':
    case 'red':
      return {
        ...cardStyle,
        iconColor: 'text-rose-500 dark:text-rose-400',
        progressBg: 'bg-rose-500 dark:bg-rose-400'
      }

    case 'neutral':
    case 'slate':
    case 'gray':
      return {
        ...cardStyle,
        iconColor: 'text-slate-500 dark:text-slate-400',
        progressBg: 'bg-slate-500 dark:bg-slate-400'
      }

    case 'violet':
    case 'purple':
      return {
        ...cardStyle,
        iconColor: 'text-violet-500 dark:text-violet-400',
        progressBg: 'bg-violet-500 dark:bg-violet-400'
      }

    case 'info':
    case 'blue':
    default:
      return {
        ...cardStyle,
        iconColor: 'text-blue-500 dark:text-blue-400',
        progressBg: 'bg-blue-500 dark:bg-blue-400'
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
      class="pointer-events-auto flex flex-col w-full max-w-md backdrop-blur-xl overflow-hidden transition-all duration-300 ease-out hover:scale-[1.015]"
      :class="[variantStyles.bg, positionClasses]"
      @mouseenter="pauseTimer"
      @mouseleave="resumeTimer"
      role="status"
    >
      <div class="p-4 flex items-start gap-3 relative">
        <!-- Ícone Contornado -->
        <div
          v-if="$slots.icon || resolvedIcon"
          class="shrink-0 mt-0.5"
          :class="variantStyles.iconColor"
        >
          <slot name="icon">
            <component :is="resolvedIcon" class="w-5 h-5" />
          </slot>
        </div>

        <!-- Conteúdo (Título + Descrição) -->
        <div class="flex-1 min-w-0 pr-6">
          <h4
            v-if="title || $slots.title"
            class="text-sm leading-snug tracking-tight truncate"
            :class="variantStyles.titleColor"
          >
            <slot name="title">{{ title }}</slot>
          </h4>

          <p
            v-if="description || $slots.default"
            class="text-xs leading-relaxed mt-0.5 whitespace-pre-line"
            :class="variantStyles.textColor"
          >
            <slot>{{ description }}</slot>
          </p>

          <div v-if="$slots.actions" class="mt-3 flex items-center gap-2">
            <slot name="actions" />
          </div>
        </div>

        <!-- Botão de Fechar -->
        <button
          type="button"
          @click="dismiss"
          class="absolute top-3.5 right-3.5 p-1 rounded-md transition-colors duration-200 cursor-pointer"
          :class="variantStyles.closeHover"
          aria-label="Fechar notificação"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Barra de Progresso do Tempo -->
      <div v-if="delay > 0" class="w-full h-1 bg-slate-100 dark:bg-slate-800/50 overflow-hidden">
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
    class="pointer-events-auto flex flex-col w-full max-w-md backdrop-blur-xl overflow-hidden transition-all duration-300 ease-out hover:scale-[1.015]"
    :class="[variantStyles.bg]"
    @mouseenter="pauseTimer"
    @mouseleave="resumeTimer"
    role="status"
  >
    <div class="p-4 flex items-start gap-3 relative">
      <!-- Ícone Contornado -->
      <div
        v-if="$slots.icon || resolvedIcon"
        class="shrink-0 mt-0.5"
        :class="variantStyles.iconColor"
      >
        <slot name="icon">
          <component :is="resolvedIcon" class="w-5 h-5" />
        </slot>
      </div>

      <!-- Conteúdo (Título + Descrição) -->
      <div class="flex-1 min-w-0 pr-6">
        <h4
          v-if="title || $slots.title"
          class="text-sm leading-snug tracking-tight truncate"
          :class="variantStyles.titleColor"
        >
          <slot name="title">{{ title }}</slot>
        </h4>

        <p
          v-if="description || $slots.default"
          class="text-xs leading-relaxed mt-0.5 whitespace-pre-line"
          :class="variantStyles.textColor"
        >
          <slot>{{ description }}</slot>
        </p>

        <div v-if="$slots.actions" class="mt-3 flex items-center gap-2">
          <slot name="actions" />
        </div>
      </div>

      <!-- Botão de Fechar -->
      <button
        type="button"
        @click="dismiss"
        class="absolute top-3.5 right-3.5 p-1 rounded-md transition-colors duration-200 cursor-pointer"
        :class="variantStyles.closeHover"
        aria-label="Fechar notificação"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Barra de Progresso do Tempo -->
    <div v-if="delay > 0" class="w-full h-1 bg-slate-100 dark:bg-slate-800/50 overflow-hidden">
      <div
        class="h-full transition-all duration-75 ease-linear"
        :class="variantStyles.progressBg"
        :style="{ width: `${progress}%` }"
      />
    </div>
  </div>
</template>
