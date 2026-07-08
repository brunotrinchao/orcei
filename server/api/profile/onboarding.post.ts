import { z } from 'zod'
import { Profile } from '../../models/Profile'
import { TOUR_IDS } from '../../utils/onboardingTours'

const schema = z.object({ tourId: z.enum(TOUR_IDS) })

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  const { tourId } = schema.parse(await readBody(event))

  const profile = await Profile.findOneAndUpdate(
    { userId: (session.user as any).id },
    { $addToSet: { onboardingCompletedTours: tourId } },
    { returnDocument: 'after' }
  )

  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })
  }

  return profile
})
