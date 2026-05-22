<script setup lang="ts">
import { SpeedInsights } from '@vercel/speed-insights/vue'
import { Loader2 } from 'lucide-vue-next'

const { isOpen, options } = useAlerts()
const { initTracking } = useCookieConsent()
const { isLoading, startLoading, stopLoading } = usePageLoader()
const router = useRouter()

// Global navigation hooks to block UI
router.beforeEach(() => {
  startLoading()
})

router.afterEach(() => {
  // Pequeno delay para garantir que o DOM renderizou e evitar flickering em páginas rápidas
  setTimeout(() => {
    stopLoading()
  }, 300)
})

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

  <!-- Global Loading Blocker -->
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="isLoading" class="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
      <div class="scale-125">
        <AppLogo size="xl" :loading="true" />
      </div>
      <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mt-8 animate-pulse">Iniciando navegação</p>
    </div>
  </Transition>

  <CookieConsent />
  <SpeedInsights />

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
