import { AuditLog } from '../../models/AuditLog'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user || (session.user as any).role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado' })
  }

  const { page = 1, limit = 50 } = getQuery(event)

  const [logs, total] = await Promise.all([
    AuditLog.find({})
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean(),
    AuditLog.countDocuments({})
  ])

  return {
    logs,
    total,
    page: Number(page),
    limit: Number(limit)
  }
})
