import { Schema, model } from 'mongoose'

const stripeEventSchema = new Schema({
  eventId: { type: String, required: true, unique: true, index: true },
  type: { type: String, required: true },
  processedAt: { type: Date, default: Date.now, expires: '30d' }
}, { timestamps: false })

export const StripeEvent = model('StripeEvent', stripeEventSchema)
