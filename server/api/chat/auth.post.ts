import { Proposal } from '../../models/Proposal'
import { ProfileService } from '../../services/ProfileService'

export default defineEventHandler(async (event) => {
  const pusher = usePusher()
  if (!pusher) throw createError({ statusCode: 500, statusMessage: 'Pusher not configured' })

  const body = await readBody(event)
  const { socket_id: socketId, channel_name: channelName, chatRole, slug, token } = body

  if (!socketId || !channelName) {
    throw createError({ statusCode: 400, statusMessage: 'Missing socket_id or channel_name' })
  }

  console.log(`[Pusher Auth] Tentando autorizar canal: ${channelName} para papel: ${chatRole || 'desconhecido'}`)

  let authorized = false

  // Case 1: private-proposal-{proposalId}
  const proposalMatch = channelName.match(/^private-proposal-(.+)$/)
  if (proposalMatch) {
    const proposalId = proposalMatch[1]
    const proposal = await Proposal.findById(proposalId)
    if (!proposal) {
      console.error(`[Pusher Auth] Proposta ${proposalId} não encontrada`)
      throw createError({ statusCode: 404, statusMessage: 'Proposal not found' })
    }

    // Freelancer: Se tiver sessão, checa se é o dono
    const session = await getUserSession(event)
    if (session?.user) {
      const profile = await ProfileService.getByUserId((session.user as any).id)
      if (profile && proposal.profileId.toString() === profile._id.toString()) {
        authorized = true
        console.log(`[Pusher Auth] Freelancer autorizado para canal: ${channelName}`)
      }
    }

    // Client: Se não for freelancer, checa via slug/token
    if (!authorized) {
      if (slug === proposal.slug && (!proposal.token || token === proposal.token)) {
        authorized = true
        console.log(`[Pusher Auth] Cliente autorizado via Slug/Token para canal: ${channelName}`)
      } else {
        console.warn(`[Pusher Auth] Cliente negado. Recebido slug=${slug}, token=${token}. Esperado slug=${proposal.slug}`)
      }
    }
  }

  // Case 2: private-profile-{profileId} (Real-time notifications for freelancer)
  const profileMatch = channelName.match(/^private-profile-(.+)$/)
  if (profileMatch) {
    const profileId = profileMatch[1]
    const session = await getUserSession(event)
    if (session?.user) {
      const profile = await ProfileService.getByUserId((session.user as any).id)
      if (profile && profile._id.toString() === profileId) {
        authorized = true
      }
    }
  }

  if (!authorized) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const auth = pusher.authenticate(socketId, channelName)
  return auth
})
