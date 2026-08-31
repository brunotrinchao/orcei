<script setup lang="ts">
import { computed } from 'vue'
import { DropdownMenuItem, type DropdownMenuItemProps } from 'radix-vue'

defineOptions({
  inheritAttrs: false
})

const props = defineProps<DropdownMenuItemProps & {
  href?: string
  target?: string
  external?: boolean
  variant?: 'default' | 'danger' | 'primary'
}>()

const isExternalLink = computed(() => {
  if (!props.href) return false
  return props.external || props.href.startsWith('http') || props.href.startsWith('mailto:') || props.href.startsWith('tel:')
})

const variantClasses = computed(() => {
  if (props.variant === 'danger') {
    return 'text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/30'
  }
  if (props.variant === 'primary') {
    return 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30'
  }
  return 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
})
</script>

<template>
  <DropdownMenuItem
    v-if="href"
    v-bind="$attrs"
    :as-child="true"
    :disabled="disabled"
    :text-value="textValue"
    :class="['flex items-center gap-3 px-4 py-2.5 rounded-[.5rem] text-sm font-medium cursor-pointer outline-none transition-all', variantClasses]"
  >
    <a
      v-if="isExternalLink"
      :href="href"
      :target="target || (href.startsWith('http') ? '_blank' : undefined)"
      :rel="target === '_blank' || href.startsWith('http') ? 'noopener noreferrer' : undefined"
      class="flex items-center gap-3 w-full h-full"
    >
      <slot />
    </a>
    <NuxtLink
      v-else
      :to="href"
      :target="target"
      class="flex items-center gap-3 w-full h-full"
    >
      <slot />
    </NuxtLink>
  </DropdownMenuItem>

  <DropdownMenuItem
    v-else
    v-bind="$attrs"
    :disabled="disabled"
    :text-value="textValue"
    :class="['flex items-center gap-3 px-4 py-2.5 rounded-[.5rem] text-sm font-medium cursor-pointer outline-none transition-all', variantClasses]"
  >
    <slot />
  </DropdownMenuItem>
</template>
