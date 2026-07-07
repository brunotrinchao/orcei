import { describe, it, expect, vi, beforeEach } from 'vitest'

// Stubs for global Nuxt/Nitro functions
vi.stubGlobal('defineEventHandler', (handler: any) => handler)
vi.stubGlobal('readRawBody', vi.fn())
vi.stubGlobal('getHeaders', vi.fn())
vi.stubGlobal('setResponseStatus', vi.fn())
vi.stubGlobal('createError', (err: any) => err)

// Mocks for models
const mockProposal = {
  findOne: vi.fn(),
  findByIdAndUpdate: vi.fn()
}
const mockProposalHistory = {
  create: vi.fn()
}

vi.mock('../server/models/Proposal', () => ({ Proposal: mockProposal }))
vi.mock('../server/models/ProposalHistory', () => ({ ProposalHistory: mockProposalHistory }))

// Mock svix
vi.mock('svix', () => {
  return {
    Webhook: vi.fn().mockImplementation(function() {
      return {
        verify: vi.fn((body) => JSON.parse(body))
      }
    })
  }
})

describe('Resend Webhook Integration', () => {
  let handler: any

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.RESEND_WEBHOOK_SECRET = 'test-secret'
    // Mutate the real reactive useRuntimeConfig instance provided by Nuxt Vitest environment
    const config = useRuntimeConfig()
    config.resendWebhookSecret = 'test-secret'
    const module = await import('../server/api/webhooks/resend.post')
    handler = module.default
  }, 10000)

  it('should throw 400 if svix headers are missing', async () => {
    vi.mocked(getHeaders).mockReturnValue({})
    const event = {} as any

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Missing svix headers'
    })
  })

  it('should update proposal status on email.opened', async () => {
    const emailId = 'test-email-id'
    const eventBody = JSON.stringify({
      type: 'email.opened',
      data: { email_id: emailId, subject: 'Test', to: ['test@test.com'] }
    })
    
    vi.mocked(getHeaders).mockReturnValue({
      'svix-id': 'id',
      'svix-timestamp': 'ts',
      'svix-signature': 'sig'
    })
    vi.mocked(readRawBody).mockResolvedValue(eventBody)
    
    mockProposal.findOne.mockResolvedValue({
      _id: 'prop-id',
      status: 'sent',
      lastEmailId: emailId
    })

    const result = await handler({} as any)
    
    expect(result).toEqual({ received: true })
    expect(mockProposalHistory.create).toHaveBeenCalled()
    expect(mockProposal.findByIdAndUpdate).toHaveBeenCalled()
  }, 15000)

  it('should not downgrade status (e.g. from opened to delivered)', async () => {
    const emailId = 'test-email-id'
    const eventBody = JSON.stringify({
      type: 'email.delivered',
      data: { email_id: emailId }
    })
    
    vi.mocked(getHeaders).mockReturnValue({
      'svix-id': 'id',
      'svix-timestamp': 'ts',
      'svix-signature': 'sig'
    })
    vi.mocked(readRawBody).mockResolvedValue(eventBody)
    
    mockProposal.findOne.mockResolvedValue({
      _id: 'prop-id',
      status: 'opened', // Higher level than delivered
      lastEmailId: emailId
    })

    await handler({} as any)
    
    // History should still be created
    expect(mockProposalHistory.create).toHaveBeenCalled()
    // but status should NOT be updated
    expect(mockProposal.findByIdAndUpdate).not.toHaveBeenCalled()
  })
})
