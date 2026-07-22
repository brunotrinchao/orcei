<script setup lang="ts">
interface Props {
  maxHeight?: string
  horizontal?: boolean
}

withDefaults(defineProps<Props>(), {
  maxHeight: undefined,
  horizontal: false
})
</script>

<template>
  <div 
    class="custom-scrollbar"
    :class="[
      horizontal ? 'overflow-x-auto' : 'overflow-y-auto'
    ]"
    :style="maxHeight ? { maxHeight } : {}"
  >
    <slot />
  </div>
</template>
