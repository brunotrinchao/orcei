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
    class="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center hover:ring-4 ring-gray-100 transition-all border-2 border-white shadow-sm text-gray-500 hover:text-blue-600"
    title="Ajuda - Tour guiado"
    aria-label="Iniciar tour guiado da página"
  >
    <HelpCircle class="w-5 h-5" />
  </button>
</template>
