import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { defineComponent, h as vH, nextTick } from 'vue'
import { useSetupWizardModal } from '../app/components/onboarding/SetupWizardModal/index'

const h = vi.hoisted(() => ({
  notify: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(async () => true),
  refresh: vi.fn(async () => {}),
  fetch: vi.fn(async (url: string) => ({ setupWizardCompleted: true, success: true })),
  profile: { value: undefined as any },
}))

vi.stubGlobal('$fetch', h.fetch)

mockNuxtImport('useLazyFetch', () => () => ({ data: h.profile }))
mockNuxtImport('useUserSession', () => () => ({ user: { value: { id: 'u-test', name: 'T', email: 't@t.com' } }, loggedIn: { value: true }, session: { value: {} } }))
mockNuxtImport('useAlerts', () => () => ({ notify: h.notify }))
mockNuxtImport('useFormValidation', () => () => ({ validate: () => true, reset: vi.fn() }))
mockNuxtImport('useGoogleConnect', () => () => ({ connect: h.connect }))
mockNuxtImport('refreshNuxtData', () => h.refresh)

function emptyProfile() {
  return {
    name: 'T', email: 't@t.com',
    company: { taxId: '', legalName: '', tradeName: '' },
    address: { street: '', number: '', neighborhood: '', city: '', state: '', zip: '' },
    contact: { phones: [], social: {} },
    brandConfig: { primaryColor: '#3B82F6' },
  }
}

const Harness = defineComponent({
  setup() {
    return useSetupWizardModal({ open: true }, h.emit)
  },
  render() {
    return vH('div')
  },
})

const vm = (w: any) => w.vm as any

beforeEach(() => {
  sessionStorage.clear()
  vi.clearAllMocks()
  h.profile.value = undefined
})

describe('SetupWizard — dados digitados sobrevivem', () => {
  it('tipa empresa antes do perfil carregar: dados sobrevivem (race)', async () => {
    const w = await mountSuspended(Harness)
    vm(w).localProfile.company.tradeName = 'Org X'
    await nextTick()
    h.profile.value = emptyProfile()
    await nextTick()
    expect(vm(w).localProfile.company.tradeName).toBe('Org X')
    expect(vm(w).localProfile.company.taxId).toBe('')
  })

  it('rascunho persiste em sessionStorage enquanto aberto', async () => {
    const w = await mountSuspended(Harness)
    vm(w).localProfile.company.tradeName = 'Draft Org'
    await nextTick()
    const raw = sessionStorage.getItem('setup-wizard-draft:u-test')
    expect(raw).toContain('Draft Org')
  })

  it('rascunho restaura com prioridade sobre o prefill do perfil', async () => {
    sessionStorage.setItem('setup-wizard-draft:u-test', JSON.stringify({
      localProfile: { ...emptyProfile(), company: { tradeName: 'Draft Org', legalName: '', taxId: '' } },
      clientData: {}, productData: {}, currentStep: 2, isWelcome: false,
    }))
    const w = await mountSuspended(Harness)
    expect(vm(w).localProfile.company.tradeName).toBe('Draft Org')
    expect(vm(w).currentStep).toBe(2)
    h.profile.value = emptyProfile()
    await nextTick()
    expect(vm(w).localProfile.company.tradeName).toBe('Draft Org')
  })

  it('nextStep bloqueia sem nome da organização', async () => {
    const w = await mountSuspended(Harness)
    vm(w).nextStep()
    expect(vm(w).currentStep).toBe(1)
    expect(h.notify).toHaveBeenCalled()
    vm(w).localProfile.company.tradeName = 'Org X'
    vm(w).nextStep()
    expect(vm(w).currentStep).toBe(2)
  })

  it('fluxo completo: etapas 1→5 e finish grava os dados digitados', async () => {
    h.profile.value = { ...emptyProfile(), googleIntegration: { refreshToken: 'r', grantedScopes: ['https://www.googleapis.com/auth/drive.file'] } }
    const w = await mountSuspended(Harness)
    vm(w).localProfile.company.tradeName = 'Org X'
    vm(w).localProfile.address.city = 'BH'
    vm(w).nextStep()
    vm(w).nextStep()
    vm(w).nextStep()
    vm(w).nextStep()
    expect(vm(w).currentStep).toBe(5)
    vm(w).handleFinish()
    await vi.waitFor(() => expect(h.emit).toHaveBeenCalledWith('close'), { timeout: 5000 })
    const call = h.fetch.mock.calls.find(c => c[0] === '/api/profile/setup-wizard')
    expect(call).toBeTruthy()
    expect(call[1].body.company.tradeName).toBe('Org X')
    expect(call[1].body.address.city).toBe('BH')
    expect(sessionStorage.getItem('setup-wizard-draft:u-test')).toBeNull()
    expect(h.refresh).toHaveBeenCalled()
  })

  it('bloqueia finish sem Google Drive e sem $fetch', async () => {
    h.profile.value = emptyProfile()
    const w = await mountSuspended(Harness)
    vm(w).localProfile.company.tradeName = 'Org X'
    vm(w).handleFinish()
    await nextTick()
    expect(h.notify).toHaveBeenCalledWith('Integração necessária', expect.anything())
    expect(h.fetch).not.toHaveBeenCalled()
  })
})
