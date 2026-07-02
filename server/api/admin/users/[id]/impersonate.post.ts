import { Profile } from '../../../../models/Profile'
import { AuditLog } from '../../../../models/AuditLog'
import { sanitizeError } from '../../../../utils/error-handler'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user || (session.user as any).role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado' })
  }
  if (session.impersonatedBy) {
    throw createError({ statusCode: 409, statusMessage: 'Encerre a personificação atual antes de iniciar outra' })
  }

  const id = getRouterParam(event, 'id')
  try {
    const target = await Profile.findById(id)
    if (!target) throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado' })
    if (target.role === 'admin') {
      throw createError({ statusCode: 422, statusMessage: 'Não é possível personificar outro administrador' })
    }

    const admin = session.user as any

    await replaceUserSession(event, {
      user: {
        id: target.userId,
        name: target.name,
        email: target.email,
        avatar: target.avatar,
        role: target.role,
        creditsBalance: target.creditsBalance
      },
      loggedInAt: session.loggedInAt,
      impersonatedBy: { id: admin.id, name: admin.name }
    })

    await AuditLog.create({
      adminId: admin.id,
      adminName: admin.name,
      action: 'IMPERSONATE_USER',
      targetId: target._id.toString(),
      targetType: 'User',
      details: { targetEmail: target.email },
      ip: event.node.req.socket.remoteAddress
    })

    return { success: true }
  } catch (e: any) {
    if (e.statusCode) throw e
    throw sanitizeError(e, 'Erro ao personificar usuário')
  }
})
