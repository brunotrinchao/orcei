import { Profile } from '../../../models/Profile'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Não autorizado'
    })
  }

  const existingProfile = await Profile.findOne({ userId: (session.user as any).id })
  if (!existingProfile) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Perfil não encontrado'
    })
  }

  // Limpa os tokens de integração mas mantém o email do login básico
  const googleIntegration = {
    ...(existingProfile.googleIntegration || {}),
    accessToken: undefined,
    refreshToken: undefined,
    expiryDate: undefined,
    driveFolderId: undefined,
    driveProposalsFolderId: undefined,
    driveReportsFolderId: undefined,
    grantedScopes: []
  }

  await Profile.findOneAndUpdate(
    { userId: (session.user as any).id },
    { $set: { googleIntegration } }
  )

  return { success: true, message: 'Integração Google desconectada com sucesso.' }
})
