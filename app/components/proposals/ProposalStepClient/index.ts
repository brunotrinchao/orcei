import { ref, computed } from 'vue'
import { Sparkles, Loader2, User, UserPlus, Plus } from 'lucide-vue-next'
import { useFormValidation } from '~/composables/useFormValidation'

export function useProposalStepClient(
  props: { form: any; clients: any[]; selectedClientId: string; clientSearch?: string; pending?: boolean },
  emit: (e: string, val: any) => void
) {
  const { creditLabel } = useCreditCosts()

  const clientOptions = computed(() => {
    return props.clients.map((c: any) => ({
      label: c.name,
      value: c._id
    })) || []
  })

  const internalSelectedClient = computed({
    get: () => props.selectedClientId,
    set: (val) => emit('update:selectedClientId', val)
  })

  const internalSearch = computed({
    get: () => props.clientSearch || '',
    set: (val) => emit('update:clientSearch', val)
  })

  const { validate, reset, submitAttempted } = useFormValidation()

  const emailFormatError = computed(() => {
    if (!submitAttempted.value) return ''
    const value = props.form.client.email?.trim()
    if (!value) return ''
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value) ? '' : 'E-mail informado é inválido'
  })

  const isManualOpen = ref(false)
  const isCreatingManual = ref(false)
  const manualClient = ref({ name: '', email: '', phone: '' })
  const { notify } = useAlerts()

  function openManualCreate(prefillName?: string) {
    isAIExtractOpen.value = false
    isManualOpen.value = true
    if (prefillName) manualClient.value.name = prefillName
  }

  async function createManualClient() {
    if (!manualClient.value.name.trim()) {
      notify('Aviso', 'Informe o nome do cliente.')
      return
    }
    if (!manualClient.value.email.trim() && !manualClient.value.phone.trim()) {
      notify('Aviso', 'Informe e-mail ou telefone/WhatsApp do cliente.')
      return
    }

    isCreatingManual.value = true
    try {
      const created: any = await $fetch('/api/clients', {
        method: 'POST',
        body: {
          name: manualClient.value.name.trim(),
          email: manualClient.value.email.trim() || undefined,
          phone: manualClient.value.phone.trim() || undefined
        }
      })
      emit('update:selectedClientId', created._id || created.id)
      props.form.client.name = created.name
      props.form.client.email = created.email || ''
      props.form.client.phone = created.phone || ''
      notify('Cliente cadastrado!', `${created.name} foi cadastrado e selecionado.`)
      isManualOpen.value = false
      manualClient.value = { name: '', email: '', phone: '' }
    } catch (e: any) {
      const html = parseApiErrors(e)
      notify(html ? 'Dados inválidos' : 'Erro', html ?? (e.data?.statusMessage || 'Não foi possível cadastrar o cliente.'))
    } finally {
      isCreatingManual.value = false
    }
  }

  function onClientSelect(clientId: string | undefined) {
    internalSelectedClient.value = clientId || ''
    if (!clientId) {
      props.form.client.name = ''
      props.form.client.email = ''
      props.form.client.phone = ''
      return
    }

    const found = props.clients.find((c: any) => c._id === clientId)
    if (found) {
      props.form.client.name = found.name
      props.form.client.email = found.email
      props.form.client.phone = found.phone || ''
    }
  }

  const isAIExtractOpen = ref(false)
  const isExtracting = ref(false)
  const rawLeadText = ref('')
  const config = useRuntimeConfig()
  const maxClientExtractLength = computed(() => Number(config.public.aiMaxClientExtractRawText) || 2000)
  const { 
    isCreditConfirmOpen, 
    confirmTitle, 
    confirmDescription, 
    executeWithCreditCheck, 
    handleCreditConfirm, 
    handleCreditCancel 
  } = useConfirmCreditAction()

  async function extractClient() {
    if (!rawLeadText.value.trim()) return
    if (rawLeadText.value.length > maxClientExtractLength.value) {
      return notify('Aviso', `O texto ultrapassou o limite máximo de ${maxClientExtractLength.value} caracteres.`)
    }

    executeWithCreditCheck('clientExtract', async () => {
      isExtracting.value = true
      try {
        const data: any = await $fetch('/api/ai/client-extract', {
          method: 'POST',
          body: { text: rawLeadText.value }
        })

        if (!data.name || !data.email) {
          notify('Extração Parcial', 'A IA não conseguiu identificar nome e e-mail com clareza. Verifique o texto.')
          return
        }

        const createdClient: any = await $fetch('/api/clients', {
          method: 'POST',
          body: {
            name: data.name,
            email: data.email,
            phone: data.phone || '',
            notes: `Importado via IA em ${new Date().toLocaleDateString('pt-BR')}`
          }
        })

        emit('update:selectedClientId', createdClient._id || createdClient.id)
        props.form.client.name = createdClient.name
        props.form.client.email = createdClient.email
        props.form.client.phone = createdClient.phone || ''

        notify('Cliente Cadastrado!', `${createdClient.name} foi extraído e selecionado automaticamente.`)
        isAIExtractOpen.value = false
        rawLeadText.value = ''
      } catch (e: any) {
        notify('Erro', e.data?.statusMessage || 'Não foi possível extrair os dados do cliente com IA.')
      } finally {
        isExtracting.value = false
      }
    }, { title: 'Extrair Dados do Cliente com IA' })
  }

  return {
    creditLabel,
    clientOptions,
    internalSelectedClient,
    internalSearch,
    validate,
    reset,
    emailFormatError,
    isManualOpen,
    isCreatingManual,
    manualClient,
    openManualCreate,
    createManualClient,
    onClientSelect,
    isAIExtractOpen,
    isExtracting,
    rawLeadText,
    maxClientExtractLength,
    extractClient,
    isCreditConfirmOpen,
    confirmTitle,
    confirmDescription,
    handleCreditConfirm,
    handleCreditCancel,
    Sparkles,
    Loader2,
    User,
    UserPlus,
    Plus
  }
}
