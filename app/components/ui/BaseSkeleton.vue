<script setup lang="ts">
interface Props {
  width?: string
  height?: string
  borderRadius?: string
  customClass?: string
}

withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '1rem',
  borderRadius: '0.5rem',
  customClass: ''
})
</script>

<template>
  <div
    class="animate-pulse"
    :class="[
      !customClass.includes('bg-') ? 'bg-gray-200' : '',
      customClass
    ]"
    :style="{
      width,
      height,
      borderRadius
    }"
  ></div>
</template>
