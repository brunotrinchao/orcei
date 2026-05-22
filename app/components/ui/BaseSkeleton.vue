<script setup lang="ts">
interface Props {
  width?: string
  height?: string
  borderRadius?: string
  customClass?: string
}

withDefaults(defineProps<Props>(), {
  width: 'auto',
  height: 'auto',
  borderRadius: '0.5rem',
  customClass: ''
})
</script>

<template>
  <div
    class="animate-pulse shrink-0"
    :class="[
      !customClass.includes('bg-') ? 'bg-gray-200' : '',
      customClass
    ]"
    :style="{
      width: width !== 'auto' ? width : undefined,
      height: height !== 'auto' ? height : undefined,
      borderRadius
    }"
  ></div>
</template>
