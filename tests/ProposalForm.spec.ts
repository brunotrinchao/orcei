import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ProposalForm from '../app/components/proposals/ProposalForm/index.vue'

describe('ProposalForm', () => {
  it('renderiza sem initialData (novo orçamento) sem erro', async () => {
    const wrapper = await mountSuspended(ProposalForm, {
      props: { isEditing: false, isSubmitting: false }
    })
    // Bug: applyInitialData(undefined) acessava newVal.title → runtime error → form não renderizava
    expect(wrapper.find('.proposal-form-container').exists()).toBe(true)
  })

  it('renderiza com initialData (edição) preenchendo o form', async () => {
    const wrapper = await mountSuspended(ProposalForm, {
      props: {
        isEditing: true,
        initialData: {
          _id: 'proposal-1',
          title: 'Site Institucional',
          status: 'draft',
          client: { name: 'João Silva', email: 'joao@email.com', phone: '(11) 98888-7777' },
          items: [{ name: 'Criação de site', description: '', price: 2500, quantity: 1, isUpsell: false }],
          upsellItems: [],
          totals: { subtotal: 2500, additional: 0, discount: 0, final: 2500 },
          paymentConfig: { method: 'cash', acceptCreditCard: false, installments: 1, cashDiscount: 0 },
          sendMethod: 'auto',
          contractText: '',
          termsAndConditions: '',
          executionDate: null,
          expiresAt: null
        } as any
      }
    })
    expect(wrapper.find('.proposal-form-container').exists()).toBe(true)
  })
})