import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CatalogItem } from '../server/models/CatalogItem'
import { CatalogService } from '../server/services/CatalogService'

vi.mock('../server/models/CatalogItem', () => ({
  CatalogItem: { findOne: vi.fn() }
}))

describe('CatalogService.skuExists', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna false quando sku é vazio', async () => {
    expect(await CatalogService.skuExists('profile_1', '')).toBe(false)
    expect(CatalogItem.findOne).not.toHaveBeenCalled()
  })

  it('retorna true quando encontra item com mesmo sku no profile', async () => {
    vi.mocked(CatalogItem.findOne).mockReturnValue({ select: vi.fn().mockResolvedValue({ _id: 'x' }) } as any)
    expect(await CatalogService.skuExists('profile_1', 'SKU-1')).toBe(true)
  })

  it('retorna false quando não encontra', async () => {
    vi.mocked(CatalogItem.findOne).mockReturnValue({ select: vi.fn().mockResolvedValue(null) } as any)
    expect(await CatalogService.skuExists('profile_1', 'SKU-1')).toBe(false)
  })
})
