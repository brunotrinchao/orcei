import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  mockProfile,
  mockClient,
  mockProposal,
  mockProposalMessage,
  mockProposalHistory,
  mockCatalogItem,
  mockReport,
  mockEventModel,
  mockCounter,
  mockAuditLog,
  mockGetUserSession,
  mockReadBody
} = vi.hoisted(() => {
  const mockProfile = { findOne: vi.fn() }
  const mockClient = { deleteMany: vi.fn() }
  const mockProposal = { find: vi.fn(), deleteMany: vi.fn() }
  const mockProposalMessage = { deleteMany: vi.fn() }
  const mockProposalHistory = { deleteMany: vi.fn() }
  const mockCatalogItem = { deleteMany: vi.fn() }
  const mockReport = { deleteMany: vi.fn() }
  const mockEventModel = { deleteMany: vi.fn() }
  const mockCounter = { deleteMany: vi.fn() }
  const mockAuditLog = { create: vi.fn() }

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

  return {
    mockProfile,
    mockClient,
    mockProposal,
    mockProposalMessage,
    mockProposalHistory,
    mockCatalogItem,
    mockReport,
    mockEventModel,
    mockCounter,
    mockAuditLog,
    mockGetUserSession,
    mockReadBody
  }
})

vi.mock('../../server/models/Profile', () => ({ Profile: mockProfile }))
vi.mock('../../server/models/Client', () => ({ Client: mockClient }))
vi.mock('../../server/models/Proposal', () => ({ Proposal: mockProposal }))
vi.mock('../../server/models/ProposalMessage', () => ({ ProposalMessage: mockProposalMessage }))
vi.mock('../../server/models/ProposalHistory', () => ({ ProposalHistory: mockProposalHistory }))
vi.mock('../../server/models/CatalogItem', () => ({ CatalogItem: mockCatalogItem }))
vi.mock('../../server/models/Report', () => ({ Report: mockReport }))
vi.mock('../../server/models/Event', () => ({ Event: mockEventModel }))
vi.mock('../../server/models/Counter', () => ({ Counter: mockCounter }))
vi.mock('../../server/models/AuditLog', () => ({ AuditLog: mockAuditLog }))

describe('POST /api/profile/reset-data', () => {
  let handler: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../../server/api/profile/reset-data.post')
    handler = mod.default
  })

  it('should return 401 without session', async () => {
    mockGetUserSession.mockResolvedValue({ user: null })
    mockReadBody.mockResolvedValue({ confirm: 'test@example.com' })

    await expect(handler({ node: { req: { socket: {} } } } as any)).rejects.toThrow('Não autorizado')
  })

  it('should return 404 if profile not found', async () => {
    mockGetUserSession.mockResolvedValue({ user: { id: 'user1' } })
    mockProfile.findOne.mockResolvedValue(null)

    await expect(handler({ node: { req: { socket: {} } } } as any)).rejects.toThrow('Perfil não encontrado')
  })

  it('should return 400 if confirmation email does not match', async () => {
    mockGetUserSession.mockResolvedValue({ user: { id: 'user1' } })
    mockProfile.findOne.mockResolvedValue({ _id: 'prof1', email: 'user@example.com', name: 'User' })
    mockReadBody.mockResolvedValue({ confirm: 'wrong@example.com' })

    await expect(handler({ node: { req: { socket: {} } } } as any)).rejects.toThrow('Confirmação inválida')
  })

  it('should reset data when confirmation matches', async () => {
    mockGetUserSession.mockResolvedValue({ user: { id: 'user1' } })
    mockProfile.findOne.mockResolvedValue({ _id: 'prof1', email: 'user@example.com', name: 'User' })
    mockReadBody.mockResolvedValue({ confirm: 'user@example.com' })

    const mockDistinct = vi.fn().mockResolvedValue(['prop1', 'prop2'])
    mockProposal.find.mockReturnValue({ distinct: mockDistinct })

    mockProposalMessage.deleteMany.mockResolvedValue({ deletedCount: 2 })
    mockProposalHistory.deleteMany.mockResolvedValue({ deletedCount: 2 })
    mockProposal.deleteMany.mockResolvedValue({ deletedCount: 2 })
    mockClient.deleteMany.mockResolvedValue({ deletedCount: 5 })
    mockCatalogItem.deleteMany.mockResolvedValue({ deletedCount: 10 })
    mockReport.deleteMany.mockResolvedValue({ deletedCount: 1 })
    mockEventModel.deleteMany.mockResolvedValue({ deletedCount: 3 })
    mockCounter.deleteMany.mockResolvedValue({ deletedCount: 1 })
    mockAuditLog.create.mockResolvedValue({})

    const res = await handler({ node: { req: { socket: { remoteAddress: '127.0.0.1' } } } } as any)

    expect(res.success).toBe(true)
    expect(mockAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      action: 'ACCOUNT_DATA_RESET',
      adminId: 'user1'
    }))
    expect(mockClient.deleteMany).toHaveBeenCalledWith({ profileId: 'prof1' })
  })
})
