import { Proposal } from '../../../models/Proposal'
import { Profile } from '../../../models/Profile'
import { generateProposalPdfBuffer } from '../../../utils/pdf'

export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string }
  const session = await getUserSession(event)

  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  // Buscar perfil para pegar o _id real do MongoDB
  const profile = await Profile.findOne({ userId: (session.user as any).id }).lean()
  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })
  }

  // SEGURANÇA: Filtrar pelo ID da proposta E pelo profileId do usuário logado
  const proposal = await Proposal.findOne({ _id: id, profileId: profile._id }).lean()
  if (!proposal) {
    throw createError({ statusCode: 404, statusMessage: 'Proposta não encontrada' })
  }

  const config = useRuntimeConfig()
  const pdf = await generateProposalPdfBuffer(proposal, profile, config.appName)

  event.node.res.setHeader('Content-Type', 'application/pdf')
  event.node.res.setHeader('Content-Disposition', `attachment; filename=proposta-${proposal.slug}.pdf`)

  return pdf
})
