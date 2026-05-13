import { Schema, model } from 'mongoose'

const itemSnapshotSchema = new Schema({
  name: String,
  description: String,
  price: Number,
  quantity: { type: Number, default: 1 },
  discount: {
    value: { type: Number, default: 0 },
    type: { type: String, enum: ['percent', 'fixed'], default: 'percent' }
  }
})

const proposalSchema = new Schema({
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  title: { type: String, required: true },
  client: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String
  },
  slug: { type: String, required: true, unique: true },
  status: { type: String, enum: ['draft', 'pending', 'accepted', 'expired', 'created'], default: 'draft' },
  items: [itemSnapshotSchema],
  upsellItems: [itemSnapshotSchema],
  totals: {
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    final: { type: Number, default: 0 }
  },
  contractText: String,
  termsAndConditions: String,
  expiresAt: Date
}, { timestamps: true })

export const Proposal = model('Proposal', proposalSchema)
