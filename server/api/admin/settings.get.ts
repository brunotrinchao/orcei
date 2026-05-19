import { PlatformSettings } from '../../models/PlatformSettings'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user || (session.user as any).role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado' })
  }

  let settings = await PlatformSettings.findOne({})
  if (!settings) {
    settings = await PlatformSettings.create({})
  }

  return settings
})
