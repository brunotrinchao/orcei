import { ProposalService } from '../../../services/ProposalService'
import { processVariables } from '../../../utils/variables'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const { t: token, preview, consent } = getQuery(event)
  const isPreviewRequest = preview === 'true'
  const hasConsent = consent === 'accepted'

  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing Slug' })

  const proposal = await ProposalService.getBySlug(slug)
  if (!proposal) throw createError({ statusCode: 404, statusMessage: 'Proposal not found' })

  // SEGURANÇA: Verificar se é o dono tentando dar preview ou se tem o token correto
  const session = await getUserSession(event)
  const profile = (proposal as any).profileId
  
  if (isPreviewRequest) {
    // Se for preview, PRECISA estar logado e ser o dono (comparando userId do Google)
    const isOwner = session?.user && (session.user as any).id === profile?.userId
    if (!isOwner) {
      throw createError({ statusCode: 403, statusMessage: 'Acesso Negado: Preview permitido apenas ao proprietário' })
    }
  } else {
    // Se não for preview, valida o token público obrigatoriamente
    if (!proposal.token || proposal.token !== token) {
      throw createError({ statusCode: 403, statusMessage: 'Acesso Negado: Token Inválido ou Expirado' })
    }
  }

  if (profile) {
    proposal.contractText = processVariables(proposal.contractText || '', proposal as any, profile as any)
    proposal.termsAndConditions = processVariables(proposal.termsAndConditions || '', proposal as any, profile as any)
  }

  // Log view event only if consent is given and NOT owner preview
  if (!isPreviewRequest && hasConsent) {
    const headers = getHeaders(event)
    await ProposalService.logHistory(proposal._id as any, 'viewed', 'system', {
      ip: headers['x-forwarded-for'] || headers['x-real-ip'],
      userAgent: headers['user-agent']
    })

    // If it was just created or sent/delivered, move to viewed
    const statusHierarchy: Record<string, number> = {
      'created': 0,
      'sent': 1,
      'delivered': 2,
      'viewed': 3,
      'opened': 4,
      'clicked': 5
    }
    const currentStatusLevel = statusHierarchy[proposal.status] || 0
    const viewedLevel = statusHierarchy['viewed']
    
    if (viewedLevel > currentStatusLevel) {
      await ProposalService.updateStatus(proposal.slug, 'viewed')
    }
  }

  // Adicionar contagem de mensagens não lidas para o cliente
  const { ProposalMessage } = await import('../../../models/ProposalMessage')
  const unreadCount = await ProposalMessage.countDocuments({
    proposalId: proposal._id,
    sender: 'freelancer',
    read: false
  })

  return {
    ...proposal.toObject ? proposal.toObject() : proposal,
    unreadMessages: unreadCount
  }
})
