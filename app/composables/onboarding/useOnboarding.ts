import type { ProfileDTO } from '../../../types'
import type { TourId } from './types'
import { ROUTE_TOUR_MAP } from './types'
import { loadTourSteps } from './registry'

export function useOnboarding() {
  const isTourActive = useState('onboarding-active', () => false)
  // Estado compartilhado do Setup Wizard: permite abri-lo tanto pelo fluxo
  // automático (OnboardingController) quanto manualmente (ex: botão "Refazer
  // configuração inicial" em Configurações), sem duplicar o componente.
  const isSetupWizardOpen = useState('setup-wizard-open', () => false)

  function openSetupWizard() {
    isSetupWizardOpen.value = true
  }

  async function completeTour(tourId: TourId) {
    const { data: profile } = useNuxtData<ProfileDTO>('profile')
    if (profile.value?.onboardingCompletedTours?.includes(tourId)) return
    try {
      await $fetch('/api/profile/onboarding', { method: 'POST', body: { tourId } })
      await refreshNuxtData('profile')
    } catch {}
  }

  async function startTour(tourId: TourId, opts: { force?: boolean } = {}) {
    if (import.meta.server || isTourActive.value) return

    const { data: profile } = useNuxtData<ProfileDTO>('profile')
    if (profile.value?.onboardingCompletedTours?.includes(tourId) && !opts.force) return

    const steps = await loadTourSteps(tourId)
    const validSteps = steps.filter(s => document.querySelector(s.element))
    if (!validSteps.length) return

    const { driver } = await import('driver.js')
    isTourActive.value = true

    driver({
      showProgress: true,
      nextBtnText: 'Próximo',
      prevBtnText: 'Voltar',
      doneBtnText: 'Concluir',
      steps: validSteps,
      onDestroyed: () => {
        isTourActive.value = false
        completeTour(tourId)
      }
    }).drive()
  }

  function autoStartForRoute(path: string) {
    const tourId = ROUTE_TOUR_MAP[path]
    if (tourId) startTour(tourId)
  }

  function hasTourForRoute(path: string): TourId | undefined {
    return ROUTE_TOUR_MAP[path]
  }

  async function markWelcomeSeen(accepted: boolean) {
    try {
      await $fetch('/api/profile/onboarding-welcome', { method: 'POST', body: { accepted } })
      await refreshNuxtData('profile')
    } catch {}
  }

  return { startTour, completeTour, autoStartForRoute, hasTourForRoute, markWelcomeSeen, isTourActive, isSetupWizardOpen, openSetupWizard }
}
