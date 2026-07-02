import { useStripe } from '../../../utils/stripe'
import { AuditLog } from '../../../models/AuditLog'
import { sanitizeError } from '../../../utils/error-handler'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user || (session.user as any).role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado' })
  }

  const id = getRouterParam(event, 'id')
  const { credits, active, audience } = await readBody(event)
  const validAudiences = ['all', 'new', 'existing']

  const stripe = useStripe()
  try {
    const promo = await stripe.promotionCodes.retrieve(id!, { expand: ['coupon'] })
    const currentMeta: any = promo.coupon.metadata || {}
    const newMeta = { ...currentMeta }
    if (typeof credits === 'number' && credits > 0) newMeta.value = String(credits)
    if (validAudiences.includes(audience)) newMeta.audience = audience

    if (newMeta.value !== currentMeta.value || newMeta.audience !== currentMeta.audience) {
      await stripe.coupons.update(promo.coupon.id, { metadata: newMeta })
    }
    if (typeof active === 'boolean') {
      await stripe.promotionCodes.update(id!, { active })
    }

    await AuditLog.create({
      adminId: (session.user as any).id,
      adminName: session.user.name,
      action: 'UPDATE_COUPON',
      targetId: id,
      targetType: 'Coupon',
      details: { credits, active, audience },
      ip: event.node.req.socket.remoteAddress
    })

    return { success: true }
  } catch (e: any) {
    if (e.statusCode) throw e
    throw sanitizeError(e, 'Erro ao atualizar cupom')
  }
})
