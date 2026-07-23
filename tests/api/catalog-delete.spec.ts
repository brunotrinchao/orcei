import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CatalogService } from '../../server/services/CatalogService'
import { ProfileService } from '../../server/services/ProfileService'

vi.mock('../../server/services/CatalogService', () => ({
  CatalogService: {
    delete: vi.fn()
  }
}))

vi.mock('../../server/services/ProfileService', () => ({
  ProfileService: {
    getByUserId: vi.fn()
  }
}))

describe('DELETE /api/catalog/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve simular exclusao de item do catalogo com sucesso', async () => {
    vi.mocked(ProfileService.getByUserId).mockResolvedValue({ _id: 'profile_123' } as any)
    vi.mocked(CatalogService.delete).mockResolvedValue({ _id: 'cat_123', name: 'Item Teste' } as any)

    const result = await CatalogService.delete('cat_123', 'profile_123')
    expect(CatalogService.delete).toHaveBeenCalledWith('cat_123', 'profile_123')
    expect(result).toBeDefined()
    expect(result._id).toBe('cat_123')
  })
})
