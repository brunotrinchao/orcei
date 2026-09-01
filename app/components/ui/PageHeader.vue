<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="page-title">{{ title }}</h1>
        <p v-if="subtitle" class="helper-text mt-2">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.default" class="w-full sm:w-auto">
        <slot />
      </div>
    </header>
    <div v-if="$slots.filters" class="w-auto md:w-full">
      <slot name="filters" />
    </div>
  </div>
</template>
