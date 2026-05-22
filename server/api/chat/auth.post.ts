import { Proposal } from '../../models/Proposal'
import { ProfileService } from '../../services/ProfileService'

export default defineEventHandler(async (event) => {
  const pusher = usePusher()
  if (!pusher) throw createError({ statusCode: 500, statusMessage: 'Pusher not configured' })

  const body = await readBody(event)
  const socketId = body.socket_id
  const channelName = body.channel_name

  if (!socketId || !channelName) {
    throw createError({ statusCode: 400, statusMessage: 'Missing socket_id or channel_name' })
  }

  let authorized = false

  // Case 1: private-proposal-{proposalId}
  const proposalMatch = channelName.match(/^private-proposal-(.+)$/)
  if (proposalMatch) {
    const proposalId = proposalMatch[1]
    const proposal = await Proposal.findById(proposalId)
    if (!proposal) throw createError({ statusCode: 404, statusMessage: 'Proposal not found' })

    // Freelancer
    const session = await getUserSession(event)
    if (session?.user) {
      const profile = await ProfileService.getByUserId((session.user as any).id)
      if (profile && proposal.profileId.toString() === profile._id.toString()) {
        authorized = true
      }
    }

    // Client
    if (!authorized) {
      const { slug, token } = body
      if (slug === proposal.slug && (!proposal.token || token === proposal.token)) {
        authorized = true
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
