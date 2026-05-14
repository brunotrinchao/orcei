import { Schema, model } from 'mongoose'

const catalogItemSchema = new Schema({
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  type: { type: String, enum: ['product', 'service'], required: true },
  name: { type: String, required: true },
  description: String,
  price: Number,
  unit: { type: String, default: 'UN' }, // UN, KG, CM, ML, H, DIA, MES
  sku: String,
  imageUrl: String
}, { timestamps: true })

export const CatalogItem = model('CatalogItem', catalogItemSchema)
