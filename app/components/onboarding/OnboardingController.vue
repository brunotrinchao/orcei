<script setup lang="ts">
import type { ProfileDTO } from '../../../types'

const route = useRoute()
const { loggedIn } = useUserSession()
const { autoStartForRoute, markWelcomeSeen, startTour, hasTourForRoute } = useOnboarding()
const { data: profile } = useNuxtData<ProfileDTO>('profile')

const showWelcome = ref(false)

async function tryAutoStart() {
  if (!loggedIn.value || !profile.value) return

  if (!profile.value.onboardingWelcomeSeen) {
    showWelcome.value = true
    return
  }

  await nextTick()
  setTimeout(() => autoStartForRoute(route.path), 400)
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
  <OnboardingWelcomeModal :open="showWelcome" @confirm="handleAccept" @cancel="handleDecline" />
</template>
