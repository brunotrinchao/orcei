import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.stubGlobal('defineEventHandler', (h: any) => h)
vi.stubGlobal('getUserSession', vi.fn())
vi.stubGlobal('readBody', vi.fn())
vi.stubGlobal('createError', (e: any) => {
  const err = new Error(e.statusMessage || 'Error')
  ;(err as any).statusCode = e.statusCode
  ;(err as any).statusMessage = e.statusMessage
  return err
})

vi.mock('../server/models/Profile', () => ({
  Profile: {
    findOneAndUpdate: vi.fn(),
  },
}))

describe('API /api/profile/setup-wizard (salvamento do onboarding)', () => {
  let handler: any
  let Profile: any

  const validPayload = {
    company: { tradeName: 'Org X', legalName: 'Org X LTDA', taxId: '12.345.678/0001-00' },
    address: { street: 'Rua A', number: '10', neighborhood: 'Centro', city: 'BH', state: 'MG', zip: '30140-000' },
    contact: { phones: [{ number: '31999999999', isWhatsapp: true }], social: { instagram: '@orgx' } },
    brandConfig: { primaryColor: '#3B82F6' },
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    const { getUserSession, readBody } = global as any
    vi.mocked(getUserSession).mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(readBody).mockResolvedValue(validPayload)
    const mod = await import('../server/api/profile/setup-wizard.post.ts')
    handler = mod.default
    const m = await import('../server/models/Profile')
    Profile = m.Profile
  })

  it('salva company + address + contact + brandConfig e marca wizard completo no mesmo $set', async () => {
    Profile.findOneAndUpdate.mockResolvedValue({ _id: 'p1' })
    await handler()
    expect(Profile.findOneAndUpdate).toHaveBeenCalledTimes(1)
    const [filter, update] = Profile.findOneAndUpdate.mock.calls[0]
    expect(filter).toEqual({ userId: 'u1' })
    const $set = update.$set
    expect($set.setupWizardCompleted).toBe(true)
    expect($set.setupWizardSkippedAt).toBe(null)
    expect($set.company).toEqual(validPayload.company)
    expect($set.address).toEqual(validPayload.address)
    expect($set.contact).toEqual(validPayload.contact)
    expect($set.brandConfig).toEqual(validPayload.brandConfig)
  })

  it('400 quando tradeName vazio', async () => {
    vi.mocked(readBody).mockResolvedValue({ ...validPayload, company: { tradeName: '' } })
    await expect(handler()).rejects.toMatchObject({ statusCode: 400, message: 'Informe o nome da organização para concluir o cadastro.' })
    expect(Profile.findOneAndUpdate).not.toHaveBeenCalled()
  })

  it('400 quando body sem company', async () => {
    vi.mocked(readBody).mockResolvedValue({ address: validPayload.address } as any)
    await expect(handler()).rejects.toMatchObject({ statusCode: 400 })
    expect(Profile.findOneAndUpdate).not.toHaveBeenCalled()
  })

  it('skip grava só setupWizardSkippedAt', async () => {
    vi.mocked(readBody).mockResolvedValue({ skip: true })
    Profile.findOneAndUpdate.mockResolvedValue({ _id: 'p1' })
    const result = await handler()
    const [filter, update] = Profile.findOneAndUpdate.mock.calls[0]
    expect(filter).toEqual({ userId: 'u1' })
    expect(update.$set.setupWizardSkippedAt).toEqual(expect.any(Date))
    expect(update.$set.setupWizardCompleted).toBeUndefined()
    expect(result).toEqual({ success: true, skipped: true })
  })

  it('404 quando perfil não existe', async () => {
    Profile.findOneAndUpdate.mockResolvedValue(null)
    await expect(handler()).rejects.toMatchObject({ statusCode: 404 })
  })

  it('401 sem sessão', async () => {
    const { getUserSession } = global as any
    vi.mocked(getUserSession).mockResolvedValue({})
    await expect(handler()).rejects.toMatchObject({ statusCode: 401 })
  })
})
