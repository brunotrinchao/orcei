<script setup lang="ts">
import {
  AlertDialogRoot,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from 'radix-vue'

interface Props {
  open?: boolean
  title: string
  description?: string
  cancelText?: string
  actionText?: string
  variant?: 'primary' | 'destructive'
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  cancelText: undefined,
  actionText: 'Confirmar',
  variant: 'primary'
})

const emit = defineEmits(['update:open', 'confirm', 'cancel'])
</script>

<template>
  <AlertDialogRoot :open="open" @update:open="emit('update:open', $event)">
    <AlertDialogPortal>
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <AlertDialogOverlay class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[300]" />
      </Transition>

      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 scale-95 translate-y-4"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-95 translate-y-4"
      >
        <AlertDialogContent 
          class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-2xl z-[301] focus:outline-none border border-gray-100 dark:border-gray-800"
        >
          <AlertDialogTitle class="text-xl font-black text-gray-900 dark:text-gray-50 uppercase tracking-tight mb-2">
            {{ title }}
          </AlertDialogTitle>
          
          <AlertDialogDescription v-if="description" class="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-8" v-html="description" />

          <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <AlertDialogCancel v-if="cancelText" as-child>
              <BaseButton 
                type="button"
                variant="ghost"
                size="sm"
                @click="emit('cancel')"
              >
                {{ cancelText }}
              </BaseButton>
            </AlertDialogCancel>
            
            <AlertDialogAction as-child>
              <BaseButton 
                type="button"
                :variant="variant === 'destructive' ? 'danger' : 'solid'"
                size="sm"
                @click="emit('confirm')"
              >
                {{ actionText }}
              </BaseButton>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </Transition>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
