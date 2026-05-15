import { Schema, model } from 'mongoose'

const counterSchema = new Schema({
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  year: { type: Number, required: true },
  lastSequence: { type: Number, default: 0 }
}, { timestamps: true })

counterSchema.index({ profileId: 1, year: 1 }, { unique: true })

export const Counter = model('Counter', counterSchema)
