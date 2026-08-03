import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BulkImportService } from '../server/services/BulkImportService'
import { ClientService } from '../server/services/ClientService'

vi.mock('../server/services/ClientService', () => ({
  ClientService: {
    emailExists: vi.fn(),
    create: vi.fn()
  }
}))

describe('BulkImportService.processClientRows', () => {
  beforeEach(() => vi.clearAllMocks())

  it('cria linha válida sem duplicata', async () => {
    vi.mocked(ClientService.emailExists).mockResolvedValue(false)
    vi.mocked(ClientService.create).mockResolvedValue({ _id: 'c1' } as any)

    const results = await BulkImportService.processClientRows(
      [{ name: 'João', email: 'joao@email.com' }],
      'profile_1'
    )

    expect(results).toEqual([{ index: 0, status: 'created' }])
    expect(ClientService.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'João', email: 'joao@email.com', profileId: 'profile_1' })
    )
  })

  it('marca como skipped quando email já existe', async () => {
    vi.mocked(ClientService.emailExists).mockResolvedValue(true)

    const results = await BulkImportService.processClientRows(
      [{ name: 'João', email: 'joao@email.com' }],
      'profile_1'
    )

    expect(results).toEqual([{ index: 0, status: 'skipped', message: 'E-mail já cadastrado' }])
    expect(ClientService.create).not.toHaveBeenCalled()
  })

  it('marca como error quando linha é inválida (sem nome)', async () => {
    const results = await BulkImportService.processClientRows(
      [{ email: 'joao@email.com' }],
      'profile_1'
    )

    expect(results[0].status).toBe('error')
    expect(results[0].message).toContain('Nome é obrigatório')
    expect(ClientService.create).not.toHaveBeenCalled()
  })

  it('processa lote misto preservando o index original de cada linha', async () => {
    vi.mocked(ClientService.emailExists)
      .mockResolvedValueOnce(false) // linha 0: criada
      .mockResolvedValueOnce(true)  // linha 2: skip
    vi.mocked(ClientService.create).mockResolvedValue({ _id: 'c1' } as any)

    const results = await BulkImportService.processClientRows(
      [
        { name: 'A', email: 'a@email.com' },
        { name: '' , email: 'invalida' },
        { name: 'C', email: 'c@email.com' }
      ],
      'profile_1'
    )

    expect(results.map(r => r.status)).toEqual(['created', 'error', 'skipped'])
    expect(results.map(r => r.index)).toEqual([0, 1, 2])
  })
})
