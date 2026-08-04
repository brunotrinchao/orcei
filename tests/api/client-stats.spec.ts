import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockClient, mockProposal, mockGetUserSession, mockProfile } = vi.hoisted(() => {
  const mockClient = { findOne: vi.fn() }
  const mockProposal = { find: vi.fn() }
  const mockGetUserSession = vi.fn()
  const mockProfile = { getByUserId: vi.fn() }

  vi.stubGlobal('getUserSession', mockGetUserSession)
  vi.stubGlobal('getRouterParam', () => 'client123')
  vi.stubGlobal('createError', (opts: any) => {
    const err = new Error(opts.statusMessage) as any
    err.statusCode = opts.statusCode
    err.statusMessage = opts.statusMessage
    return err
  })
  vi.stubGlobal('defineEventHandler', (fn: any) => fn)

  return { mockClient, mockProposal, mockGetUserSession, mockProfile }
})

vi.mock('../../server/models/Client', () => ({ Client: mockClient }))
vi.mock('../../server/models/Proposal', () => ({ Proposal: mockProposal }))
vi.mock('../../server/services/ProfileService', () => ({ ProfileService: mockProfile }))

describe('GET /api/clients/[id]/stats', () => {
  let handler: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../../server/api/clients/[id]/stats.get')
    handler = mod.default
  })

  it('retorna 401 se o usuário não estiver autenticado', async () => {
    mockGetUserSession.mockResolvedValue(null)
    await expect(handler({} as any)).rejects.toThrow('Não autorizado')
  })

  it('calcula métricas de orçamentos e aceitos/recusados corretamente', async () => {
    mockGetUserSession.mockResolvedValue({ user: { id: 'user1' } })
    mockProfile.getByUserId.mockResolvedValue({ _id: 'prof1' })

    const fakeClient = { _id: 'client123', name: 'Empresa Teste', email: 'teste@empresa.com' }
    mockClient.findOne.mockResolvedValue(fakeClient)

    const fakeProposals = [
      { _id: 'p1', title: 'Orçamento 1', status: 'accepted', totals: { final: 1000 }, createdAt: new Date() },
      { _id: 'p2', title: 'Orçamento 2', status: 'accepted', totals: { final: 2000 }, createdAt: new Date() },
      { _id: 'p3', title: 'Orçamento 3', status: 'expired', totals: { final: 500 }, createdAt: new Date() },
      { _id: 'p4', title: 'Orçamento 4', status: 'draft', totals: { final: 300 }, createdAt: new Date() }
    ]

    mockProposal.find.mockReturnValue({
      sort: () => ({
        lean: () => Promise.resolve(fakeProposals)
      })
    })

    const result = await handler({} as any)

    expect(result).toBeDefined()
    expect(result.client).toEqual(fakeClient)
    expect(result.stats.totalProposals).toBe(4)
    expect(result.stats.acceptedCount).toBe(2)
    expect(result.stats.acceptedTotalValue).toBe(3000)
    expect(result.stats.expiredCount).toBe(1)
    expect(result.stats.expiredTotalValue).toBe(500)
    expect(result.stats.conversionRate).toBe(50)
    expect(result.stats.avgTicket).toBe(1500)
    expect(result.recentProposals.length).toBe(4)
  })
})
