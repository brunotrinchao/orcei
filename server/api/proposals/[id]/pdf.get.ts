import { Proposal } from '../../../models/Proposal'
import { Profile } from '../../../models/Profile'
import { generateProposalPdfBuffer } from '../../../utils/pdf'
import { GoogleService, GOOGLE_SCOPES, hasGoogleScope } from '../../../services/GoogleService'

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
  let pdfBuffer: Buffer

  // Se o arquivo já foi enviado ao Drive, fazer download de lá (sem regerar)
  if ((proposal as any).driveFileId && hasGoogleScope(profile, GOOGLE_SCOPES.DRIVE)) {
    try {
      const auth = GoogleService.getAuthClient(profile)
      pdfBuffer = await GoogleService.downloadFile(auth, (proposal as any).driveFileId)
    } catch (driveErr) {
      console.warn('[pdf.get] Falha ao baixar do Drive, gerando localmente:', driveErr)
      pdfBuffer = await generateProposalPdfBuffer(proposal, profile, config.appName)
    }
  } else {
    // Fallback: gerar localmente (usuário sem integração Google ou proposta ainda não enviada)
    pdfBuffer = await generateProposalPdfBuffer(proposal, profile, config.appName)
  }

  const fileName = `orcamento-${(proposal as any).code?.replace('#', '') || (proposal as any).slug}.pdf`
  event.node.res.setHeader('Content-Type', 'application/pdf')
  event.node.res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)

  return pdfBuffer
})

