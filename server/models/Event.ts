import { Schema, model } from 'mongoose'

const eventSchema = new Schema({
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  proposalId: { type: Schema.Types.ObjectId, ref: 'Proposal' },
  title: { type: String, required: true },
  description: String,
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  allDay: { type: Boolean, default: false },
  color: { type: String, default: '#3B82F6' }
}, { timestamps: true })

export const Event = model('Event', eventSchema)
