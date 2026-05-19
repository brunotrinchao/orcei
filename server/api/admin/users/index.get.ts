import { Profile } from '../../../models/Profile'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user || (session.user as any).role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado' })
  }

  const { page = 1, limit = 20, search = '' } = getQuery(event)

  const query: any = { isDeleted: { $ne: true } }
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ]
  }

  const [users, total] = await Promise.all([
    Profile.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean(),
    Profile.countDocuments(query)
  ])

  return {
    users,
    total,
    page: Number(page),
    limit: Number(limit)
  }
})
