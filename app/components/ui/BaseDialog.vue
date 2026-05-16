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
          class="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
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
          :class="[
            'fixed left-[50%] top-[50%] z-[101] flex flex-col w-full translate-x-[-50%] translate-y-[-50%] bg-white shadow-2xl rounded-[2.5rem] border-4 border-white max-h-[90vh] overflow-hidden outline-none',
            size === 'sm' ? 'max-w-sm' : '',
            size === 'md' ? 'max-w-lg' : '',
            size === 'lg' ? 'max-w-2xl' : '',
            size === 'xl' ? 'max-w-5xl' : '',
            size === 'full' ? 'max-w-[95vw] h-[95vh]' : '',
            !size ? 'max-w-lg' : ''
          ]"
        >
          <!-- Header fixo -->
          <div class="flex-shrink-0 flex items-start justify-between px-8 pt-8 pb-6 border-b border-gray-100">
            <div class="space-y-1">
              <DialogTitle v-if="title" class="text-xl font-black text-gray-900 uppercase tracking-widest">
                {{ title }}
              </DialogTitle>
              <!-- Always rendered: satisfies Radix aria requirement; visually hidden when no description -->
              <DialogDescription :class="description ? 'text-sm font-bold text-gray-400' : 'sr-only'">
                {{ description || title }}
              </DialogDescription>
            </div>
            <DialogClose
              class="ml-4 flex-shrink-0 rounded-xl p-2 text-gray-400 opacity-70 transition-all hover:bg-gray-50 hover:text-gray-900 hover:opacity-100 outline-none focus:ring-4 focus:ring-gray-100"
            >
              <X class="h-5 w-5" />
              <span class="sr-only">Fechar</span>
            </DialogClose>
          </div>

          <!-- Conteúdo rolável -->
          <div class="flex-1 overflow-y-auto px-8 py-6">
            <slot />
          </div>

          <!-- Footer fixo -->
          <div v-if="$slots.footer" class="flex-shrink-0 px-8 py-6 border-t border-gray-100 bg-white flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <slot name="footer" />
          </div>
        </DialogContent>
      </Transition>
    </DialogPortal>
  </DialogRoot>
</template>
