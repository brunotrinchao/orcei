import { Profile } from '../../models/Profile'
import { QueueService } from '../../services/QueueService'
import { AuditService } from '../../services/AuditService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  const body = await readBody(event)
  
  const updateData: any = { 
    name: body.name,
    brandConfig: body.brandConfig,
    address: body.address,
    company: body.company,
    contact: body.contact,
    defaultValidityDays: body.defaultValidityDays,
    defaultInstallments: body.defaultInstallments,
    defaultCashDiscount: body.defaultCashDiscount,
    defaultContractTemplate: body.defaultContractTemplate,
    defaultTermsAndConditions: body.defaultTermsAndConditions
  }

  // Permitir desconectar Google Integration enviando null
  if (body.googleIntegration === null) {
    updateData.googleIntegration = null
  }

  const profile = await Profile.findOneAndUpdate(
    { userId: (session.user as any).id },
    updateData,
    { returnDocument: 'after', runValidators: true }
  )

  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })
  }

  // 1. Registrar Auditoria Assíncrona
  await AuditService.log({
    adminId: profile._id.toString(),
    adminName: profile.name,
    action: 'UPDATE_PROFILE',
    targetId: profile._id.toString(),
    targetType: 'Profile',
    ip: event.node.req.socket.remoteAddress
  })

  return profile
})
