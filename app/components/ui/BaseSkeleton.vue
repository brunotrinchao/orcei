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
    #e5e7eb 25%,
    #f3f4f6 50%,
    #e5e7eb 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}

:root.dark .skeleton-shimmer {
  background: linear-gradient(
    90deg,
    #1f2937 25%,
    #374151 50%,
    #1f2937 75%
  );
  background-size: 200% 100%;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
