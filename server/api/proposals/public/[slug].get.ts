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
  
  const tokenStr = String(token || '')
  const propTokenStr = String(proposal.token || '')
  const hasValidToken = propTokenStr && tokenStr && propTokenStr.length === tokenStr.length && timingSafeEqual(Buffer.from(propTokenStr), Buffer.from(tokenStr))

  if (isPreviewRequest) {
    // Se for preview, PRECISA estar logado e ser o dono OU ter o token correto na URL
    const isOwner = session?.user && (session.user as any).id === profile?.userId
    
    if (!isOwner && !hasValidToken) {
      throw createError({ statusCode: 403, statusMessage: 'Acesso Negado: Preview permitido apenas ao proprietário ou via token de acesso' })
    }
  } else {
    // Se não for preview, valida o token público obrigatoriamente
    if (!proposal.token || !token || !hasValidToken) {
      throw createError({ statusCode: 403, statusMessage: 'Acesso Negado: Token Inválido ou Expirado' })
    }
  }

  if (profile) {
    proposal.contractText = sanitizeHtml(processVariables(proposal.contractText || '', proposal as any, profile as any), sanitizeOptions)
    proposal.termsAndConditions = sanitizeHtml(processVariables(proposal.termsAndConditions || '', proposal as any, profile as any), sanitizeOptions)
  }

  // Log view event for non-owner public proposal accesses
  if (!isPreviewRequest) {
    const headers = getHeaders(event)
    const rawIp = headers['x-forwarded-for'] || headers['x-real-ip'] || '127.0.0.1'
    const ip = Array.isArray(rawIp) ? rawIp[0] : String(rawIp).split(',')[0].trim()
    const browser = (headers['user-agent'] as string) || 'unknown'
    
    await ProposalService.logHistory(proposal._id as any, 'viewed', 'system', {
      ip,
      userAgent: browser
    })

    // Adiciona ao array nativo de views para telemetria no dashboard
    if (!proposal.views) {
      proposal.views = [] as any
    }
    proposal.views.push({ ip, browser, location: 'Desconhecido', createdAt: new Date() })
    await proposal.save()

    // Se o status anterior era inicial (created, sent, delivered), atualiza para viewed
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

  const responseObj: any = proposal.toObject ? proposal.toObject() : proposal
  delete responseObj.token

  return {
    ...responseObj,
    unreadMessages: unreadCount
  }
})
