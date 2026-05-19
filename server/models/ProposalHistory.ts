import { Schema, model } from 'mongoose'

const proposalHistorySchema = new Schema({
  proposalId: { type: Schema.Types.ObjectId, ref: 'Proposal', required: true },
  type: { type: String, enum: ['system', 'email'], required: true },
  action: { 
    type: String, 
    enum: [
      'created', 
      'sent', 
      'delivered', 
      'opened', 
      'clicked', 
      'bounced', 
      'complained', 
      'accepted', 
      'declined', 
      'viewed',
      'scheduled',
      'received',
      'delayed',
      'failed',
      'suppressed'
    ], 
    required: true 
  },
  details: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true })

proposalHistorySchema.index({ proposalId: 1 })
proposalHistorySchema.index({ timestamp: -1 })

export const ProposalHistory = model('ProposalHistory', proposalHistorySchema)
