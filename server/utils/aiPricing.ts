// Preços aproximados por 1M tokens (USD), input/output. Fonte: pricing público
// dos provedores no momento da implementação — PODE FICAR DESATUALIZADO,
// revisar periodicamente. Não é fatura oficial.
export const AI_PRICING: Record<string, { inputPer1M: number; outputPer1M: number }> = {
  'gemini-2.5-flash': { inputPer1M: 0.075, outputPer1M: 0.30 },
  'gemini-2.5-pro': { inputPer1M: 1.25, outputPer1M: 5.00 },
  'deepseek-chat': { inputPer1M: 0.27, outputPer1M: 1.10 }
}

// Cloudflare Workers AI e OpenRouter (modelo free configurado) — usuário confirmou
// que usa camada gratuita hoje; sem preço público direto por token pro modelo
// configurado, tratar como custo zero (consistente com o que o usuário reportou).
export function estimateCostUsd(model: string, tokensInput: number, tokensOutput: number): number {
  const pricing = AI_PRICING[model]
  if (!pricing) return 0
  return (tokensInput / 1_000_000) * pricing.inputPer1M + (tokensOutput / 1_000_000) * pricing.outputPer1M
}
