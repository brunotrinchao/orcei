<script setup lang="ts">
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
} from 'radix-vue'
import { MoreVertical } from 'lucide-vue-next'

import { useVModel } from '@vueuse/core'

export interface MenuItemType {
  label?: string
  icon?: any
  href?: string
  target?: string
  external?: boolean
  variant?: 'default' | 'danger' | 'primary'
  disabled?: boolean
  click?: (e: Event) => void
}

const props = withDefaults(defineProps<{
  open?: boolean
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
  items?: MenuItemType[]
}>(), {
  align: 'end',
  side: 'bottom',
  sideOffset: 6,
  items: () => []
})

const emit = defineEmits(['update:open'])
const isOpen = useVModel(props, 'open', emit, { passive: true })
</script>

<template>
  <DropdownMenuRoot v-model:open="isOpen">
    <DropdownMenuTrigger as-child>
      <slot name="trigger">
        <button
          type="button"
          class="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-[.5rem] transition-all cursor-pointer outline-none"
          title="Mais opções"
          aria-label="Mais opções"
        >
          <MoreVertical class="w-5 h-5" />
        </button>
      </slot>
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent
        :align="align"
        :side="side"
        :side-offset="sideOffset"
        class="min-w-[180px] bg-white dark:bg-gray-950 rounded-[0.75rem] shadow-xl border border-gray-100 dark:border-gray-800 p-2 z-[150] outline-none"
      >
        <slot>
          <BaseDropdownMenuItem
            v-for="(item, index) in items"
            :key="index"
            :href="item.href"
            :target="item.target"
            :external="item.external"
            :disabled="item.disabled"
            :variant="item.variant"
            @click="item.click ? item.click($event) : undefined"
          >
            <component :is="item.icon" v-if="item.icon" class="w-4 h-4" />
            <span>{{ item.label }}</span>
          </BaseDropdownMenuItem>
        </slot>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
