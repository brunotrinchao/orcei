import { Schema, model } from 'mongoose'

const clientSchema = new Schema({
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  name: { type: String, required: true },
  taxId: String,
  email: { type: String, required: true },
  phone: { type: String, required: true },
  isWhatsapp: { type: Boolean, default: false },
  avatar: String,
  address: {
    street: { type: String, required: true },
    number: String,
    neighborhood: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true }
  },
  notes: String
}, { timestamps: true })

// Ensure a user doesn't have duplicate emails for clients if needed, 
// but usually, it's fine per profile.
clientSchema.index({ profileId: 1, email: 1 })

export const Client = model('Client', clientSchema)
