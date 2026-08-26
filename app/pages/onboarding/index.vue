<script setup lang="ts">
import { useOnboardingPage } from '~/composables/pages/useOnboardingPage'

definePageMeta({
  layout: false
})

const { handleWizardFinish } = useOnboardingPage()
</script>

<template>
  <div class="onboarding-page-container bg-slate-50 dark:bg-gray-950">
    <SetupWizardModal :open="true" @close="handleWizardFinish" />
  </div>
</template>

<style scoped src="./index.css"></style>
