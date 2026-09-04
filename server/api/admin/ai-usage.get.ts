import { AiUsageLog } from '../../models/AiUsageLog'
import { Profile } from '../../models/Profile'

type ProviderKey = 'gemini' | 'deepseek' | 'cloudflare' | 'openrouter'
// Mesma ordem fixa de fallback usada em server/services/AIService.ts
// (DeepSeek → Gemini → Cloudflare → OpenRouter).
const PROVIDERS: ProviderKey[] = ['deepseek', 'gemini', 'cloudflare', 'openrouter']

function isProviderEnabled(provider: ProviderKey, config: any): boolean {
  switch (provider) {
    case 'deepseek': return !!config.useDeepseek
    case 'gemini': return config.useGemini !== false
    case 'cloudflare': return config.useCloudflare !== false
    case 'openrouter': return config.useOpenrouter !== false
  }
}

function resolvePeriodStart(period: string): Date | null {
  const now = Date.now()
  switch (period) {
    case 'last_24h': return new Date(now - 24 * 60 * 60 * 1000)
    case 'last_7_days': return new Date(now - 7 * 24 * 60 * 60 * 1000)
    case 'last_30_days': return new Date(now - 30 * 24 * 60 * 60 * 1000)
    case 'all': return null
    default: return new Date(now - 30 * 24 * 60 * 60 * 1000)
  }
}

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user || (session.user as any).role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado' })
  }

  // Garante que o model Profile esteja registrado para o populate abaixo.
  void Profile

  const { period } = getQuery(event)
  const periodStr = typeof period === 'string' ? period : 'last_30_days'
  const start = resolvePeriodStart(periodStr)
  const match: any = start ? { createdAt: { $gte: start } } : {}

  const page = Math.max(Number(getQuery(event).page) || 1, 1)
  const limit = Math.min(Math.max(Number(getQuery(event).limit) || 20, 1), 100)

  const config = useRuntimeConfig()
  // Com a cadeia de fallback (DeepSeek → Gemini → Cloudflare → OpenRouter),
  // mais de um provedor pode estar habilitado ao mesmo tempo — não existe
  // mais um único "ativo". Retorna a lista ordenada dos habilitados; o
  // primeiro é o que efetivamente atende primeiro numa chamada real.
  const enabledProviders = PROVIDERS.filter(p => isProviderEnabled(p, config))
  const primaryProvider: ProviderKey | null = enabledProviders[0] || null

  try {
    const [agg, recentCalls, recentTotal] = await Promise.all([
      AiUsageLog.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$provider',
            totalCalls: { $sum: 1 },
            successCalls: { $sum: { $cond: ['$success', 1, 0] } },
            failedCalls: { $sum: { $cond: ['$success', 0, 1] } },
            totalTokensInput: { $sum: '$tokensInput' },
            totalTokensOutput: { $sum: '$tokensOutput' },
            estimatedCostUsd: { $sum: '$estimatedCostUsd' },
            avgLatencyMs: { $avg: '$latencyMs' },
            lastUsedAt: { $max: '$createdAt' }
          }
        }
      ]),
      AiUsageLog.find(match)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('profileId', 'name email')
        .lean(),
      AiUsageLog.countDocuments(match)
    ])

    const byProvider = new Map<string, any>(agg.map(a => [a._id, a]))

    const providers = PROVIDERS.map(provider => {
      const row = byProvider.get(provider)
      return {
        provider,
        totalCalls: row?.totalCalls || 0,
        successCalls: row?.successCalls || 0,
        failedCalls: row?.failedCalls || 0,
        totalTokensInput: row?.totalTokensInput || 0,
        totalTokensOutput: row?.totalTokensOutput || 0,
        estimatedCostUsd: row?.estimatedCostUsd || 0,
        avgLatencyMs: row?.avgLatencyMs ? Math.round(row.avgLatencyMs) : 0,
        lastUsedAt: row?.lastUsedAt ? new Date(row.lastUsedAt).toISOString() : null
      }
    })

    return {
      period: periodStr,
      page,
      limit,
      recentTotal,
      enabledProviders,
      primaryProvider,
      providers,
      recentCalls: recentCalls.map((c: any) => ({
        id: c._id.toString(),
        provider: c.provider,
        model: c.model,
        action: c.action || null,
        tokensInput: c.tokensInput || 0,
        tokensOutput: c.tokensOutput || 0,
        estimatedCostUsd: c.estimatedCostUsd || 0,
        success: c.success,
        errorMessage: c.errorMessage || null,
        latencyMs: c.latencyMs ?? null,
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : null,
        user: c.profileId ? { name: c.profileId.name || null, email: c.profileId.email || null } : null
      }))
    }
  } catch (e: any) {
    console.error('[admin/ai-usage] Falha ao montar telemetria:', e)
    throw createError({ statusCode: 500, statusMessage: e?.message || 'Erro ao consultar telemetria de IA' })
  }
})
