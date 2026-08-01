<script setup lang="ts">
import type { ProfileDTO } from '../../../types'
import SetupWizardModal from './SetupWizardModal.vue'

const route = useRoute()
const { loggedIn } = useUserSession()
const { autoStartForRoute, markWelcomeSeen, startTour, hasTourForRoute, isSetupWizardOpen } = useOnboarding()
const { data: profile } = useNuxtData<ProfileDTO>('profile')

const showWizard = isSetupWizardOpen
const showWelcome = ref(false)

// Se o usuário pulou o wizard, ele só reaparece 24h depois do skip
// (setupWizardSkippedAt gravado em POST /api/profile/setup-wizard).
const SKIP_REOPEN_MS = 24 * 60 * 60 * 1000

function shouldShowSetupWizard(p: ProfileDTO): boolean {
  if (p.setupWizardCompleted) return false
  if (!p.setupWizardSkippedAt) return true
  const skippedAt = new Date(p.setupWizardSkippedAt).getTime()
  return Date.now() - skippedAt > SKIP_REOPEN_MS
}

async function tryAutoStart() {
  if (!loggedIn.value || !profile.value) return

  // Wizard de configuração inicial tem prioridade máxima
  if (shouldShowSetupWizard(profile.value)) {
    showWizard.value = true
    return
  }

  // Tour de boas-vindas só aparece após o wizard ser concluído
  if (!profile.value.onboardingWelcomeSeen) {
    showWelcome.value = true
    return
  }

  await nextTick()
  setTimeout(() => autoStartForRoute(route.path), 400)
}

async function handleWizardClose() {
  showWizard.value = false
  // Recarrega o perfil: se completou, setupWizardCompleted vira true; se pulou,
  // setupWizardSkippedAt já foi gravado (ver handleSkip) e shouldShowSetupWizard
  // só volta a abrir o wizard depois de 24h.
  await refreshNuxtData('profile')
}

async function handleAccept() {
  showWelcome.value = false
  await markWelcomeSeen(true)
  const tourId = hasTourForRoute(route.path)
  if (!tourId) return
  await nextTick()
  setTimeout(() => startTour(tourId, { force: true }), 400)
}

async function handleDecline() {
  showWelcome.value = false
  await markWelcomeSeen(false)
}

onMounted(tryAutoStart)
watch(() => route.path, tryAutoStart)
</script>

<template>
  <SetupWizardModal :open="showWizard" @close="handleWizardClose" />
  <OnboardingWelcomeModal :open="showWelcome" @confirm="handleAccept" @cancel="handleDecline" />
</template>
