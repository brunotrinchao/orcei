import { PlatformSettings } from '../../models/PlatformSettings'
import { AuditLog } from '../../models/AuditLog'
import { sanitizeCreditCosts, sanitizeInitialCredits, clearSettingsCache } from '../../utils/credits'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user || (session.user as any).role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado' })
  }

  const body = await readBody(event)
  
  const settings = await PlatformSettings.findOneAndUpdate(
    {},
    {
      maintenanceMode: body.maintenanceMode,
      footerText: body.footerText,
      landingPage: body.landingPage,
      systemStatus: body.systemStatus,
      creditCosts: sanitizeCreditCosts(body.creditCosts),
      initialCredits: sanitizeInitialCredits(body.initialCredits)
    },
    { upsert: true, returnDocument: 'after' }
  )

  clearSettingsCache()

  // Log de Auditoria
  await AuditLog.create({
    adminId: (session.user as any).id,
    adminName: session.user.name,
    action: 'UPDATE_SETTINGS',
    targetType: 'Settings',
    details: body,
    ip: event.node.req.socket.remoteAddress
  })

  return settings
})
