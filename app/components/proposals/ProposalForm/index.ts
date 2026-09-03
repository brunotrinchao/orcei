import { ref, computed, watch, watchEffect } from 'vue'
import { Loader2, ArrowRight, ArrowLeft, Check } from 'lucide-vue-next'
import { StepperRoot, StepperItem, StepperTrigger, StepperIndicator, StepperTitle, StepperSeparator } from 'radix-vue'
import type { CatalogItemDTO, ProfileDTO, ProposalDTO } from '../../../../types'
import { ProposalStatus, PaymentMethod, SendMethod } from '../../../../types/enums'

export function useProposalForm(
  props: { initialData?: ProposalDTO; prefilledItems?: any[]; isEditing?: boolean; isSubmitting?: boolean },
  emit: (e: 'submit', payload: any) => void
) {
  const currentStep = ref(1)

  const stepClientRef = ref<{ validate: () => boolean } | null>(null)
  const stepScopeRef = ref<{ validate: () => boolean } | null>(null)

  const steps = [
    { step: 1, title: 'Cliente', subtitle: 'Quem vai receber o orçamento' },
    { step: 2, title: 'Serviços', subtitle: 'Itens, escopo e condições' },
    { step: 3, title: 'Pagamento', subtitle: 'Forma de pagamento e descontos' },
    { step: 4, title: 'Revisão', subtitle: 'Confira tudo antes de enviar' }
  ]

  const clientSearch = ref('')
  const { data: clientsData, pending: pendingClients } = useLazyFetch<any>('/api/clients', {
    key: 'clients-search',
    query: computed(() => ({
      limit: 20,
      search: clientSearch.value.trim().length >= 2 ? clientSearch.value : ''
    })),
    watch: [clientSearch],
    server: false
  })
  const { data: profile } = useFetch<ProfileDTO>('/api/profile', { key: 'profile' })
  const { notify } = useAlerts()

  const clients = computed(() => clientsData.value?.items || [])

  const catalogSearch = ref('')
  const catalogPage = ref(1)
  const catalogLimit = 6

  const { data: catalogData, refresh: refreshCatalog } = useFetch<any>('/api/catalog', {
    query: computed(() => ({
      page: catalogPage.value,
      limit: catalogLimit,
      search: catalogSearch.value
    })),
    watch: [catalogPage, catalogSearch]
  })

  const catalogItems = computed(() => catalogData.value?.items || [])
  const totalCatalogItems = computed(() => catalogData.value?.total || 0)

  const selectedClientId = ref('')

  function getInitialAcceptCreditCard(initialData?: any, profileData?: any): boolean {
    if (initialData?.paymentConfig?.acceptCreditCard !== undefined) {
      return Boolean(initialData.paymentConfig.acceptCreditCard)
    }
    if (initialData?._id) {
      return initialData.paymentConfig?.method === PaymentMethod.CREDIT_CARD || (initialData.paymentConfig?.installments || 1) > 1
    }
    return profileData?.defaultAcceptCreditCard ?? false
  }

  const form = ref({
    title: props.initialData?.title || '',
    status: props.initialData?.status || ProposalStatus.DRAFT,
    client: {
      name: props.initialData?.client?.name || '',
      email: props.initialData?.client?.email || '',
      phone: props.initialData?.client?.phone || ''
    },
    items: props.initialData?.items 
      ? [...props.initialData.items] 
      : (props.prefilledItems ? [...props.prefilledItems] : []) as any[],
    upsellItems: props.initialData?.upsellItems 
      ? [...props.initialData.upsellItems] 
      : [] as any[],
    totals: {
      additional: props.initialData?.totals?.additional || 0,
      discount: props.initialData?.totals?.discount || 0
    },
    paymentConfig: {
      method: props.initialData?.paymentConfig?.method || PaymentMethod.CASH,
      acceptCreditCard: getInitialAcceptCreditCard(props.initialData, profile.value),
      installments: props.initialData?.paymentConfig?.installments || 1,
      cashDiscount: props.initialData?.paymentConfig?.cashDiscount || 0
    },
    sendMethod: props.initialData?.sendMethod || SendMethod.AUTO,
    contractText: props.initialData?.contractText || '',
    termsAndConditions: props.initialData?.termsAndConditions || '',
    executionDate: props.initialData?.executionDate ? new Date(props.initialData.executionDate).toISOString().slice(0, 16) : ''
  })

  watchEffect(() => {
    if (profile.value && !props.initialData?._id) {
      if (!form.value.contractText) form.value.contractText = profile.value.defaultContractTemplate
      if (!form.value.termsAndConditions) form.value.termsAndConditions = profile.value.defaultTermsAndConditions
      form.value.paymentConfig.acceptCreditCard = profile.value.defaultAcceptCreditCard ?? false
      form.value.paymentConfig.installments = profile.value.defaultInstallments || 1
      form.value.paymentConfig.cashDiscount = profile.value.defaultCashDiscount || 0
    }
  })

  watch(() => form.value.paymentConfig.acceptCreditCard, (enabled) => {
    if (!enabled) {
      form.value.paymentConfig.method = PaymentMethod.CASH
      form.value.paymentConfig.installments = 1
    } else {
      if (form.value.paymentConfig.installments < 1) {
        form.value.paymentConfig.installments = profile.value?.defaultInstallments || 1
      }
    }
  })

  function applyInitialData(newVal: any) {
    form.value = {
      title: newVal.title,
      status: newVal.status,
      client: {
        name: newVal.client.name,
        email: newVal.client.email,
        phone: newVal.client.phone || ''
      },
      items: [...newVal.items],
      upsellItems: newVal.upsellItems ? [...newVal.upsellItems] : [],
      totals: {
        additional: newVal.totals?.additional || 0,
        discount: newVal.totals?.discount || 0
      },
      paymentConfig: {
        method: newVal.paymentConfig?.method || PaymentMethod.CASH,
        acceptCreditCard: getInitialAcceptCreditCard(newVal, profile.value),
        installments: newVal.paymentConfig?.installments || 1,
        cashDiscount: newVal.paymentConfig?.cashDiscount || 0
      },
      sendMethod: newVal.sendMethod || SendMethod.AUTO,
      contractText: newVal.contractText || '',
      termsAndConditions: newVal.termsAndConditions || '',
      executionDate: newVal.executionDate ? new Date(newVal.executionDate).toISOString().slice(0, 16) : ''
    }
  }

  // Guarda: no "novo orçamento" initialData é undefined — form usa defaults; só aplica dados quando há edição.
  // Sem esta guarda, applyInitialData acessava `newVal.title` em undefined → erro de runtime → form não renderizava.
  if (props.initialData) applyInitialData(props.initialData)

  // Watch apenas quando troca de orçamento (abertura de novo draft p/ edição).
  // Deep watch no objeto reativo sobrescrevia campos editados (cliente, itens)
  // quando o backend sincronizava in-place (ex: chat/refresh).
  watch(() => props.initialData?._id, () => {
    if (props.initialData) applyInitialData(props.initialData)
  })

  function setPrefilledClientAndStep(clientData: any, targetStep: number = 2) {
    if (clientData) {
      if (clientData._id || clientData.id) {
        selectedClientId.value = clientData._id || clientData.id
      }
      form.value.client = {
        name: clientData.name || '',
        email: clientData.email || '',
        phone: clientData.phone || ''
      }
    }
    if (targetStep) {
      currentStep.value = targetStep
    }
  }

  watch(() => props.prefilledItems, (newVal) => {
    if (newVal && !props.initialData) {
      form.value.items = [...newVal]
      currentStep.value = 2
    }
  }, { deep: true, immediate: true })

  const isGenerating = ref(false)
  const { 
    isCreditConfirmOpen, 
    confirmTitle, 
    confirmDescription, 
    executeWithCreditCheck, 
    handleCreditConfirm, 
    handleCreditCancel 
  } = useConfirmCreditAction()

  const config = useRuntimeConfig()
  const maxGenerateItemDescriptionLength = computed(() => Number(config.public.aiMaxGenerateItemDescription) || 500)

  async function generateDescription({ index, isUpsell }: { index: number, isUpsell: boolean }) {
    const item = isUpsell ? form.value.upsellItems[index] : form.value.items[index]
    if (!item.name) return notify('Aviso', 'O item precisa de um nome para gerar a descrição.')
    if (item.name.length > maxGenerateItemDescriptionLength.value) {
      return notify('Aviso', `O nome do item ultrapassou o limite máximo de ${maxGenerateItemDescriptionLength.value} caracteres.`)
    }
    
    executeWithCreditCheck('generate', async () => {
      isGenerating.value = true
      try {
        const prompt = `Gere uma descrição profissional para um serviço/produto chamado: ${item.name}`
        const data: any = await $fetch('/api/ai/generate', {
          method: 'POST',
          body: { prompt }
        })
        item.description = data.text
      } catch (e: any) {
        notify('Erro', e.data?.statusMessage || 'Erro ao gerar descrição')
      } finally {
        isGenerating.value = false
      }
    }, { title: 'Gerar Descrição com IA' })
  }

  function parseNumeric(val: any): number {
    if (val === null || val === undefined || val === '') return 0
    if (typeof val === 'number') return isNaN(val) ? 0 : val
    const str = String(val).trim()
    if (!str) return 0
    if (str.includes(',') || str.includes('R$')) {
      const cleaned = str.replace(/[R$\s.]/g, '').replace(',', '.')
      const parsed = parseFloat(cleaned)
      return isNaN(parsed) ? 0 : parsed
    }
    const parsed = parseFloat(str)
    return isNaN(parsed) ? 0 : parsed
  }

  const itemsSubtotal = computed(() => {
    const items = form.value.items || []
    return items.reduce((acc, i) => {
      const price = parseNumeric(i.price)
      const qty = parseNumeric(i.quantity) || 1
      return acc + (price * qty)
    }, 0)
  })

  const upsellSubtotal = computed(() => {
    const items = form.value.upsellItems || []
    return items.reduce((acc, i) => {
      const price = parseNumeric(i.price)
      const qty = parseNumeric(i.quantity) || 1
      return acc + (price * qty)
    }, 0)
  })

  const scopeTotal = computed(() => {
    return itemsSubtotal.value + upsellSubtotal.value
  })

  const baseTotal = computed(() => {
    const additional = parseNumeric(form.value.totals?.additional)
    const discount = parseNumeric(form.value.totals?.discount)
    return itemsSubtotal.value + additional - discount
  })

  const finalTotal = computed(() => {
    const cashDiscount = parseNumeric(form.value.paymentConfig?.cashDiscount)
    if (form.value.paymentConfig?.method === PaymentMethod.CASH && cashDiscount > 0) {
      return baseTotal.value * (1 - (cashDiscount / 100))
    }
    return baseTotal.value
  })

  function validateStep(step: number): boolean {
    if (step === 1) return stepClientRef.value?.validate() ?? true
    if (step === 2) return stepScopeRef.value?.validate() ?? true
    return true
  }

  function nextStep() {
    if (validateStep(currentStep.value)) {
      if (currentStep.value < steps.length) {
        currentStep.value++
      }
    }
  }

  function prevStep() {
    if (currentStep.value > 1) {
      currentStep.value--
    }
  }

  async function submit(status: ProposalStatus = ProposalStatus.DRAFT) {
    if (!validateStep(1) || !validateStep(2)) return

    if (!form.value.paymentConfig.acceptCreditCard) {
      form.value.paymentConfig.method = PaymentMethod.CASH
      form.value.paymentConfig.installments = 1
    } else {
      if (form.value.paymentConfig.installments < 1 || form.value.paymentConfig.installments > 12) {
        return notify('Aviso', 'O número de parcelas deve ser entre 1 e 12')
      }
    }

    if (form.value.paymentConfig.cashDiscount < 0 || form.value.paymentConfig.cashDiscount > 100) {
      return notify('Aviso', 'O desconto deve estar entre 0% e 100%')
    }

    const keepStatus = props.isEditing && props.initialData?.status !== ProposalStatus.DRAFT
    const payload = keepStatus ? form.value : { ...form.value, status }
    emit('submit', payload)
  }

  return {
    currentStep,
    stepClientRef,
    stepScopeRef,
    steps,
    clientSearch,
    clients,
    pendingClients,
    catalogSearch,
    catalogItems,
    totalCatalogItems,
    selectedClientId,
    form,
    profile,
    isGenerating,
    isCreditConfirmOpen,
    confirmTitle,
    confirmDescription,
    generateDescription,
    refreshCatalog,
    itemsSubtotal,
    upsellSubtotal,
    scopeTotal,
    baseTotal,
    finalTotal,
    setPrefilledClientAndStep,
    validateStep,
    nextStep,
    prevStep,
    submit,
    handleCreditConfirm,
    handleCreditCancel,
    Loader2,
    ArrowRight,
    ArrowLeft,
    Check,
    StepperRoot,
    StepperItem,
    StepperTrigger,
    StepperIndicator,
    StepperTitle,
    StepperSeparator
  }
}
