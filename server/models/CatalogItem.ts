import { Schema, model } from 'mongoose'
import { CatalogItemType } from '../../types/enums'

const catalogItemSchema = new Schema({
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  type: { type: String, enum: Object.values(CatalogItemType), required: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  unit: { type: String, default: 'UN' }, // UN, KG, CM, ML, H, DIA, MES
  sku: String,
  imageUrl: String,
  icon: { type: String, default: 'Package' },
  embedding: [Number],
  embeddingUpdatedAt: Date
}, { timestamps: true })

catalogItemSchema.index({ profileId: 1 })
catalogItemSchema.index({ type: 1 })
catalogItemSchema.index({ name: 1 })

export const CatalogItem = model('CatalogItem', catalogItemSchema)
