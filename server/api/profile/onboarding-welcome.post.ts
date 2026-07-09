import { z } from 'zod'
import { Profile } from '../../models/Profile'
import { TOUR_IDS } from '../../utils/onboardingTours'

const schema = z.object({ accepted: z.boolean() })

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  const { accepted } = schema.parse(await readBody(event))

  const update: Record<string, unknown> = { $set: { onboardingWelcomeSeen: true } }
  // Se recusou o tour, marca todas as telas como concluídas para não perguntar/auto-iniciar de novo
  if (!accepted) {
    update.$addToSet = { onboardingCompletedTours: { $each: TOUR_IDS } }
  }

  const profile = await Profile.findOneAndUpdate(
    { userId: (session.user as any).id },
    update,
    { returnDocument: 'after' }
  )

  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })
  }

  return profile
})
