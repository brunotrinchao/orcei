import { Proposal } from '../../../models/Proposal'
import { Profile } from '../../../models/Profile'
import { generateProposalPdfBuffer } from '../../../utils/pdf'
import { GoogleService, GOOGLE_SCOPES, hasGoogleScope } from '../../../services/GoogleService'
import { AssinafyService } from '../../../services/AssinafyService'

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
  const proposal: any = await Proposal.findOne({ _id: id, profileId: profile._id })
  if (!proposal) {
    throw createError({ statusCode: 404, statusMessage: 'Proposta não encontrada' })
  }

  const config = useRuntimeConfig()
  let pdfBuffer: Buffer | null = null

  const isSignedOrAccepted =
    proposal.signature?.status === 'signed' ||
    proposal.status === 'accepted' ||
    !!proposal.signature?.documentId

  // 1. Tenta baixar o PDF assinado oficial diretamente do Assinafy via documentId
  if (proposal.signature?.documentId) {
    try {
      pdfBuffer = await AssinafyService.downloadSignedDocument(proposal.signature.documentId)
      if (pdfBuffer && pdfBuffer.length > 0) {
        proposal.signature = proposal.signature || {}
        proposal.signature.status = 'signed'
        proposal.status = 'accepted'
        await Proposal.updateOne(
          { _id: proposal._id },
          { status: 'accepted', 'signature.status': 'signed' }
        )

        const fileName = `orcamento-${proposal.code?.replace('#', '') || proposal.slug}-assinado.pdf`
        event.node.res.setHeader('Content-Type', 'application/pdf')
        event.node.res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
        return pdfBuffer
      }
    } catch (assinafyErr) {
      console.warn('[pdf.get] Falha ao baixar PDF assinado do Assinafy:', assinafyErr)
    }
  }

  // 2. Se a proposta tem URL de arquivo assinado direta
  if (proposal.signature?.signedFileUrl) {
    try {
      const resp = await fetch(proposal.signature.signedFileUrl)
      if (resp.ok) {
        const arrayBuffer = await resp.arrayBuffer()
        pdfBuffer = Buffer.from(arrayBuffer)
        const fileName = `orcamento-${proposal.code?.replace('#', '') || proposal.slug}-assinado.pdf`
        event.node.res.setHeader('Content-Type', 'application/pdf')
        event.node.res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
        return pdfBuffer
      }
    } catch (signedErr) {
      console.warn('[pdf.get] Falha ao baixar de signedFileUrl:', signedErr)
    }
  }

  // 3. Se o arquivo já foi enviado ao Drive, fazer download de lá (sem regerar)
  if (proposal.driveFileId && hasGoogleScope(profile, GOOGLE_SCOPES.DRIVE)) {
    try {
      const auth = GoogleService.getAuthClient(profile)
      pdfBuffer = await GoogleService.downloadFile(auth, proposal.driveFileId)
    } catch (driveErr) {
      console.warn('[pdf.get] Falha ao baixar do Drive, gerando localmente:', driveErr)
      pdfBuffer = await generateProposalPdfBuffer(proposal, profile, config.appName)
    }
  } else {
    // 4. Fallback: gerar localmente
    pdfBuffer = await generateProposalPdfBuffer(proposal, profile, config.appName)
  }

  const fileName = `orcamento-${proposal.code?.replace('#', '') || proposal.slug}.pdf`
  event.node.res.setHeader('Content-Type', 'application/pdf')
  event.node.res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)

  return pdfBuffer
})

