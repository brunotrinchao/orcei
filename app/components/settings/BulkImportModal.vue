<script setup lang="ts">
defineProps<{ open: boolean; type: 'client' | 'catalog' }>()
defineEmits<{ (e: 'update:open', v: boolean): void }>()
</script>

<template>
  <div />
</template>
