import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock mongoose partially
vi.mock('mongoose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('mongoose')>()
  return {
    ...actual,
    default: {
      ...actual.default,
      connection: {
        readyState: 1
      },
      connect: vi.fn(),
      set: vi.fn()
    }
  }
})

// Mock Receiver to bypass signature verification
const { mockVerify } = vi.hoisted(() => ({
  mockVerify: vi.fn().mockResolvedValue(true)
}))

vi.mock('@upstash/qstash', () => {
  class Receiver {
    verify = mockVerify
  }
  return { Receiver }
})

// Mocks
vi.mock('../server/models/Proposal', () => ({
  Proposal: {
    findById: vi.fn()
  }
}))

vi.mock('../server/services/GoogleService', () => ({
  GoogleService: {
    getAuthClient: vi.fn(),
    ensureFolder: vi.fn(),
    uploadPdf: vi.fn(),
    createEvent: vi.fn()
  }
}))

vi.mock('../server/utils/pdf', () => ({
  generateProposalPdfBuffer: vi.fn().mockResolvedValue(Buffer.from('pdf'))
}))

vi.mock('../server/services/ProposalService', () => ({
  ProposalService: {
    logHistory: vi.fn(),
    ensureApplicationCalendarEvent: vi.fn()
  }
}))

// Globals
vi.stubGlobal('defineEventHandler', (h: any) => h)
vi.stubGlobal('getHeaders', vi.fn())
vi.stubGlobal('readBody', vi.fn())
vi.stubGlobal('createError', (e: any) => {
  const err = new Error(e.statusMessage || 'Error')
  ;(err as any).statusCode = e.statusCode
  return err
})

describe('Google Automation (QStash Webhook)', () => {
  let handler: any

  beforeEach(async () => {
    vi.clearAllMocks()
    // Mutate the real reactive useRuntimeConfig instance provided by Nuxt Vitest environment
    const config = useRuntimeConfig()
    config.qstashCurrentSigningKey = 'mock-current-key'
    config.qstashNextSigningKey = 'mock-next-key'
    const module = await import('../server/api/webhooks/qstash.post')
    handler = module.default
  })

  it('should run full google automation when proposal is accepted', async () => {
    const proposalId = 'prop-123'
    const profileId = 'prof-456'
    
    const { getHeaders, readBody } = (global as any)
    vi.mocked(getHeaders).mockReturnValue({ 'action': 'PROPOSAL_ACCEPTED' })
    vi.mocked(readBody).mockResolvedValue({ proposalId })
    
    const { Proposal } = await import('../server/models/Proposal')
    vi.mocked(Proposal.findById).mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: proposalId,
        code: 'ORC-001',
        title: 'Test Job',
        client: { name: 'John Doe' },
        totals: { final: 1000 },
        executionDate: '2026-05-25',
        profileId: {
          _id: profileId,
          googleIntegration: { refreshToken: 'rtok' }
        }
      })
    } as any)

    const { GoogleService } = await import('../server/services/GoogleService')
    vi.mocked(GoogleService.getAuthClient).mockReturnValue({} as any)
    vi.mocked(GoogleService.ensureFolder).mockResolvedValue('folder-123')
    vi.mocked(GoogleService.uploadPdf).mockResolvedValue({ id: 'file-123', webViewLink: 'link-123' })

    const event = {} as any
    await handler(event)

    expect(GoogleService.getAuthClient).toHaveBeenCalled()
    expect(GoogleService.ensureFolder).toHaveBeenCalled()
    expect(GoogleService.uploadPdf).toHaveBeenCalled()
    expect(GoogleService.createEvent).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      summary: expect.stringContaining('John Doe'),
      fileId: 'file-123'
    }))
  })
})
