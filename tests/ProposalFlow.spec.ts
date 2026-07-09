import { describe, it, expect, vi, beforeEach } from 'vitest'

// Stubs for global Nuxt/Nitro functions
vi.stubGlobal('useRuntimeConfig', () => ({
  public: { siteUrl: 'https://test.com' }
}))
vi.stubGlobal('createError', (err: any) => err)

// Mocks for models
vi.mock('../server/models/Proposal', () => ({ 
  Proposal: {
    create: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findById: vi.fn()
  }
}))
vi.mock('../server/models/Profile', () => ({ 
  Profile: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn()
  }
}))
vi.mock('../server/models/Counter', () => ({ 
  Counter: {
    findOneAndUpdate: vi.fn()
  }
}))
vi.mock('../server/models/ProposalHistory', () => ({
  ProposalHistory: {
    create: vi.fn()
  }
}))
vi.mock('../server/models/PlatformSettings', () => ({
  PlatformSettings: {
    findOne: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) })
  }
}))

// Mock QueueService
vi.mock('../server/services/QueueService', () => ({ 
  QueueService: {
    publish: vi.fn()
  }
}))

// Import models to access their mocks
import { Proposal } from '../server/models/Proposal'
import { Profile } from '../server/models/Profile'
import { Counter } from '../server/models/Counter'
import { ProposalHistory } from '../server/models/ProposalHistory'
import { QueueService } from '../server/services/QueueService'

// Import service
import { ProposalService } from '../server/services/ProposalService'
import { ProposalStatus, PaymentMethod } from '../types/enums'

describe('ProposalService Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.PUBLIC_URL = 'https://test.com'
  })

  it('should queue an email when proposal is created with status created', async () => {
    vi.mocked(Counter.findOneAndUpdate).mockResolvedValue({ lastSequence: 1 })
    vi.mocked(Profile.findById).mockResolvedValue({ _id: 'prof-id', name: 'Freelancer', creditsBalance: 10, creditsUsed: 0 })
    vi.mocked(Proposal.create).mockImplementation(async (data: any) => ({ _id: 'prop-id', ...data }))

    const data = {
      profileId: 'prof-id',
      status: ProposalStatus.CREATED,
      client: { name: 'Cliente', email: 'test@test.com' },
      items: [{ name: 'Job', price: 100, quantity: 1 }],
      sendMethod: 'auto'
    }

    await ProposalService.create(data)

    expect(QueueService.publish).toHaveBeenCalledWith('SEND_EMAIL_PROPOSAL', expect.objectContaining({
      clientEmail: 'test@test.com'
    }))
    expect(ProposalHistory.create).toHaveBeenCalled()
  })

  it('should queue a google sync when proposal is accepted', async () => {
    vi.mocked(Proposal.findOne).mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: 'prop-id',
        items: [],
        profileId: {
          _id: 'prof-id',
          googleIntegration: { refreshToken: 'token' }
        }
      })
    } as any)
    vi.mocked(Proposal.findOneAndUpdate).mockResolvedValue({
      _id: 'prop-id',
      code: '#ORC-2026-001',
      status: ProposalStatus.ACCEPTED
    })

    await ProposalService.acceptProposal('test-slug', PaymentMethod.CASH)

    expect(QueueService.publish).toHaveBeenCalledWith('PROPOSAL_ACCEPTED', {
      proposalId: 'prop-id'
    })
  })
})
