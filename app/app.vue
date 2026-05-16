<script setup lang="ts">
const { isOpen, options } = useAlerts()
const { initTracking } = useCookieConsent()

onMounted(() => initTracking())

function handleConfirm() {
  if (options.value.onConfirm) options.value.onConfirm()
  isOpen.value = false
}

function handleCancel() {
  if (options.value.onCancel) options.value.onCancel()
  isOpen.value = false
}
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <CookieConsent />

  <BaseAlertDialog
    v-model:open="isOpen"
    :title="options.title"
    :description="options.description"
    :action-text="options.actionText"
    :cancel-text="options.cancelText"
    :variant="options.variant"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  />
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.2s ease-out;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* Reset global sutil */
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
