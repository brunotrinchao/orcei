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
          v-if="open"
          :class="[
            'fixed left-[50%] top-[50%] z-[101] flex flex-col w-full translate-x-[-50%] translate-y-[-50%] bg-white p-8 shadow-2xl rounded-[2.5rem] border-4 border-white max-h-[90vh] overflow-y-auto outline-none',
            size === 'sm' ? 'max-w-sm' : '',
            size === 'md' ? 'max-w-lg' : '',
            size === 'lg' ? 'max-w-2xl' : '',
            size === 'xl' ? 'max-w-5xl' : '',
            size === 'full' ? 'max-w-[95vw] h-[95vh]' : '',
            !size ? 'max-w-lg' : ''
          ]"
        >
          <div class="flex flex-col space-y-2 text-center sm:text-left mb-6">
            <DialogTitle v-if="title" class="text-xl font-black text-gray-900 uppercase tracking-widest">
              {{ title }}
            </DialogTitle>
            <DialogDescription v-if="description" class="text-sm font-bold text-gray-400">
              {{ description }}
            </DialogDescription>
          </div>

          <div class="flex-1">
            <slot />
          </div>

          <DialogClose
            class="absolute right-6 top-6 rounded-xl p-2 text-gray-400 opacity-70 transition-all hover:bg-gray-50 hover:text-gray-900 hover:opacity-100 outline-none focus:ring-4 focus:ring-gray-100"
          >
            <X class="h-5 w-5" />
            <span class="sr-only">Fechar</span>
          </DialogClose>

          <div v-if="$slots.footer" class="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-4">
            <slot name="footer" />
          </div>
        </DialogContent>
      </Transition>
    </DialogPortal>
  </DialogRoot>
</template>
