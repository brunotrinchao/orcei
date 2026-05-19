import { Report } from '../../models/Report'
import { ProfileService } from '../../services/ProfileService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404 })

  const { start, end } = getQuery(event)
  const query: any = { profileId: profile._id }

  if (start || end) {
    query.createdAt = {}
    if (start) query.createdAt.$gte = new Date(start as string + 'T00:00:00')
    if (end) query.createdAt.$lte = new Date(end as string + 'T23:59:59')
  }

  const reports = await Report.find(query).sort({ createdAt: -1 })
  
  return reports
})
