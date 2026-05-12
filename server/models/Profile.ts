import { Schema, model } from 'mongoose'

const profileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  brandConfig: {
    logoUrl: String,
    primaryColor: { type: String, default: '#3B82F6' }
  },
  creditsBalance: { type: Number, default: 1 },
  subscriptionPlan: { type: String, enum: ['free', 'starter', 'premium'], default: 'free' }
}, { timestamps: true })

export const Profile = model('Profile', profileSchema)
