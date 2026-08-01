import { Schema, model } from 'mongoose'

// Telemetria de uso real dos provedores de IA (Gemini/DeepSeek/Cloudflare/OpenRouter).
// Sistema PARALELO e independente do sistema de créditos do cliente final
// (Profile.creditsBalance / utils/credits) — aqui registramos custo estimado
// pago aos provedores externos, não crédito consumido pelo usuário.
const aiUsageLogSchema = new Schema({
  // Pode ser null quando a chamada não pôde ser atribuída a um perfil.
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: false },
  provider: { type: String, enum: ['gemini', 'deepseek', 'cloudflare', 'openrouter'], required: true },
  model: { type: String, required: true },
  // Mesmas chaves usadas em CreditAction (server/utils/credits.ts): ex.
  // 'proposalSuggest', 'catalogSuggest', 'clientExtract', 'generate', 'analyzeReport'.
  action: { type: String, required: false },
  tokensInput: { type: Number, default: 0 },
  tokensOutput: { type: Number, default: 0 },
  estimatedCostUsd: { type: Number, default: 0 },
  success: { type: Boolean, required: true },
  errorMessage: String,
  latencyMs: Number
}, { timestamps: true })

aiUsageLogSchema.index({ provider: 1, createdAt: -1 })
aiUsageLogSchema.index({ profileId: 1, createdAt: -1 })

export const AiUsageLog = model('AiUsageLog', aiUsageLogSchema)
