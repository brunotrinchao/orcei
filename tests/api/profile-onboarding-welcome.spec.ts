import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockProfile, mockGetUserSession, mockReadBody } = vi.hoisted(() => {
  const mockProfile = {
    findOneAndUpdate: vi.fn()
  }
  const mockGetUserSession = vi.fn()
  const mockReadBody = vi.fn()

  vi.stubGlobal('getUserSession', mockGetUserSession)
  vi.stubGlobal('readBody', mockReadBody)
  vi.stubGlobal('createError', (opts: any) => {
    const err = new Error(opts.statusMessage) as any
    err.statusCode = opts.statusCode
    err.statusMessage = opts.statusMessage
    return err
  })
  vi.stubGlobal('defineEventHandler', (fn: any) => fn)

  return { mockProfile, mockGetUserSession, mockReadBody }
})

vi.mock('../../server/models/Profile', () => ({ Profile: mockProfile }))

// Mock mongoose partially
vi.mock('mongoose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('mongoose')>()
  return {
    ...actual,
    default: {
      ...actual.default,
      connection: { readyState: 1 },
      connect: vi.fn(),
      set: vi.fn()
    }
  }
})

describe('POST /api/profile/onboarding-welcome', () => {
  let handler: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../../server/api/profile/onboarding-welcome.post')
    handler = mod.default
  })

  it('should return 401 without session', async () => {
    mockGetUserSession.mockResolvedValue({ user: null })
    mockReadBody.mockResolvedValue({ accepted: true })

    await expect(handler({} as any)).rejects.toThrow('Não autorizado')
  })

  it('should return 400 with invalid body', async () => {
    mockGetUserSession.mockResolvedValue({ user: { id: 'user1' } })
    mockReadBody.mockResolvedValue({ accepted: 'yes' })

    await expect(handler({} as any)).rejects.toThrow()
  })

  it('should only $set onboardingWelcomeSeen when accepted', async () => {
    mockGetUserSession.mockResolvedValue({ user: { id: 'user1' } })
    mockReadBody.mockResolvedValue({ accepted: true })

    const mockProfileDoc = { _id: 'profile1', userId: 'user1', onboardingWelcomeSeen: true }
    mockProfile.findOneAndUpdate.mockResolvedValue(mockProfileDoc)

    const result = await handler({} as any)

    expect(mockProfile.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'user1' },
      { $set: { onboardingWelcomeSeen: true } },
      { returnDocument: 'after' }
    )
    expect(result).toEqual(mockProfileDoc)
  })

  it('should also $addToSet all tour ids when declined', async () => {
    mockGetUserSession.mockResolvedValue({ user: { id: 'user1' } })
    mockReadBody.mockResolvedValue({ accepted: false })

    const mockProfileDoc = { _id: 'profile1', userId: 'user1', onboardingWelcomeSeen: true }
    mockProfile.findOneAndUpdate.mockResolvedValue(mockProfileDoc)

    await handler({} as any)

    expect(mockProfile.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'user1' },
      expect.objectContaining({
        $set: { onboardingWelcomeSeen: true },
        $addToSet: { onboardingCompletedTours: { $each: expect.any(Array) } }
      }),
      { returnDocument: 'after' }
    )
  })

  it('should return 404 if profile not found', async () => {
    mockGetUserSession.mockResolvedValue({ user: { id: 'user1' } })
    mockReadBody.mockResolvedValue({ accepted: true })
    mockProfile.findOneAndUpdate.mockResolvedValue(null)

    await expect(handler({} as any)).rejects.toThrow('Perfil não encontrado')
  })
})
