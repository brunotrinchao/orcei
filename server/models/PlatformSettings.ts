import { Schema, model } from 'mongoose'
const platformSettingsSchema = new Schema({
  // Enforce single document
  singleton: { type: String, default: 'default', unique: true, select: false },
  maintenanceMode: { type: Boolean, default: false },
  footerText: { type: String, default: '© 2026 Orcei. Todos os direitos reservados.' },
  landingPage: {
    features: [{
      title: String,
      description: String,
      icon: String,
      enabled: { type: Boolean, default: true }
    }],
    heroTitle: { type: String, default: 'Crie orçamentos profissionais em segundos com IA' },
    heroSubtitle: { type: String, default: 'A plataforma definitiva para freelancers e pequenas agências gerenciarem vendas e fecharem mais negócios.' }
  },
  systemStatus: {
    label: { type: String, default: 'Operacional' },
    color: { type: String, default: 'green' }
  }
}, { timestamps: true })

export const PlatformSettings = model('PlatformSettings', platformSettingsSchema)
