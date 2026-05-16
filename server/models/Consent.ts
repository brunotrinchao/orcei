import { Schema, model } from 'mongoose'

const consentSchema = new Schema({
  sessionId: { type: String, required: true, unique: true },
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: false },
  status: { type: String, enum: ['accepted', 'rejected'], required: true },
  ip: String,
  userAgent: String
}, { timestamps: true })

export const Consent = model('Consent', consentSchema)
