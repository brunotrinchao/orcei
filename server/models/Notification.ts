import { Schema, model } from 'mongoose'

export interface INotification {
  _id?: string
  profileId: Schema.Types.ObjectId | string
  type: 'proposal_accepted' | 'proposal_rejected' | 'proposal_sent' | 'report_generated'
  title: string
  summary: string
  details?: Record<string, any>
  read: boolean
  metadata?: Record<string, any>
  createdAt?: Date
  updatedAt?: Date
}

const notificationSchema = new Schema({
  profileId: { type: Schema.Types.Mixed, ref: 'Profile', required: true, index: true },
  type: { 
    type: String, 
    enum: ['proposal_accepted', 'proposal_rejected', 'proposal_sent', 'report_generated'], 
    required: true 
  },
  title: { type: String, required: true },
  summary: { type: String, required: true },
  details: { type: Schema.Types.Mixed, default: {} },
  read: { type: Boolean, default: false, index: true },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true })

notificationSchema.index({ profileId: 1, createdAt: -1 })
notificationSchema.index({ profileId: 1, read: 1, createdAt: -1 })

export const Notification = model('Notification', notificationSchema)
