import { Schema, model } from 'mongoose'

const reportSchema = new Schema({
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
  content: { type: String, required: true },
  context: { type: Schema.Types.Mixed } // Snapshot of the data used for the analysis
}, { timestamps: true })

// Index for daily limit check and filtering
reportSchema.index({ createdAt: -1 })
reportSchema.index({ profileId: 1, createdAt: -1 })

export const Report = model('Report', reportSchema)
