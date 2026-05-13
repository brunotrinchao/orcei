import { Profile } from '../../models/Profile'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  const body = await readBody(event)
  
  const profile = await Profile.findOneAndUpdate(
    { userId: session.user.id },
    { 
      name: body.name,
      brandConfig: body.brandConfig,
      defaultContractTemplate: body.defaultContractTemplate,
      defaultTermsAndConditions: body.defaultTermsAndConditions
    },
    { new: true, runValidators: true }
  )

  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })
  }

  return profile
})
