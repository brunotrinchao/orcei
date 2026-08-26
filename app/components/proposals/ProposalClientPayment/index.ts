import { CreditCard, Banknote, CheckCircle2 } from 'lucide-vue-next'
import type { ProposalDTO } from '~/types'

export function useProposalClientPayment(
  props: { modelValue: 'cash' | 'credit_card'; paymentConfig: ProposalDTO['paymentConfig']; totals: ProposalDTO['totals'] },
  emit: (e: 'update:modelValue', value: 'cash' | 'credit_card') => void
) {
  function selectMethod(method: 'cash' | 'credit_card') {
    emit('update:modelValue', method)
  }

  return {
    selectMethod,
    CreditCard,
    Banknote,
    CheckCircle2
  }
}
