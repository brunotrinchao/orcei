import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BulkImportService } from '../server/services/BulkImportService'
import { ClientService } from '../server/services/ClientService'
import { CatalogService } from '../server/services/CatalogService'

vi.mock('../server/services/ClientService', () => ({
  ClientService: {
    emailExists: vi.fn(),
    create: vi.fn()
  }
}))

vi.mock('../server/services/CatalogService', () => ({
  CatalogService: {
    skuExists: vi.fn(),
    create: vi.fn()
  }
}))

describe('BulkImportService.processClientRows', () => {
  beforeEach(() => vi.clearAllMocks())

  it('cria linha válida sem duplicata', async () => {
    vi.mocked(ClientService.emailExists).mockResolvedValue(false)
    vi.mocked(ClientService.create).mockResolvedValue({ _id: 'c1' } as any)

    const results = await BulkImportService.processClientRows(
      [{ name: 'João', email: 'joao@email.com', phone: '11999999999' }],
      'profile_1'
    )

    expect(results).toEqual([{ index: 0, status: 'created' }])
    expect(ClientService.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'João', email: 'joao@email.com', phone: '11999999999', profileId: 'profile_1' })
    )
  })

  it('marca como skipped quando email já existe', async () => {
    vi.mocked(ClientService.emailExists).mockResolvedValue(true)

    const results = await BulkImportService.processClientRows(
      [{ name: 'João', email: 'joao@email.com', phone: '11999999999' }],
      'profile_1'
    )

    expect(results).toEqual([{ index: 0, status: 'skipped', message: 'E-mail já cadastrado' }])
    expect(ClientService.create).not.toHaveBeenCalled()
  })

  it('marca como error quando linha é inválida (sem nome)', async () => {
    const results = await BulkImportService.processClientRows(
      [{ email: 'joao@email.com', phone: '11999999999' }],
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
        { name: 'A', email: 'a@email.com', phone: '11999999999' },
        { name: '' , email: 'invalida', phone: '11999999999' },
        { name: 'C', email: 'c@email.com', phone: '11999999999' }
      ],
      'profile_1'
    )

    expect(results.map(r => r.status)).toEqual(['created', 'error', 'skipped'])
    expect(results.map(r => r.index)).toEqual([0, 1, 2])
  })
})

describe('BulkImportService.processCatalogRows', () => {
  beforeEach(() => vi.clearAllMocks())

  it('cria linha válida sem sku duplicado', async () => {
    vi.mocked(CatalogService.skuExists).mockResolvedValue(false)
    vi.mocked(CatalogService.create).mockResolvedValue({ _id: 'i1' } as any)

    const results = await BulkImportService.processCatalogRows(
      [{ type: 'product', name: 'Item', price: '10', sku: 'SKU-1' }],
      'profile_1'
    )

    expect(results).toEqual([{ index: 0, status: 'created' }])
  })

  it('marca skipped quando sku já existe', async () => {
    vi.mocked(CatalogService.skuExists).mockResolvedValue(true)

    const results = await BulkImportService.processCatalogRows(
      [{ type: 'product', name: 'Item', price: '10', sku: 'SKU-1' }],
      'profile_1'
    )

    expect(results).toEqual([{ index: 0, status: 'skipped', message: 'SKU já cadastrado' }])
    expect(CatalogService.create).not.toHaveBeenCalled()
  })

  it('marca error quando type é inválido', async () => {
    const results = await BulkImportService.processCatalogRows(
      [{ type: 'invalido', name: 'Item', price: '10' }],
      'profile_1'
    )

    expect(results[0].status).toBe('error')
    expect(CatalogService.create).not.toHaveBeenCalled()
  })

  it('não checa sku duplicado quando linha não tem sku', async () => {
    vi.mocked(CatalogService.create).mockResolvedValue({ _id: 'i1' } as any)

    const results = await BulkImportService.processCatalogRows(
      [{ type: 'service', name: 'Corte', price: '30' }],
      'profile_1'
    )

    expect(results).toEqual([{ index: 0, status: 'created' }])
    expect(CatalogService.skuExists).not.toHaveBeenCalled()
  })
})
