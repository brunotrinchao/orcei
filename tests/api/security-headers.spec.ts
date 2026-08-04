import { describe, it, expect, vi } from 'vitest'

vi.stubGlobal('defineEventHandler', (fn: any) => fn)
vi.stubGlobal('defineNuxtConfig', (config: any) => config)
vi.stubGlobal('useRuntimeConfig', () => ({ appName: 'Orcei Fácil' }))

describe('Validações de Segurança (SEC-02, SEC-03, SEC-04)', () => {
  it('SEC-04: status.get.ts não expõe a propriedade _id nas features', async () => {
    const { default: statusHandler } = await import('../../server/api/system/status.get')
    const mockEvent = {} as any
    
    // Executa o handler de status
    const response = await (statusHandler as any)(mockEvent)

    expect(response).toBeDefined()
    expect(response.landingPage).toBeDefined()
    expect(Array.isArray(response.landingPage.features)).toBe(true)

    // Verifica que nenhum item de feature possui _id
    response.landingPage.features.forEach((feature: any) => {
      expect(feature._id).toBeUndefined()
    })
  })

  it('SEC-02 & SEC-03: nuxt.config.ts possui Content-Security-Policy e Anti-Cache configurados', async () => {
    const { default: nuxtConfig } = await import('../../nuxt.config')
    const routeRules = (nuxtConfig as any).nitro?.routeRules
    expect(routeRules).toBeDefined()

    // SEC-02: CSP global
    const globalHeaders = routeRules['/**']?.headers
    expect(globalHeaders).toBeDefined()
    expect(globalHeaders['Content-Security-Policy']).toContain("default-src 'self'")
    expect(globalHeaders['X-Frame-Options']).toBe('SAMEORIGIN')

    // SEC-03: Cache-Control privado para /api/_auth/** e /api/auth/**
    const authSessionHeaders = routeRules['/api/_auth/**']?.headers
    expect(authSessionHeaders).toBeDefined()
    expect(authSessionHeaders['Cache-Control']).toContain('no-store')
    expect(authSessionHeaders['Cache-Control']).toContain('private')
  })
})
