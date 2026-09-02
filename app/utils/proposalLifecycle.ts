/**
 * Proposal Lifecycle — fonte de verdade das fases do orçamento e ações permitidas.
 *
 * 19 statuses de telemetria são agrupados em 5 fases para o usuário:
 * Rascunho → Em andamento → Assinatura → Fechado | Falhou/Cancelado
 */

export type ProposalPhase = 'draft' | 'progress' | 'signature' | 'closed' | 'failed'

export type ProposalAction =
  | 'edit'
  | 'delete'
  | 'send'
  | 'resend'
  | 'whatsapp'
  | 'download'
  | 'history'
  | 'chat'
  | 'public_link'
  | 'request_signature'
  | 'edit_contract'
  | 'renew'

export interface ProposalPhaseInfo {
  key: ProposalPhase
  label: string
  order: number
}

export const PROPOSAL_PHASES: ProposalPhaseInfo[] = [
  { key: 'draft', label: 'Rascunho', order: 1 },
  { key: 'progress', label: 'Em andamento', order: 2 },
  { key: 'signature', label: 'Assinatura', order: 3 },
  { key: 'closed', label: 'Fechado', order: 4 },
  { key: 'failed', label: 'Falhou / Cancelado', order: 5 }
]

export const PHASE_BY_STATUS: Record<string, ProposalPhase> = {
  // Rascunho
  draft: 'draft',
  // Em andamento
  created: 'progress',
  scheduled: 'progress',
  sent: 'progress',
  delivered: 'progress',
  received: 'progress',
  opened: 'progress',
  clicked: 'progress',
  viewed: 'progress',
  pending: 'progress',
  // Assinatura
  pending_signature: 'signature',
  signing: 'signature',
  // Fechado
  signed: 'closed',
  accepted: 'closed',
  // Falhou / Cancelado
  expired: 'failed',
  rejected: 'failed',
  bounced: 'failed',
  failed: 'failed',
  suppressed: 'failed',
  delayed: 'failed',
  declined: 'failed'
}

export function getProposalPhase(status: string | null | undefined, signatureStatus?: string | null): ProposalPhase {
  if (!status) return 'draft'
  // Assinatura só tem precedência APÓS o aceite (aceite → link → assinatura).
  // Assinatura pendente sem aceite = estado legado/inconsistente → mostra fase real do status.
  const isSignedFlow = status === 'accepted' && (signatureStatus === 'pending' || signatureStatus === 'signing')
  if (isSignedFlow) return 'signature'
  return PHASE_BY_STATUS[status] || 'progress'
}

export function getPhaseInfo(phase: ProposalPhase): ProposalPhaseInfo {
  return PROPOSAL_PHASES.find((p) => p.key === phase) || PROPOSAL_PHASES[1]
}

export function getPhaseBadgeVariant(phase: ProposalPhase): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (phase) {
    case 'draft':
      return 'default'
    case 'progress':
      return 'info'
    case 'signature':
      return 'warning'
    case 'closed':
      return 'success'
    case 'failed':
      return 'error'
  }
}

/** Dots do stepper (flat, sem sombra) */
export function getPhaseColor(phase: ProposalPhase): string {
  switch (phase) {
    case 'draft':
      return 'bg-gray-400 dark:bg-gray-500'
    case 'progress':
      return 'bg-blue-500 dark:bg-blue-500'
    case 'signature':
      return 'bg-amber-500 dark:bg-amber-500'
    case 'closed':
      return 'bg-emerald-500 dark:bg-emerald-500'
    case 'failed':
      return 'bg-red-500 dark:bg-red-500'
  }
}

interface PhaseStepperState {
  current: number
  doneCount: number
  phases: ProposalPhase[]
}

/**
 * Estado do stepper:
 * - `current`: fase atual (dot destacado).
 * - `doneCount`: quantas fases foram REALMENTE concluídas. Falha/cancelamento não
 *   implica passar pelas etapas seguintes (ex: expirado veio de Em andamento —
 *   Assinatura e Fechado nunca ocorreram).
 */
