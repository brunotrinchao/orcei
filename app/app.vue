<script setup lang="ts">
import { SpeedInsights } from '@vercel/speed-insights/vue'
import { Loader2 } from 'lucide-vue-next'

const { isOpen, options } = useAlerts()
const { initTracking } = useCookieConsent()
const { isLoading, startLoading, stopLoading } = usePageLoader()
const router = useRouter()

const mounted = ref(false)

// Global navigation hooks
router.beforeEach(() => {
  startLoading()
})

router.afterEach(() => {
  stopLoading()
})

onMounted(() => {
  mounted.value = true
  initTracking()
})

async function handleConfirm() {
  const onConfirm = options.value.onConfirm
  isOpen.value = false
  if (onConfirm) {
    await nextTick()
    onConfirm()
  }
}

async function handleCancel() {
  const onCancel = options.value.onCancel
  isOpen.value = false
  if (onCancel) {
    await nextTick()
    onCancel()
  }
}
</script>

<template>
  <NuxtLayout>
    <Suspense>
      <NuxtPage />
    </Suspense>
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
    <div v-if="isLoading" class="fixed inset-0 z-[9999] bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
      <div class="flex flex-col items-center gap-6">
        <AppLogo size="xl" :loading="true" :icon-only="true" />
        <p class="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.4em] animate-pulse">Carregando...</p>
      </div>
    </div>
  </Transition>

  <CookieConsent v-if="mounted" />
  <SpeedInsights v-if="mounted" />

  <!-- Banner global: voltar para admin durante impersonação (todas as telas, inclusive onboarding) -->
  <ImpersonationBanner />

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

  <BaseToastContainer />
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
