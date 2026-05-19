import { Profile } from '../../models/Profile'
import { Client } from '../../models/Client'
import { Proposal } from '../../models/Proposal'
import { CatalogItem } from '../../models/CatalogItem'
import { Event } from '../../models/Event'
import { Counter } from '../../models/Counter'
import { AuditLog } from '../../models/AuditLog'
import { useStripe } from '../../utils/stripe'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  const userId = (session.user as any).id
  const profile = await Profile.findOne({ userId })
  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })
  }

  // 1. Impedir exclusão se houver assinatura ativa
  const hasActiveSub = 
    profile.subscriptionPlan !== 'free' && 
    ['active', 'trialing', 'past_due'].includes(profile.subscriptionStatus || '')

  if (hasActiveSub) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'Você possui um plano ativo. Cancele sua assinatura antes de excluir a conta.' 
    })
  }

  // Log de Auditoria
  await AuditLog.create({
    adminId: userId,
    adminName: profile.name,
    action: 'ACCOUNT_DELETE',
    targetId: profile._id.toString(),
    targetType: 'User',
    details: { email: profile.email },
    ip: event.node.req.socket.remoteAddress
  })

  // 2. Deletar dados vinculados
  await Promise.all([
    Client.deleteMany({ profileId: profile._id }),
    Proposal.deleteMany({ profileId: profile._id }),
    CatalogItem.deleteMany({ profileId: profile._id }),
    Event.deleteMany({ profileId: profile._id }),
    Counter.deleteMany({ profileId: profile._id })
  ])

  // 3. Marcar perfil como deletado e limpar dados sensíveis
  // Mantemos email, userId e NOME para auditoria.
  // Mantemos creditsBalance e creditsUsed para quando o usuário voltar.
  await Profile.findByIdAndUpdate(profile._id, {
    isDeleted: true,
    deletedAt: new Date(),
    // name: Mantido original
    avatar: null,
    brandConfig: { logoUrl: null, primaryColor: '#3B82F6' },
    address: { street: '---', neighborhood: '---', city: '---', state: '---', zip: '---' },
    company: { taxId: '---', legalName: '---', tradeName: '---' },
    contact: { phones: [], social: { instagram: null, youtube: null } },
    subscriptionPlan: 'free',
    subscriptionStatus: 'canceled'
    // creditsBalance: Mantido para uso futuro
  })

  // 4. Limpar sessão
  await clearUserSession(event)

  return { success: true, message: 'Conta excluída com sucesso.' }
})
