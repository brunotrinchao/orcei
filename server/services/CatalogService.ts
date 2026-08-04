import { CatalogItem } from '../models/CatalogItem'

export const CatalogService = {
  async listByProfile(profileId: string) {
    return await CatalogItem.find({ profileId }).sort({ createdAt: -1 })
  },

  async create(data: {
    profileId: string;
    name: string;
    description?: string;
    price: number;
    type: 'product' | 'service';
    unit?: string;
    sku?: string;
    imageUrl?: string;
    aiAssisted?: boolean;
  }) {
    return await CatalogItem.create(data)
  },

  async delete(id: string, profileId: string) {
    return await CatalogItem.findOneAndDelete({ _id: id, profileId })
  },

  async update(id: string, profileId: string, data: any) {
    return await CatalogItem.findOneAndUpdate({ _id: id, profileId }, data, { returnDocument: 'after' })
  },

  async skuExists(profileId: string, sku: string): Promise<boolean> {
    const trimmed = sku?.trim()
    if (!trimmed) return false
    const existing = await CatalogItem.findOne({ profileId, sku: trimmed }).select('_id')
    return !!existing
  },
}