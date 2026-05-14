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
  }) {
    return await CatalogItem.create(data)
  },

  async delete(id: string, profileId: string) {
    return await CatalogItem.findOneAndDelete({ _id: id, profileId })
  },

  async update(id: string, data: any) {
    return await CatalogItem.findByIdAndUpdate(id, data, { new: true })
  }
}
