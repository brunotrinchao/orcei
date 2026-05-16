<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
    <div>
      <h1 class="text-4xl font-black text-gray-900 tracking-tight uppercase">{{ title }}</h1>
      <p v-if="subtitle" class="text-gray-500 mt-2 font-medium">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.default" class="w-full sm:w-auto">
      <slot />
    </div>
  </header>
</template>
