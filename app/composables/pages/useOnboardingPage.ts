import type { ProfileDTO } from '../../../types'

export function useOnboardingPage() {
  const { data: profile } = useNuxtData<ProfileDTO>('profile')

  async function handleWizardFinish() {
    await refreshNuxtData('profile')
    await navigateTo('/dashboard')
  }

  return {
    profile,
    handleWizardFinish
  }
}
