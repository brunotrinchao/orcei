<script setup lang="ts">
import { HelpCircle } from 'lucide-vue-next'

const route = useRoute()
const { hasTourForRoute, startTour } = useOnboarding()

const tourId = computed(() => hasTourForRoute(route.path))

function handleClick() {
  if (tourId.value) {
    startTour(tourId.value, { force: true })
  }
}
</script>

<template>
  <button
    v-if="tourId"
    @click="handleClick"
    class="w-10 h-10 rounded-[0.75rem] flex items-center justify-center text-gray-500 dark:text-gray-400  hover:ring-4 ring-gray-100 dark:ring-gray-800/50 transition-all"
    title="Ajuda - Tour guiado"
    aria-label="Iniciar tour guiado da página"
  >
    <HelpCircle class="w-4.5 h-4.5" />
  </button>
</template>
