import { Types, isValidObjectId } from 'mongoose'
import { Profile } from '../../../../models/Profile'
import { Proposal } from '../../../../models/Proposal'
import { AiUsageLog } from '../../../../models/AiUsageLog'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user || (session.user as any).role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado' })
  }

  const id = getRouterParam(event, 'id')
  if (!id || !isValidObjectId(id)) {
    throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado' })
  }

  const profileDoc = await Profile.findById(id).lean()
  if (!profileDoc) {
    throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado' })
  }

  // Nunca expor tokens de integrações de terceiros para o frontend admin.
  const profile: any = profileDoc
  if (profile.googleIntegration) {
    delete profile.googleIntegration.accessToken
    delete profile.googleIntegration.refreshToken
  }

  const objectId = new Types.ObjectId(id)

  const [aiTotalsAgg, aiByProviderAgg, recentAiCalls, proposalTotal, proposalStatusAgg, recentProposals] = await Promise.all([
    AiUsageLog.aggregate([
      { $match: { profileId: objectId } },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          successCalls: { $sum: { $cond: ['$success', 1, 0] } },
          failedCalls: { $sum: { $cond: ['$success', 0, 1] } },
          totalTokensInput: { $sum: '$tokensInput' },
          totalTokensOutput: { $sum: '$tokensOutput' },
          estimatedCostUsd: { $sum: '$estimatedCostUsd' }
        }
      }
    ]),
    AiUsageLog.aggregate([
      { $match: { profileId: objectId } },
      {
        $group: {
          _id: '$provider',
          totalCalls: { $sum: 1 },
          estimatedCostUsd: { $sum: '$estimatedCostUsd' },
          totalTokensInput: { $sum: '$tokensInput' },
          totalTokensOutput: { $sum: '$tokensOutput' }
        }
      },
      { $sort: { estimatedCostUsd: -1 } }
    ]),
    AiUsageLog.find({ profileId: objectId })
      .sort({ createdAt: -1 })
      .limit(15)
      .lean(),
    Proposal.countDocuments({ profileId: objectId }),
    Proposal.aggregate([
      { $match: { profileId: objectId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Proposal.find({ profileId: objectId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title status createdAt totals.final')
      .lean()
  ])

  const totals = aiTotalsAgg[0] || {}
  const byStatus: Record<string, number> = {}
  for (const row of proposalStatusAgg) {
    byStatus[row._id] = row.count
  }

  return {
    profile,
    aiSpend: {
      totalCalls: totals.totalCalls || 0,
      successCalls: totals.successCalls || 0,
      failedCalls: totals.failedCalls || 0,
      totalTokensInput: totals.totalTokensInput || 0,
      totalTokensOutput: totals.totalTokensOutput || 0,
      estimatedCostUsd: totals.estimatedCostUsd || 0,
      byProvider: aiByProviderAgg.map((p: any) => ({
        provider: p._id,
        totalCalls: p.totalCalls || 0,
        estimatedCostUsd: p.estimatedCostUsd || 0,
        totalTokensInput: p.totalTokensInput || 0,
        totalTokensOutput: p.totalTokensOutput || 0
      }))
    },
    recentAiCalls: recentAiCalls.map((c: any) => ({
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
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : null
    })),
    proposalsSummary: {
      total: proposalTotal,
      byStatus,
      recent: recentProposals.map((p: any) => ({
        title: p.title,
        status: p.status,
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
        totalFinal: p.totals?.final ?? 0
      }))
    }
  }
})
