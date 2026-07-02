import { useStripe } from '../../../utils/stripe'
import { AuditLog } from '../../../models/AuditLog'
import { sanitizeError } from '../../../utils/error-handler'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user || (session.user as any).role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado' })
  }

  const id = getRouterParam(event, 'id')
  const stripe = useStripe()
  try {
    await stripe.promotionCodes.update(id!, { active: false })

    await AuditLog.create({
      adminId: (session.user as any).id,
      adminName: session.user.name,
      action: 'DEACTIVATE_COUPON',
      targetId: id,
      targetType: 'Coupon',
      details: {},
      ip: event.node.req.socket.remoteAddress
    })

    return { success: true }
  } catch (e: any) {
    throw sanitizeError(e, 'Erro ao excluir cupom')
  }
})
