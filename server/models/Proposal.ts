import { Schema, model } from 'mongoose'
import { ProposalStatus, PaymentMethod, SendMethod, DiscountType } from '../../types/enums'

const itemSnapshotSchema = new Schema({
  name: String,
  description: String,
  price: Number,
  quantity: { type: Number, default: 1 },
  isUpsell: { type: Boolean, default: false },
  discount: {
    value: { type: Number, default: 0 },
    type: { type: String, enum: Object.values(DiscountType), default: DiscountType.PERCENT }
  }
})

const viewTrackingSchema = new Schema({
  ip: { type: String, default: null },
  browser: { type: String, default: null },
  location: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
}, { _id: false })

const proposalSchema = new Schema({
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  title: { type: String, required: true },
  sequenceNumber: { type: Number, required: true },
  code: { type: String, required: true },
  token: { type: String },
  client: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String
  },
  slug: { type: String, required: true, unique: true },
  status: { type: String, enum: Object.values(ProposalStatus), default: ProposalStatus.DRAFT },
  views: [viewTrackingSchema],
  items: [itemSnapshotSchema],
  upsellItems: [itemSnapshotSchema],
  totals: {
    subtotal: { type: Number, default: 0 },
    additional: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    final: { type: Number, default: 0 }
  },
  paymentConfig: {
    method: { type: String, enum: Object.values(PaymentMethod), default: PaymentMethod.CASH },
    installments: { type: Number, default: 1 },
    cashDiscount: { type: Number, default: 0 }
  },
  sendMethod: { type: String, enum: Object.values(SendMethod), default: SendMethod.AUTO },
  contractText: String,
  termsAndConditions: String,
  expiresAt: Date,
  executionDate: { type: Date, default: null },
  lastEmailId: String,
  aiAssisted: { type: Boolean, default: false }
}, { timestamps: true })

proposalSchema.index({ profileId: 1 })
proposalSchema.index({ profileId: 1, status: 1 })

export const Proposal = model('Proposal', proposalSchema)
