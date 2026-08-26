import { FileText } from 'lucide-vue-next'
import type { ProposalDTO } from '~/types'

export function useProposalClientScope(
  props: { items: ProposalDTO['items']; upsellItems?: ProposalDTO['upsellItems']; totals: { subtotal: number; additional?: number; discount: number; final: number }; finalTotal: number; isAccepted?: boolean },
  selectedUpsells: { value: string[] }
) {
  function toggleUpsell(itemId: string) {
    if (props.isAccepted) return
    const index = selectedUpsells.value.indexOf(itemId)
    if (index === -1) {
      selectedUpsells.value.push(itemId)
    } else {
      selectedUpsells.value.splice(index, 1)
    }
  }

  return {
    toggleUpsell,
    FileText
  }
}
