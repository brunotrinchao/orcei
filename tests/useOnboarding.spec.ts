// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock nuxt core to avoid [nuxt] instance unavailable
vi.mock('nuxt/app', () => ({}))
vi.mock('#app', () => ({}))

const stateRef = { value: false }

// Must mock nuxt composables before importing useOnboarding
vi.mock('#imports', () => ({
  useState: (_key: string, init: () => any) => {
    stateRef.value = init()
    return stateRef
  },
  useNuxtData: vi.fn(() => ({
    data: { value: { onboardingCompletedTours: [] } }
  })),
  refreshNuxtData: vi.fn(),
  $fetch: vi.fn()
}))

const mockDrive = vi.fn()
const mockDriver = vi.fn(() => ({ drive: mockDrive }))

vi.mock('driver.js', () => ({
  driver: mockDriver
}))

vi.mock('../app/composables/onboarding/registry', () => ({
  loadTourSteps: vi.fn().mockResolvedValue([
    { element: '[data-tour="test"]', popover: { title: 'Test', description: 'Test desc' } }
  ])
}))

// Test the types and registry directly since useOnboarding needs full Nuxt runtime
// Test types + ROUTE_TOUR_MAP + loadTourSteps logic

describe('onboarding types and registry', () => {
  it('TOUR_IDS contains all 7 tour ids', async () => {
    const { TOUR_IDS } = await import('../app/composables/onboarding/types')
    expect(TOUR_IDS).toEqual(['dashboard', 'clientes', 'catalogo', 'orcamentos', 'relatorios', 'configuracoes', 'agenda'])
  })

  it('ROUTE_TOUR_MAP maps all 7 routes', async () => {
    const { ROUTE_TOUR_MAP } = await import('../app/composables/onboarding/types')
    expect(ROUTE_TOUR_MAP['/dashboard']).toBe('dashboard')
    expect(ROUTE_TOUR_MAP['/clientes']).toBe('clientes')
    expect(ROUTE_TOUR_MAP['/catalogo']).toBe('catalogo')
    expect(ROUTE_TOUR_MAP['/orcamentos']).toBe('orcamentos')
    expect(ROUTE_TOUR_MAP['/relatorios']).toBe('relatorios')
    expect(ROUTE_TOUR_MAP['/configuracoes']).toBe('configuracoes')
    expect(ROUTE_TOUR_MAP['/agenda']).toBe('agenda')
    expect(ROUTE_TOUR_MAP['/unknown']).toBeUndefined()
  })

  it('loadTourSteps returns steps array', async () => {
    const { loadTourSteps } = await import('../app/composables/onboarding/registry')
    const steps = await loadTourSteps('dashboard')
    expect(Array.isArray(steps)).toBe(true)
    expect(steps.length).toBeGreaterThan(0)
    expect(steps[0]).toHaveProperty('element')
    expect(steps[0]).toHaveProperty('popover')
  })

  it('server TOUR_IDS matches client TOUR_IDS', async () => {
    const server = await import('../server/utils/onboardingTours')
    const client = await import('../app/composables/onboarding/types')
    expect([...server.TOUR_IDS]).toEqual([...client.TOUR_IDS])
  })
})

describe('onboarding step files', () => {
  const tourIds = ['dashboard', 'clientes', 'catalogo', 'orcamentos', 'relatorios', 'configuracoes', 'agenda'] as const

  for (const tourId of tourIds) {
    it(`${tourId} steps have valid structure`, async () => {
      const mod = await import(`../app/composables/onboarding/steps/${tourId}`)
      expect(Array.isArray(mod.steps)).toBe(true)
      expect(mod.steps.length).toBeGreaterThanOrEqual(2)

      for (const step of mod.steps) {
        expect(step.element).toMatch(/^\[data-tour="/)
        expect(step.popover.title).toBeTruthy()
        expect(step.popover.description).toBeTruthy()
      }
    })
  }
})
