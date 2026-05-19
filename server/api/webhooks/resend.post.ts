import { Webhook } from 'svix'
import { Proposal } from '../../models/Proposal'
import { ProposalHistory } from '../../models/ProposalHistory'

export default defineEventHandler(async (event) => {
  setResponseStatus(event, 200)
  const body = await readRawBody(event)
  const headers = getHeaders(event)
  const config = useRuntimeConfig()
  
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[Resend Webhook] RESEND_WEBHOOK_SECRET not set')
    throw createError({ statusCode: 500, statusMessage: 'Webhook secret not configured' })
  }

  // Verify signature
  const svix_id = headers['svix-id'] as string
  const svix_timestamp = headers['svix-timestamp'] as string
  const svix_signature = headers['svix-signature'] as string

  if (!svix_id || !svix_timestamp || !svix_signature) {
    throw createError({ statusCode: 400, statusMessage: 'Missing svix headers' })
  }

  const wh = new Webhook(webhookSecret)
  let payload: any

  try {
    payload = wh.verify(body!, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as any
  } catch (err: any) {
    console.error('[Resend Webhook] Signature verification failed:', err.message)
    throw createError({ statusCode: 400, statusMessage: 'Invalid signature' })
  }

  const { type, data } = payload
  const emailId = data.email_id || data.id

  if (!emailId) {
    return { received: true, note: 'No email_id in payload' }
  }

  // Find proposal by lastEmailId
  const proposal = await Proposal.findOne({ lastEmailId: emailId })
  if (!proposal) {
    console.log('[Resend Webhook] Proposal not found for emailId:', emailId)
    return { received: true, note: 'Proposal not found' }
  }

  // Map Resend events to actions
  const actionMap: Record<string, string> = {
    'email.sent': 'sent',
    'email.delivered': 'delivered',
    'email.opened': 'opened',
    'email.clicked': 'clicked',
    'email.bounced': 'bounced',
    'email.complained': 'complained',
    'email.delivery_delayed': 'delayed',
    'email.failed': 'failed',
    'email.received': 'received',
    'email.scheduled': 'scheduled',
    'email.suppressed': 'suppressed'
  }

  const action = actionMap[type]
  if (!action) {
    return { received: true, note: 'Unhandled event type: ' + type }
  }

  // Log History
  await ProposalHistory.create({
    proposalId: proposal._id,
    type: 'email',
    action,
    details: {
      resendEventId: payload.id,
      originalType: type,
      subject: data.subject,
      to: data.to,
      timestamp: data.created_at || new Date()
    }
  })

  // Update Proposal Status
  const statusHierarchy: Record<string, number> = {
    'created': 0,
    'scheduled': 1,
    'sent': 2,
    'received': 3,
    'delivered': 4,
    'viewed': 5,
    'opened': 6,
    'clicked': 7,
    'accepted': 8,
    'expired': 8,
    'bounced': 8,
    'failed': 8,
    'suppressed': 8,
    'delayed': 2 // Consider delayed same level as sent
  }

  const currentStatusLevel = statusHierarchy[proposal.status] || 0
  const newStatusLevel = statusHierarchy[action] || 0

  if (newStatusLevel > currentStatusLevel) {
    await Proposal.findByIdAndUpdate(proposal._id, { status: action })
  } else if (action === 'bounced' || action === 'complained') {
    await Proposal.findByIdAndUpdate(proposal._id, { status: 'bounced' })
  }

  return { received: true }
})
