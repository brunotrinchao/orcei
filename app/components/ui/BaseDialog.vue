<script lang="ts">
import { ref, watch, onUnmounted } from 'vue'

const activeDialogsCount = ref(0)
</script>

<script setup lang="ts">
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

const props = defineProps<DialogRootProps & {
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}>()

const emits = defineEmits<DialogRootEmits>()

const open = useVModel(props, 'open', emits)

const currentZIndex = ref(0)

watch(open, (isOpen) => {
  if (isOpen) {
    activeDialogsCount.value++
    currentZIndex.value = activeDialogsCount.value
  } else {
    setTimeout(() => {
      activeDialogsCount.value = Math.max(0, activeDialogsCount.value - 1)
    }, 300) // wait for exit animation
  }
})

onUnmounted(() => {
  if (open.value) {
    activeDialogsCount.value = Math.max(0, activeDialogsCount.value - 1)
  }
})
</script>

<template>
  <DialogRoot v-model:open="open">
    <slot name="trigger" />
    
    <DialogPortal>
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <DialogOverlay
          :style="{ zIndex: 100 + (currentZIndex * 2) }"
          class="fixed inset-0 bg-black/40 backdrop-blur-sm"
        />
      </Transition>

      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 scale-95 translate-y-4"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-95 translate-y-4"
      >
        <DialogContent
          :style="{ zIndex: 101 + (currentZIndex * 2) }"
          :class="[
            'fixed left-[50%] top-[50%] flex flex-col w-[100vw] sm:w-full h-[100dvh] sm:h-auto translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-gray-900 shadow-2xl rounded-none sm:rounded-[2.5rem] sm:border-4 border-white dark:border-gray-800 max-h-[100dvh] sm:max-h-[90vh] overflow-hidden outline-none',
            size === 'sm' ? 'sm:max-w-sm' : '',
            size === 'md' ? 'sm:max-w-lg' : '',
            size === 'lg' ? 'sm:max-w-2xl' : '',
            size === 'xl' ? 'sm:max-w-5xl' : '',
            size === 'full' ? 'sm:max-w-[95vw] sm:h-[95vh]' : '',
            !size ? 'sm:max-w-lg' : ''
          ]"
        >
          <!-- Header fixo -->
          <div class="flex-shrink-0 flex items-start justify-between px-8 pt-8 pb-6 border-b border-gray-100 dark:border-gray-800">
            <div class="space-y-1">
              <DialogTitle v-if="title" class="text-xl font-black text-gray-900 dark:text-gray-50 uppercase tracking-widest">
                {{ title }}
              </DialogTitle>
              <!-- Always rendered: satisfies Radix aria requirement; visually hidden when no description -->
              <DialogDescription :class="description ? 'text-sm font-bold text-gray-400 dark:text-gray-400' : 'sr-only'">
                {{ description || title }}
              </DialogDescription>
            </div>
            <DialogClose as-child>
              <BaseButton
                variant="ghost"
                size="icon-sm"
                class="ml-4 shrink-0"
                aria-label="Fechar"
              >
                <X class="h-5 w-5" />
              </BaseButton>
            </DialogClose>
          </div>

          <!-- Conteúdo rolável -->
          <div class="flex-1 overflow-y-auto custom-scrollbar md:px-8 px-2 md:py-6 py-2">
            <slot />
          </div>

          <!-- Footer fixo -->
          <div v-if="$slots.footer" class="flex-shrink-0 px-8 py-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <slot name="footer" />
          </div>
        </DialogContent>
      </Transition>
    </DialogPortal>
  </DialogRoot>
</template>
