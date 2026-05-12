import { Schema, model } from 'mongoose'

const serviceSchema = new Schema({
  freelancerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  basePrice: { type: Number, required: true },
  billingType: { type: String, enum: ['hour', 'fixed'], default: 'fixed' }
}, { timestamps: true })

export const Service = model('Service', serviceSchema)
