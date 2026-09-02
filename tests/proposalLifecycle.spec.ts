import { describe, it, expect } from 'vitest'
import {
  PROPOSAL_PHASES,
  PHASE_BY_STATUS,
  getProposalPhase,
  getAllowedActions,
  getPhaseStepper,
  getEventPhase,
  canDo
} from '../app/utils/proposalLifecycle'

describe('proposalLifecycle', () => {
  describe('fases', () => {
    it('define 5 fases na ordem correta', () => {
      expect(PROPOSAL_PHASES.map((p) => p.key)).toEqual([
        'draft',
        'progress',
        'signature',
        'closed',
        'failed'
      ])
    })

    it('mapeia cada status para sua fase', () => {
      expect(getProposalPhase('draft')).toBe('draft')
      expect(getProposalPhase('sent')).toBe('progress')
      expect(getProposalPhase('viewed')).toBe('progress')
      expect(getProposalPhase('pending_signature')).toBe('signature')
      expect(getProposalPhase('signed')).toBe('closed')
      expect(getProposalPhase('accepted')).toBe('closed')
      expect(getProposalPhase('expired')).toBe('failed')
      expect(getProposalPhase('rejected')).toBe('failed')
      expect(getProposalPhase('bounced')).toBe('failed')
    })

    it('fallback p/ status desconhecido/nulo', () => {
      expect(getProposalPhase(null as any)).toBe('draft')
      expect(getProposalPhase('status_estranho')).toBe('progress')
    })

    it('assinatura pendente só muda a fase APÓS o aceite', () => {
      // Aceito + assinatura pendente → fase Assinatura
      expect(getProposalPhase('accepted', 'pending')).toBe('signature')
      expect(getProposalPhase('accepted', 'signing')).toBe('signature')
      // Sem aceite → fase real do status (Ignores assinatura legada/pendente)
      expect(getProposalPhase('sent', 'pending')).toBe('progress')
      expect(getProposalPhase('viewed', 'pending')).toBe('progress')
      expect(getProposalPhase('draft', 'pending')).toBe('draft')
      // Sem assinatura → fase normal
      expect(getProposalPhase('accepted', null)).toBe('closed')
      expect(getProposalPhase('accepted', 'none')).toBe('closed')
    })

    it('cobre todos os valores do enum ProposalStatus', () => {
      const statuses = [
        'draft', 'created', 'scheduled', 'sent', 'delivered', 'delayed',
        'bounced', 'suppressed', 'failed', 'received', 'opened', 'clicked',
        'viewed', 'pending', 'pending_signature', 'signing', 'signed',
        'accepted', 'expired'
      ]
      for (const s of statuses) {
        expect(PHASE_BY_STATUS[s]).toBeDefined()
      }
    })
  })

  describe('getAllowedActions', () => {
    it('draft: edita, exclui, envia — sem reenviar/whatsapp/chat/link', () => {
      const a = getAllowedActions('draft')
      expect(a).toContain('edit')
      expect(a).toContain('delete')
      expect(a).toContain('send')
      expect(a).toContain('download')
      expect(a).toContain('history')
      expect(a).not.toContain('resend')
      expect(a).not.toContain('whatsapp')
      expect(a).not.toContain('chat')
      expect(a).not.toContain('public_link')
    })

    it('sent: tudo disponível', () => {
      const a = getAllowedActions('sent')
      expect(a).toEqual(expect.arrayContaining(['edit', 'delete', 'resend', 'whatsapp', 'chat' as any, 'public_link' as any]))
    })

    it('pending: editar contrato disponível', () => {
      const a = getAllowedActions('pending')
      expect(a).toContain('edit_contract')
    })

    it('accepted: terminal — sem editar/excluir/renviar', () => {
      const a = getAllowedActions('accepted')
      expect(a).not.toContain('edit')
      expect(a).not.toContain('delete')
      expect(a).not.toContain('resend')
      expect(a).not.toContain('send')
    })

    it('signed: terminal — sem editar/excluir/renviar', () => {
      const a = getAllowedActions('signed')
      expect(a).not.toContain('edit')
      expect(a).not.toContain('delete')
      expect(a).not.toContain('resend')
    })

    it('request_signature: somente após aceite e sem assinatura ativa', () => {
      expect(getAllowedActions('accepted', null)).toContain('request_signature')
      expect(getAllowedActions('accepted', 'none')).toContain('request_signature')
      expect(getAllowedActions('accepted', 'pending')).not.toContain('request_signature')
      expect(getAllowedActions('accepted', 'signed')).not.toContain('request_signature')
      expect(getAllowedActions('sent', null)).not.toContain('request_signature')
      expect(getAllowedActions('viewed', null)).not.toContain('request_signature')
      expect(getAllowedActions('draft', null)).not.toContain('request_signature')
    })

    it('canDo reflete getAllowedActions', () => {
      expect(canDo('send', 'draft')).toBe(true)
      expect(canDo('edit', 'accepted')).toBe(false)
    })
  })

  describe('getPhaseStepper', () => {
    it('índice da fase atual', () => {
      expect(getPhaseStepper('draft').current).toBe(0)
      expect(getPhaseStepper('sent').current).toBe(1)
      expect(getPhaseStepper('pending_signature').current).toBe(2)
      expect(getPhaseStepper('accepted').current).toBe(3)
      expect(getPhaseStepper('expired').current).toBe(4)
    })

    it('retorna 5 fases', () => {
      expect(getPhaseStepper('sent').phases).toHaveLength(5)
    })
  })

  describe('getEventPhase', () => {
    it('agrupa eventos por fase', () => {
      expect(getEventPhase('created')).toBe('draft')
      expect(getEventPhase('viewed')).toBe('progress')
      expect(getEventPhase('signature_requested')).toBe('signature')
      expect(getEventPhase('signed')).toBe('closed')
      expect(getEventPhase('bounced')).toBe('failed')
      expect(getEventPhase('google_sync')).toBe('system')
      expect(getEventPhase('desconhecido')).toBe('system')
    })
  })
})