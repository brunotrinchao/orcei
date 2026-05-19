import { Profile } from '../../../../models/Profile'
import { AuditLog } from '../../../../models/AuditLog'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user || (session.user as any).role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado' })
  }

  const id = getRouterParam(event, 'id')
  const { amount, action } = await readBody(event) // action: 'add' | 'remove' | 'set'

  const user = await Profile.findById(id)
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado' })
  }

  const oldBalance = user.creditsBalance
  let newBalance = oldBalance

  if (action === 'add') newBalance += amount
  else if (action === 'remove') newBalance -= amount
  else if (action === 'set') newBalance = amount

  const updatedUser = await Profile.findByIdAndUpdate(
    id,
    { $set: { creditsBalance: Math.max(0, newBalance) } },
    { returnDocument: 'after' }
  )

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
