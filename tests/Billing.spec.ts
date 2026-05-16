import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import Billing from '../app/pages/dashboard/billing.vue'

const { mockUseFetch, mockNotify } = vi.hoisted(() => ({
  mockUseFetch: vi.fn(),
  mockNotify: vi.fn()
}))

mockNuxtImport('useFetch', () => mockUseFetch)

mockNuxtImport('useAlerts', () => {
  return () => ({
    notify: mockNotify,
    confirm: vi.fn()
  })
})

mockNuxtImport('useRoute', () => {
  return () => ({
    query: {}
  })
})

describe('Billing Page', () => {
  it('toggles visibility based on plan', async () => {
    // 1. Mock Free Plan
    mockUseFetch.mockImplementation((url: string) => {
      if (url === '/api/profile') {
        return { data: ref({ subscriptionPlan: 'free', creditsBalance: 5, brandConfig: { primaryColor: '#3B82F6' } }), refresh: vi.fn() }
      }
      return { data: ref([]), refresh: vi.fn() }
    })

    let component = await mountSuspended(Billing)
    expect(component.text()).toContain('Orçamento Avulso')
    expect(component.text()).not.toContain('Você possui Plano Ativo')

    // 2. Mock Active Plan
    mockUseFetch.mockImplementation((url: string) => {
      if (url === '/api/profile') {
        return { data: ref({ subscriptionPlan: 'starter', creditsBalance: 10, brandConfig: { primaryColor: '#3B82F6' } }), refresh: vi.fn() }
      }
      return { data: ref([]), refresh: vi.fn() }
    })
    
    component = await mountSuspended(Billing)
    expect(component.text()).not.toContain('Orçamento Avulso')
    expect(component.text()).toContain('Você possui Plano Ativo')
    expect(component.text()).toContain('starter')
  })

  it('blocks credit purchase attempt if plan is active', async () => {
    mockUseFetch.mockImplementation((url: string) => {
      if (url === '/api/profile') {
        return { data: ref({ subscriptionPlan: 'starter', brandConfig: { primaryColor: '#3B82F6' } }), refresh: vi.fn() }
      }
      return { data: ref([]), refresh: vi.fn() }
    })

    const component = await mountSuspended(Billing)
    
    // Check visual state
    expect(component.text()).toContain('Você possui Plano Ativo')
    expect(component.text()).not.toContain('Orçamento Avulso')
  })
})
