import { Schema, model } from 'mongoose'

const proposalMessageSchema = new Schema({
  proposalId: { type: Schema.Types.ObjectId, ref: 'Proposal', required: true },
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  sender: { type: String, enum: ['client', 'freelancer'], required: true },
  text: { type: String, required: true },
  read: { type: Boolean, default: false },
}, { timestamps: true })

proposalMessageSchema.index({ proposalId: 1 })
proposalMessageSchema.index({ createdAt: 1 })

export const ProposalMessage = model('ProposalMessage', proposalMessageSchema)
