import { ProfileService } from '../../../services/ProfileService'
import { AuditLog } from '../../../models/AuditLog'
import { sanitizeError } from '../../../utils/error-handler'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  // Idempotente: se não há personificação, responde 200 — evita erro no
  // cliente quando a flag local está desatualizada (cache de sessão).
  if (!session.impersonatedBy) {
    return { success: true, alreadyEnded: true }
  }

  try {
    const impersonatedUserId = (session.user as any).id

    // Tenta restaurar os dados completos do admin original via perfil.
    // Fallback: se o perfil não for encontrado (excluído ou id divergente),
    // restaura a sessão mesmo assim — o usuário nunca fica preso na personificação.
    const admin = await ProfileService.getByUserId(session.impersonatedBy.id)

    const restoredUser = admin
      ? {
          id: admin.userId,
          name: admin.name,
          email: admin.email,
          avatar: admin.avatar,
          role: admin.role,
          creditsBalance: admin.creditsBalance
        }
      : {
          id: session.impersonatedBy.id,
          name: session.impersonatedBy.name || 'Administrador',
          email: (session.user as any).email || '',
          avatar: (session.user as any).avatar || (session.user as any).picture || null,
          role: 'admin' as const,
          creditsBalance: (session.user as any).creditsBalance || 0
        }

    await replaceUserSession(event, {
      user: restoredUser,
      loggedInAt: session.loggedInAt,
      impersonatedBy: null
    })

    await AuditLog.create({
      adminId: restoredUser.id,
      adminName: restoredUser.name,
      action: 'STOP_IMPERSONATE_USER',
      targetId: impersonatedUserId,
      targetType: 'User',
      details: { fallback: !admin },
      ip: event.node.req.socket.remoteAddress
    })

    return { success: true, fallback: !admin }
  } catch (e: any) {
    if (e.statusCode) throw e
    throw sanitizeError(e, 'Erro ao encerrar personificação')
  }
})
