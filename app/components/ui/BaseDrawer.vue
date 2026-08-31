<script lang="ts">
import { ref, watch, onUnmounted } from 'vue'

const activeDrawersCount = ref(0)
</script>

<script setup lang="ts">
import { computed } from 'vue'
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  type DialogRootEmits,
  type DialogRootProps,
} from 'radix-vue'
import { X } from 'lucide-vue-next'
import { useVModel } from '@vueuse/core'

type PositionType = 'right' | 'left' | 'top' | 'bottom'
type SizeType = 'sm' | 'md' | 'lg' | 'xl' | 'full'
type VariantType = 'default' | 'primary' | 'slate' | 'danger' | string

interface DrawerExtraProps {
  title?: string
  description?: string
  position?: PositionType
  size?: SizeType
  variant?: VariantType
  compact?: boolean
  dismissible?: boolean
}

const props = withDefaults(defineProps<DialogRootProps & DrawerExtraProps>(), {
  position: 'right',
  size: 'md',
  variant: 'default',
  compact: false,
  dismissible: true,
  title: undefined,
  description: undefined,
})

const emits = defineEmits<DialogRootEmits>()

const open = useVModel(props, 'open', emits)

const currentZIndex = ref(0)

watch(open, (isOpen) => {
  if (isOpen) {
    activeDrawersCount.value++
    currentZIndex.value = activeDrawersCount.value
  } else {
    setTimeout(() => {
      activeDrawersCount.value = Math.max(0, activeDrawersCount.value - 1)
    }, 300)
  }
})

onUnmounted(() => {
  if (open.value) {
    activeDrawersCount.value = Math.max(0, activeDrawersCount.value - 1)
  }
})

// Position classes for fixed placement
const positionClasses = computed(() => {
  switch (props.position) {
    case 'left':
      return 'left-0 top-0 bottom-0 h-full'
    case 'top':
      return 'top-0 left-0 right-0 w-full'
    case 'bottom':
      return 'bottom-0 left-0 right-0 w-full'
    case 'right':
    default:
      return 'right-0 top-0 bottom-0 h-full'
  }
})

// Transition classes depending on position
const transitionClasses = computed(() => {
  switch (props.position) {
    case 'left':
      return {
        enterFrom: '-translate-x-full',
        enterTo: 'translate-x-0',
        leaveFrom: 'translate-x-0',
        leaveTo: '-translate-x-full',
      }
    case 'top':
      return {
        enterFrom: '-translate-y-full',
        enterTo: 'translate-y-0',
        leaveFrom: 'translate-y-0',
        leaveTo: '-translate-y-full',
      }
    case 'bottom':
      return {
        enterFrom: 'translate-y-full',
        enterTo: 'translate-y-0',
        leaveFrom: 'translate-y-0',
        leaveTo: 'translate-y-full',
      }
    case 'right':
    default:
      return {
        enterFrom: 'translate-x-full',
        enterTo: 'translate-x-0',
        leaveFrom: 'translate-x-0',
        leaveTo: 'translate-x-full',
      }
  }
})

// Size classes (Mobile = 100% width/height; Desktop md: = responsive max-width / max-height)
const sizeClasses = computed(() => {
  const isVertical = props.position === 'top' || props.position === 'bottom'

  if (isVertical) {
    switch (props.size) {
      case 'sm': return 'h-[300px] md:h-[320px] max-h-[100dvh]'
      case 'lg': return 'h-[75vh] md:h-[520px] max-h-[100dvh]'
      case 'xl': return 'h-[85vh] md:h-[680px] max-h-[100dvh]'
      case 'full': return 'h-[100dvh]'
      case 'md':
      default: return 'h-[60vh] md:h-[420px] max-h-[100dvh]'
    }
  }

  // Left or Right position
  switch (props.size) {
    case 'sm': return 'w-full md:max-w-sm'
    case 'lg': return 'w-full md:max-w-lg'
    case 'xl': return 'w-full md:max-w-xl'
    case 'full': return 'w-full md:max-w-full'
    case 'md':
    default: return 'w-full md:max-w-md'
  }
})

