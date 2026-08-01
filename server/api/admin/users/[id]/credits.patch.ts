import { Profile } from '../../../../models/Profile'
import { AuditLog } from '../../../../models/AuditLog'
import { throwIfInvalid, type ValidationError } from '../../../../utils/validate'

function validateCreditsUpdate(body: any): ValidationError[] {
  const errors: ValidationError[] = []
  const amountNum = Number(body?.amount)

  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    errors.push({ field: 'amount', message: 'Quantidade deve ser um número maior que zero' })
  }
  if (!['add', 'remove', 'set'].includes(body?.action)) {
    errors.push({ field: 'action', message: 'Ação deve ser "add", "remove" ou "set"' })
  }

  return errors
}

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user || (session.user as any).role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado' })
  }

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  throwIfInvalid(validateCreditsUpdate(body))

  const amount = Number(body.amount)
  const action: 'add' | 'remove' | 'set' = body.action

  const oldProfile = await Profile.findById(id).lean()
  if (!oldProfile) {
    throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado' })
  }
  const oldBalance = (oldProfile as any).creditsBalance

  // Updates atômicos — evita race condition de leitura+escrita separadas
  // (mesmo padrão de server/utils/credits.ts::chargeCredit).
  let updatedUser
  if (action === 'set') {
    updatedUser = await Profile.findByIdAndUpdate(
      id,
      { $set: { creditsBalance: Math.max(0, Math.floor(amount)) } },
      { returnDocument: 'after' }
    )
  } else if (action === 'add') {
    updatedUser = await Profile.findByIdAndUpdate(
      id,
      { $inc: { creditsBalance: Math.floor(amount) } },
      { returnDocument: 'after' }
    )
  } else {
    // remove — guarda $gte atômica: nunca deixa o saldo ficar negativo
    updatedUser = await Profile.findOneAndUpdate(
      { _id: id, creditsBalance: { $gte: amount } },
      { $inc: { creditsBalance: -Math.floor(amount) } },
      { returnDocument: 'after' }
    )
    if (!updatedUser) {
      throw createError({ statusCode: 422, statusMessage: 'Saldo insuficiente para remover essa quantidade' })
    }
  }

  if (!updatedUser) {
    throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado' })
  }

  // Log de Auditoria
  await AuditLog.create({
    adminId: (session.user as any).id,
    adminName: session.user.name,
    action: 'UPDATE_CREDITS',
    targetId: updatedUser._id,
    targetType: 'User',
    details: {
      oldBalance,
      newBalance: updatedUser.creditsBalance,
      amount,
      actionType: action
    },
    ip: event.node.req.socket.remoteAddress
  })

  return { success: true, newBalance: updatedUser.creditsBalance }
})
