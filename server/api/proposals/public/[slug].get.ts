import { timingSafeEqual } from 'node:crypto'
import { ProposalService } from '../../../services/ProposalService'
import { processVariables } from '../../../utils/variables'
import { checkRateLimit } from '../../../utils/rate-limit'
import sanitizeHtml from 'sanitize-html'

const sanitizeOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
    'nl', 'li', 'ins', 'del', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
    'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'span'
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target'],
    span: ['style', 'class'],
    p: ['style', 'class'],
    div: ['style', 'class'],
    table: ['style', 'class'],
    tr: ['style', 'class'],
    td: ['style', 'class']
  },
  allowedStyles: {
    '*': {
      'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
      'color': [/^#(?:[0-9a-fA-F]{3}){1,2}$/, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/],
      'background-color': [/^#(?:[0-9a-fA-F]{3}){1,2}$/, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/],
      'font-size': [/^\d+(?:px|em|rem|%)$/],
      'font-weight': [/^bold$/, /^normal$/, /^\d+$/],
      'padding-left': [/^\d+(?:px|em|rem|%)$/]
    }
  }
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const { t: token, preview, consent } = getQuery(event)
  const isPreviewRequest = preview === 'true'
  const hasConsent = consent === 'accepted'

  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing Slug' })

  await checkRateLimit(event, { max: 60, windowMs: 60 * 1000, keyPrefix: 'public-proposal-view' })

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
    if (!proposal.token || !token || !timingSafeEqual(Buffer.from(String(proposal.token)), Buffer.from(String(token)))) {
      throw createError({ statusCode: 403, statusMessage: 'Acesso Negado: Token Inválido ou Expirado' })
    }
  }

  if (profile) {
    proposal.contractText = sanitizeHtml(processVariables(proposal.contractText || '', proposal as any, profile as any), sanitizeOptions)
    proposal.termsAndConditions = sanitizeHtml(processVariables(proposal.termsAndConditions || '', proposal as any, profile as any), sanitizeOptions)
  }

  // Log view event only if consent is given and NOT owner preview
  if (!isPreviewRequest && hasConsent) {
    const headers = getHeaders(event)
    const ip = headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown'
    const browser = headers['user-agent'] || 'unknown'
    
    await ProposalService.logHistory(proposal._id as any, 'viewed', 'system', {
      ip,
      userAgent: browser
    })

    // Adiciona ao array nativo de views para telemetria no dashboard
    proposal.views.push({ ip, browser, location: 'Desconhecido', createdAt: new Date() })
    await proposal.save()

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
