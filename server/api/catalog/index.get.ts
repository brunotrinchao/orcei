import { ProfileService } from '../../services/ProfileService'
import { CatalogItem } from '../../models/CatalogItem'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404 })

  const { page = 1, limit = 10, search = '' } = getQuery(event)
  
  const query: any = { profileId: profile._id }
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } }
    ]
  }

  const [items, total] = await Promise.all([
    CatalogItem.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit)),
    CatalogItem.countDocuments(query)
  ])

  return {
    items,
    total,
    page: Number(page),
    limit: Number(limit)
  }
})
