import { ProfileService } from '../../../services/ProfileService'
import { AuditLog } from '../../../models/AuditLog'
import { sanitizeError } from '../../../utils/error-handler'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })
  if (!session.impersonatedBy) {
    throw createError({ statusCode: 400, statusMessage: 'Nenhuma personificação em andamento' })
  }

  try {
    const admin = await ProfileService.getByUserId(session.impersonatedBy.id)
    if (!admin) throw createError({ statusCode: 404, statusMessage: 'Administrador original não encontrado' })

    const impersonatedUserId = (session.user as any).id

    await replaceUserSession(event, {
      user: {
        id: admin.userId,
        name: admin.name,
        email: admin.email,
        avatar: admin.avatar,
        role: admin.role,
        creditsBalance: admin.creditsBalance
      },
      loggedInAt: session.loggedInAt,
      impersonatedBy: null
    })

    await AuditLog.create({
      adminId: admin.userId,
      adminName: admin.name,
      action: 'STOP_IMPERSONATE_USER',
      targetId: impersonatedUserId,
      targetType: 'User',
      details: {},
      ip: event.node.req.socket.remoteAddress
    })

    return { success: true }
  } catch (e: any) {
    if (e.statusCode) throw e
    throw sanitizeError(e, 'Erro ao encerrar personificação')
  }
})
