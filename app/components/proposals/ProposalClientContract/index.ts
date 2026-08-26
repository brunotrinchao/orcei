import { computed } from 'vue'
import { Shield } from 'lucide-vue-next'

export function useProposalClientContract(props: { contractText: string }) {
  const safeContractText = computed(() => useSanitizeHtml(props.contractText))

  return {
    safeContractText,
    Shield
  }
}
