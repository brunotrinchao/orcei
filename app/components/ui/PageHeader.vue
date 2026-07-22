<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="space-y-6 mb-10">
    <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-4xl font-black text-gray-900 dark:text-white tracking-tight uppercase">{{ title }}</h1>
        <p v-if="subtitle" class="text-gray-500 dark:text-gray-400 mt-2 font-medium">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.default" class="w-full sm:w-auto">
        <slot />
      </div>
    </header>
    <div v-if="$slots.filters" class="w-full">
      <slot name="filters" />
    </div>
  </div>
</template>
