import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ProposalPhaseStepper from '../app/components/proposals/ProposalPhaseStepper.vue'

describe('ProposalPhaseStepper', () => {
  it('renderiza 5 fases', async () => {
    const wrapper = await mountSuspended(ProposalPhaseStepper, {
      props: { status: 'sent' }
    })
    const dots = wrapper.findAll('li')
    expect(dots).toHaveLength(5)
  })

  it('fase atual marcada (sent → Em andamento, índice 1)', async () => {
    const wrapper = await mountSuspended(ProposalPhaseStepper, {
      props: { status: 'sent' }
    })
    const currentLabel = wrapper.find('span.font-bold')
    expect(currentLabel.text()).toContain('Em andamento')
  })

  it('fase atual draft → Rascunho', async () => {
    const wrapper = await mountSuspended(ProposalPhaseStepper, {
      props: { status: 'draft' }
    })
    const currentLabel = wrapper.find('span.font-bold')
    expect(currentLabel.text()).toContain('Rascunho')
  })

  it('fase fechada → Fechado', async () => {
    const wrapper = await mountSuspended(ProposalPhaseStepper, {
      props: { status: 'accepted' }
    })
    const currentLabel = wrapper.find('span.font-bold')
    expect(currentLabel.text()).toContain('Fechado')
  })

  it('fase assinatura → Assinatura', async () => {
    const wrapper = await mountSuspended(ProposalPhaseStepper, {
      props: { status: 'pending_signature' }
    })
    const currentLabel = wrapper.find('span.font-bold')
    expect(currentLabel.text()).toContain('Assinatura')
  })

  it('fase falha → Falhou / Cancelado', async () => {
    const wrapper = await mountSuspended(ProposalPhaseStepper, {
      props: { status: 'expired' }
    })
    const currentLabel = wrapper.find('span.font-bold')
    expect(currentLabel.text()).toContain('Falhou')
  })

  it('draft não mostra checks (nenhum concluído)', async () => {
    const wrapper = await mountSuspended(ProposalPhaseStepper, {
      props: { status: 'draft' }
    })
    expect(wrapper.findAll('svg')).toHaveLength(0)
  })

  it('accepted mostra 3 checks (Rascunho + Em andamento + Assinatura concluídas)', async () => {
    const wrapper = await mountSuspended(ProposalPhaseStepper, {
      props: { status: 'accepted' }
    })
    expect(wrapper.findAll('svg')).toHaveLength(3)
  })

  it('expirado mostra só 2 checks (Assinatura/Fechado nunca ocorreram)', async () => {
    const wrapper = await mountSuspended(ProposalPhaseStepper, {
      props: { status: 'expired' }
    })
    expect(wrapper.findAll('svg')).toHaveLength(2)
  })

  it('assinatura recusada mostra 3 checks (Em andamento concluída antes da assinatura)', async () => {
    const wrapper = await mountSuspended(ProposalPhaseStepper, {
      props: { status: 'accepted', signatureStatus: 'rejected' }
    })
    expect(wrapper.findAll('svg')).toHaveLength(3)
  })

  it('size=sm renderiza sem quebrar', async () => {
    const wrapper = await mountSuspended(ProposalPhaseStepper, {
      props: { status: 'sent', size: 'sm' }
    })
    expect(wrapper.findAll('li')).toHaveLength(5)
  })
})