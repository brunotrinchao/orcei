import { Schema, model } from 'mongoose'

const auditLogSchema = new Schema({
  adminId: { type: String, required: true, ref: 'Profile' },
  adminName: String,
  action: { type: String, required: true }, // e.g., 'UPDATE_CREDITS', 'DELETE_USER', 'CHANGE_SETTINGS'
  targetId: { type: String }, // ID of the affected user/resource
  targetType: String, // 'User', 'Settings', etc.
  details: Schema.Types.Mixed, // Any additional JSON data
  ip: String
}, { timestamps: true })

// Performance Indexes
auditLogSchema.index({ adminId: 1 })
auditLogSchema.index({ action: 1 })
auditLogSchema.index({ createdAt: -1 })

export const AuditLog = model('AuditLog', auditLogSchema)
