import { Schema, model } from 'mongoose'

const catalogItemSchema = new Schema({
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  type: { type: String, enum: ['product', 'service'], required: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  unit: { type: String, default: 'UN' }, // UN, KG, CM, ML, H, DIA, MES
  sku: String,
  imageUrl: String,
  icon: { type: String, default: 'Package' }
}, { timestamps: true })

catalogItemSchema.index({ profileId: 1 })
catalogItemSchema.index({ type: 1 })
catalogItemSchema.index({ name: 1 })

export const CatalogItem = model('CatalogItem', catalogItemSchema)
