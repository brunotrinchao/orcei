import { Schema, model } from 'mongoose'

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  brandConfig: {
    logoUrl: String,
    primaryColor: { type: String, default: '#3B82F6' }
  },
  creditsBalance: { type: Number, default: 1 },
  subscriptionPlan: { type: String, enum: ['free', 'starter', 'premium'], default: 'free' }
}, { timestamps: true })

export const User = model('User', userSchema)
