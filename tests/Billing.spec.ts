import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import Billing from '../app/pages/planos/index.vue'

vi.mock('/home/brunotrinchao/Documentos/Bruno/Orcei/app/components/ui/BaseButton.vue', () => ({
  default: {
    name: 'BaseButton',
    props: ['variant', 'size', 'disabled', 'loading', 'to'],
    template: '<button :disabled="disabled"><slot /></button>'
  }
}))

const { mockUseFetch, mockNotify } = vi.hoisted(() => ({
  mockUseFetch: vi.fn(),
  mockNotify: vi.fn()
}))

mockNuxtImport('useFetch', () => mockUseFetch)
mockNuxtImport('useLazyFetch', () => mockUseFetch)

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
  it('renders credit packs and shows balance correctly', async () => {
    // Mock Profile Data with credit balance
    mockUseFetch.mockImplementation((url: string) => {
      if (url === '/api/profile') {
        return { 
          data: ref({ 
            subscriptionPlan: 'free', 
            creditsBalance: 5, 
            brandConfig: { primaryColor: '#3B82F6' } 
          }), 
          refresh: vi.fn() 
        }
      }
      return { data: ref([]), refresh: vi.fn() }
    })

    const component = await mountSuspended(Billing)
    const text = component.text()

    // Verificações visuais essenciais do novo modelo transacional
    expect(text).toContain('Planos e Recargas')
    expect(text).toContain('5 Créditos')
    expect(text).toContain('Crédito Avulso')
    expect(text).toContain('Pacote Starter')
    expect(text).toContain('Pacote Profissional')
    expect(text).toContain('Pacote Agência')
    
    // Preços dos pacotes
    expect(text).toContain('R$ 5,99')
    expect(text).toContain('R$ 29,00')
    expect(text).toContain('R$ 69,00')
    expect(text).toContain('R$ 149,00')
  })

  it('allows purchase attempts of credit packs', async () => {
    mockUseFetch.mockImplementation((url: string) => {
      if (url === '/api/profile') {
        return { 
          data: ref({ 
            subscriptionPlan: 'free', 
            creditsBalance: 12, 
            brandConfig: { primaryColor: '#3B82F6' } 
          }), 
          refresh: vi.fn() 
        }
      }
      return { data: ref([]), refresh: vi.fn() }
    })

    const component = await mountSuspended(Billing)
    const text = component.text()

    expect(text).toContain('12 Créditos')
    expect(text).toContain('1 Crédito')
    expect(text).toContain('10 Créditos')
    expect(text).toContain('30 Créditos')
    expect(text).toContain('100 Créditos')
  })
})

