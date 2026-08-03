import { ProfileService } from '../../services/ProfileService'
import { BulkImportService } from '../../services/BulkImportService'
import { assertValidBatchSize } from '../../utils/bulkImport'

export default defineEventHandler(async (event) => {
  const sessionPromise = getUserSession(event)
  const bodyPromise = readBody(event)

  const session = await sessionPromise
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404 })

  const body = await bodyPromise
  assertValidBatchSize(body?.rows)

  const results = await BulkImportService.processClientRows(body.rows, String(profile._id))
  return { results }
})
