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
    class="skeleton-shimmer shrink-0"
    :class="customClass"
    :style="{
      width: width !== 'auto' ? width : undefined,
      height: height !== 'auto' ? height : undefined,
      borderRadius
    }"
  ></div>
</template>

<style scoped>
.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    #e2e8f0 25%,
    #f1f5f9 50%,
    #e2e8f0 75%
  ) !important;
  background-size: 200% 100% !important;
  animation: shimmer 1.5s infinite linear;
}

:global(html.dark) .skeleton-shimmer,
:global(.dark) .skeleton-shimmer {
  background: linear-gradient(
    90deg,
    #1e293b 25%,
    #334155 50%,
    #1e293b 75%
  ) !important;
  background-size: 200% 100% !important;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
