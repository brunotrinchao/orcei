import { Consent } from '../../models/Consent'
import { ProfileService } from '../../services/ProfileService'

export default defineEventHandler(async (event) => {
  const { sessionId, status } = await readBody(event)

  if (!sessionId || !['accepted', 'rejected'].includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'Dados inválidos' })
  }

  const ip = getRequestHeader(event, 'x-forwarded-for') || getRequestHeader(event, 'x-real-ip') || ''
  const userAgent = getRequestHeader(event, 'user-agent') || ''

  // Tenta vincular ao perfil se sessão autenticada
  let profileId: any = undefined
  try {
    const session = await getUserSession(event)
    if (session?.user) {
      const profile = await ProfileService.getByUserId((session.user as any).id)
      if (profile) profileId = profile._id
    }
  } catch {}

  await Consent.findOneAndUpdate(
    { sessionId },
    { sessionId, status, ip, userAgent, profileId },
    { upsert: true, returnDocument: 'after' }
  )

  return { ok: true }
})
