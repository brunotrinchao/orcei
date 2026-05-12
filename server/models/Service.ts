import { Schema, model } from 'mongoose'

const serviceSchema = new Schema({
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  name: { type: String, required: true },
  description: String,
  basePrice: { type: Number, required: true },
  billingType: { type: String, enum: ['hour', 'fixed'], default: 'fixed' }
}, { timestamps: true })

export const Service = model('Service', serviceSchema)