// Header Variant styling
const headerVariantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-blue-600 text-white border-b border-blue-700'
    case 'slate':
      return 'bg-slate-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-b border-slate-200 dark:border-gray-700'
    case 'danger':
      return 'bg-red-600 text-white border-b border-red-700'
    case 'default':
    default:
      return 'bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 border-b border-slate-200/80 dark:border-gray-800'
  }
})

const closeBtnVariantClasses = computed(() => {
  if (props.variant === 'primary' || props.variant === 'danger') {
    return 'text-white/80 hover:text-white hover:bg-white/10'
  }
  return 'text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-slate-100 dark:hover:bg-gray-800'
})

const titleVariantClasses = computed(() => {
  if (props.variant === 'primary' || props.variant === 'danger') {
    return 'text-white'
  }
  return 'text-gray-900 dark:text-gray-50'
})

const descriptionVariantClasses = computed(() => {
  if (props.variant === 'primary' || props.variant === 'danger') {
    return 'text-white/80'
  }
  return 'text-slate-500 dark:text-gray-400'
})
</script>

<template>
  <DialogRoot v-model:open="open">
    <slot name="trigger" />

    <DialogPortal>
      <!-- Backdrop Overlay com Animação -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <DialogOverlay
          :style="{ zIndex: 100 + (currentZIndex * 2) }"
          class="fixed inset-0 bg-black/40 backdrop-blur-sm"
        />
      </Transition>

      <!-- Drawer Content Painel com Animação de Deslocamento -->
      <Transition
        enter-active-class="transition duration-300 ease-out transform"
        :enter-from-class="transitionClasses.enterFrom"
        :enter-to-class="transitionClasses.enterTo"
        leave-active-class="transition duration-200 ease-in transform"
        :leave-from-class="transitionClasses.leaveFrom"
        :leave-to-class="transitionClasses.leaveTo"
      >
        <DialogContent
          :style="{ zIndex: 101 + (currentZIndex * 2) }"
          :class="[
            'fixed flex flex-col bg-white dark:bg-gray-950 shadow-2xl outline-none overflow-hidden max-w-full',
            positionClasses,
            sizeClasses
          ]"
        >
          <!-- Header Fixo (Customizado ou Padrão) -->
          <div class="flex-shrink-0">
            <slot name="header">
              <div
                class="flex items-center justify-between gap-3 p-4 sm:px-6 sm:py-5"
                :class="headerVariantClasses"
              >
                <!-- Esquerda: Botão de Fechar -->
                <div class="w-9 h-9 flex items-center justify-start shrink-0">
                  <DialogClose v-if="dismissible" @click="open = false" as-child>
                    <button
                      type="button"
                      class="w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                      :class="closeBtnVariantClasses"
                      aria-label="Fechar drawer"
                    >
                      <X class="w-5 h-5" />
                    </button>
                  </DialogClose>
                </div>

                <!-- Centro: Título e Subtítulo -->
                <div class="text-center flex-1 min-w-0 px-2">
                  <h3 v-if="title" class="font-semibold text-inherit truncate" :class="compact ? 'text-base' : 'text-xl'">
                    <slot name="title">{{ title }}</slot>
                  </h3>

                  <!-- DialogDescription obrigatório para acessibilidade Radix -->
                  <DialogDescription
                    :class="[
                      (description || $slots.description) ? 'text-xs font-base leading-snug mt-0.5 truncate' : 'sr-only',
                      descriptionVariantClasses
                    ]"
                  >
                    <slot name="description">{{ description || title }}</slot>
                  </DialogDescription>
                </div>

                <!-- Direita: Menu de Contexto ou Spacer para Manter o Centro Perfeitamente Alinhado -->
                <div class="w-9 h-9 flex items-center justify-end shrink-0">
                  <slot name="context-menu" />
                </div>
              </div>
            </slot>
          </div>

          <!-- Conteúdo Principal Rolável -->
          <div class="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-4">
            <slot />
          </div>

          <!-- Footer Fixo -->
          <div
            v-if="$slots.footer"
            class="flex-shrink-0 sticky bottom-0 z-10 p-4 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-gray-800 backdrop-blur-sm flex flex-col-reverse sm:flex-row sm:justify-end gap-3"
          >
            <slot name="footer" />
          </div>
        </DialogContent>
      </Transition>
    </DialogPortal>
  </DialogRoot>
</template>