export function getPhaseStepper(status: string | null | undefined, signatureStatus?: string | null): PhaseStepperState {
  const phase = getProposalPhase(status, signatureStatus)
  const current = PROPOSAL_PHASES.findIndex((p) => p.key === phase)

  let doneCount: number
  switch (phase) {
    case 'draft':
      doneCount = 0
      break
    case 'progress':
      doneCount = 1 // Rascunho concluído
      break
    case 'signature':
      doneCount = 2 // Rascunho + Em andamento
      break
    case 'closed':
      doneCount = 3 // Rascunho + Em andamento + Assinatura
      break
    case 'failed':
      // Falha veio de Em andamento (envio/expiração) ou, se assinatura recusada, de Assinatura
      doneCount = signatureStatus === 'rejected' ? 3 : 2
      break
  }

  return {
    current: current === -1 ? 0 : current,
    doneCount,
    phases: PROPOSAL_PHASES.map((p) => p.key)
  }
}

/**
 * Ações permitidas por status (assinatura) do orçamento.
 * Preserva o comportamento atual do frontend; corrige gaps (signed bloqueia edit/delete).
 */
export function getAllowedActions(status: string | null | undefined, signatureStatus?: string | null, expiresAt?: string | Date | null): ProposalAction[] {
  const st = status || ''
  const actions = new Set<ProposalAction>(['download', 'history'])

  // Renovar: expirado por status OU vencido por data (não aceito/assinado)
  const isExpiredByDate = !!expiresAt && st !== 'accepted' && st !== 'signed' && new Date(expiresAt).getTime() <= Date.now()
  if (st === 'expired' || isExpiredByDate) {
    actions.add('renew')
  }

  // Edit / Delete — bloqueados p/ fechado
  if (st !== 'accepted' && st !== 'signed') {
    actions.add('edit')
    actions.add('delete')
  }

  // Enviar (Criar e Enviar)
  if (['draft', 'created', 'scheduled'].includes(st)) {
    actions.add('send')
  }

  // Reenviar e-mail — expirado usa Renovar / Reenviar (recalcula validade, reenvia com mesmo link)
  if (st !== 'draft' && st !== 'accepted' && st !== 'signed' && st !== 'expired' && signatureStatus !== 'signed') {
    actions.add('resend')
  }

  // WhatsApp / Chat
  if (st !== 'draft') actions.add('whatsapp')
  if (!['draft', 'accepted', 'bounced'].includes(st)) actions.add('chat')

  // Link público
  if (st !== 'draft' && st !== 'rejected') actions.add('public_link')

  // Assinatura digital — somente APÓS o aceite do cliente (regra: aceite → link por e-mail → assinatura)
  const noActiveSignature = !signatureStatus || signatureStatus === 'none'
  if (st === 'accepted' && noActiveSignature) {
    actions.add('request_signature')
  }

  // Editar contrato — somente pending
  if (st === 'pending') actions.add('edit_contract')

  return Array.from(actions)
}

export function canDo(action: ProposalAction, status: string | null | undefined, signatureStatus?: string | null): boolean {
  return getAllowedActions(status, signatureStatus).includes(action)
}

/**
 * Mapa evento de histórico → fase (p/ agrupamento no ProposalTimeline).
 * 'system' = fora do ciclo (ex: google_sync) — renderizado no fim.
 */
export const EVENT_TO_PHASE: Record<string, ProposalPhase | 'system'> = {
  // Rascunho
  created: 'draft',
  renew: 'progress',
  // Em andamento
  sent: 'progress',
  delivered: 'progress',
  opened: 'progress',
  clicked: 'progress',
  viewed: 'progress',
  received: 'progress',
  scheduled: 'progress',
  pending: 'progress',
  renew: 'progress',
  // Assinatura
  signature_requested: 'signature',
  uploaded: 'signature',
  signing: 'signature',
  // Fechado
  signed: 'closed',
  accepted: 'closed',
  // Falhou / Cancelado
  declined: 'failed',
  bounced: 'failed',
  complained: 'failed',
  failed: 'failed',
  suppressed: 'failed',
  delayed: 'failed',
  rejected: 'failed',
  expired: 'failed',
  // Fora do ciclo
  google_sync: 'system'
}

export function getEventPhase(event: string | null | undefined): ProposalPhase | 'system' {
  if (!event) return 'system'
  return EVENT_TO_PHASE[event] || 'system'
}