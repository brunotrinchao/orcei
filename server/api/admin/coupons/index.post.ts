import { useStripe } from '../../../utils/stripe'
import { AuditLog } from '../../../models/AuditLog'
import { sanitizeError } from '../../../utils/error-handler'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user || (session.user as any).role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado' })
  }

  const { code, credits, expiresAt, maxRedemptions, audience } = await readBody(event)
  if (!code?.trim()) throw createError({ statusCode: 400, statusMessage: 'Informe o código do cupom' })
  if (!credits || credits <= 0) throw createError({ statusCode: 400, statusMessage: 'Informe a quantidade de créditos' })

  const validAudiences = ['all', 'new', 'existing']
  const finalAudience = validAudiences.includes(audience) ? audience : 'all'

  const stripe = useStripe()
  try {
    const coupon = await stripe.coupons.create({
      duration: 'once',
      percent_off: 100,
      metadata: { type: 'promotion', value: String(credits), audience: finalAudience }
    })

    const promo = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: code.trim().toUpperCase(),
      active: true,
      ...(expiresAt ? { expires_at: Math.floor(new Date(expiresAt).getTime() / 1000) } : {}),
      ...(maxRedemptions ? { max_redemptions: maxRedemptions } : {})
    })

    await AuditLog.create({
      adminId: (session.user as any).id,
      adminName: session.user.name,
      action: 'CREATE_COUPON',
      targetId: promo.id,
      targetType: 'Coupon',
      details: { code: promo.code, credits, expiresAt, maxRedemptions, audience: finalAudience },
      ip: event.node.req.socket.remoteAddress
    })

    return { success: true, id: promo.id }
  } catch (e: any) {
    if (e.code === 'resource_already_exists' || e.raw?.code === 'resource_already_exists') {
      throw createError({ statusCode: 409, statusMessage: 'Já existe um cupom ativo com esse código' })
    }
    throw sanitizeError(e, 'Erro ao criar cupom')
  }
})
