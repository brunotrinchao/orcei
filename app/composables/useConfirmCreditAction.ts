import { ref } from 'vue'
import { useCreditCosts } from './useCreditCosts'

export function useConfirmCreditAction() {
  const { getCost } = useCreditCosts()

  const isCreditConfirmOpen = ref(false)
  const pendingCreditAction = ref<(() => void | Promise<void>) | null>(null)
  const confirmTitle = ref('Confirmar Consumo de Crédito')
  const confirmDescription = ref('')
  const actionCost = ref(0)

  function executeWithCreditCheck(
    actionKey: string, 
    onConfirm: () => void | Promise<void>, 
    opts?: { title?: string; customDescription?: string }
  ) {
    const cost = getCost(actionKey)
    actionCost.value = cost

    // Se o custo for 0 (gratuito), executa imediatamente sem modal
    if (cost <= 0) {
      onConfirm()
      return
    }

    confirmTitle.value = opts?.title || 'Confirmar Uso de Créditos IA'
    confirmDescription.value = opts?.customDescription || 
      `Esta ação com IA consome <strong>${cost} ${cost === 1 ? 'crédito' : 'créditos'}</strong> do seu saldo. Deseja continuar?`
    pendingCreditAction.value = onConfirm
    isCreditConfirmOpen.value = true
  }

  function handleCreditConfirm() {
    isCreditConfirmOpen.value = false
    if (pendingCreditAction.value) {
      const action = pendingCreditAction.value
      pendingCreditAction.value = null
      action()
    }
  }

  function handleCreditCancel() {
    isCreditConfirmOpen.value = false
    pendingCreditAction.value = null
  }

  return {
    isCreditConfirmOpen,
    confirmTitle,
    confirmDescription,
    actionCost,
    executeWithCreditCheck,
    handleCreditConfirm,
    handleCreditCancel
  }
}
