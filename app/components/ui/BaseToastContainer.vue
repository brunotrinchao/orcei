<script setup lang="ts">
import { computed } from 'vue'
import { useToast, type ToastItem } from '~/composables/useToast'
import BaseToast from './BaseToast.vue'

const { toasts, dismiss } = useToast()

const positionGroups = computed(() => {
  const groups: Record<string, ToastItem[]> = {
    'top-right': [],
    'top-left': [],
    'bottom-right': [],
    'bottom-left': [],
    'top-center': [],
    'bottom-center': []
  }

  for (const item of toasts.value) {
    const pos = item.position || 'top-right'
    if (!groups[pos]) groups[pos] = []
    groups[pos].push(item)
  }

  return groups
})

function getContainerClasses(position: string) {
  switch (position) {
    case 'top-left':
      return 'top-5 left-5 items-start'
    case 'top-center':
      return 'top-5 left-1/2 -translate-x-1/2 items-center'
    case 'bottom-right':
      return 'bottom-2 right-2 items-end'
    case 'bottom-left':
      return 'bottom-5 left-5 items-start'
    case 'bottom-center':
      return 'bottom-5 left-1/2 -translate-x-1/2 items-center'
    case 'top-right':
    default:
      return 'top-1 right-1 items-end'
  }
}
</script>

<template>
  <div class="pointer-events-none fixed inset-0 z-[99999]">
    <template v-for="(items, pos) in positionGroups" :key="pos">
      <div
        v-if="items.length > 0"
        class="fixed flex flex-col gap-3 max-w-md w-full p-4 pointer-events-auto"
        :class="getContainerClasses(pos)"
      >
        <TransitionGroup
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-2 scale-[0.97]"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 translate-y-1 scale-[0.98]"
          move-class="transition-all duration-200 ease-out"
        >
          <BaseToast
            v-for="item in items"
            :key="item.id"
            :title="item.title"
            :description="item.description"
            :delay="item.delay"
            :variant="item.variant"
            :icon="item.icon"
            :position="item.position"
            class="!static !top-auto !bottom-auto !left-auto !right-auto !translate-x-0 !translate-y-0"
            @dismiss="dismiss(item.id)"
          />
        </TransitionGroup>
      </div>
    </template>
  </div>
</template>
