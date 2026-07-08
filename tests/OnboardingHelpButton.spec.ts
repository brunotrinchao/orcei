import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import OnboardingHelpButton from '../app/components/onboarding/OnboardingHelpButton.vue'

const mockStartTour = vi.fn()
const mockHasTourForRoute = vi.fn()

vi.mock('../app/composables/onboarding/useOnboarding', () => ({
  useOnboarding: () => ({
    startTour: mockStartTour,
    hasTourForRoute: mockHasTourForRoute,
    isTourActive: { value: false },
    completeTour: vi.fn(),
    autoStartForRoute: vi.fn()
  })
}))

describe('OnboardingHelpButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render on route without tour', async () => {
    mockHasTourForRoute.mockReturnValue(undefined)

    const wrapper = await mountSuspended(OnboardingHelpButton)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('should render on route with tour and call startTour with force', async () => {
    mockHasTourForRoute.mockReturnValue('dashboard')

    const wrapper = await mountSuspended(OnboardingHelpButton)
    const btn = wrapper.find('button')
    expect(btn.exists()).toBe(true)

    await btn.trigger('click')
    expect(mockStartTour).toHaveBeenCalledWith('dashboard', { force: true })
  })
})
