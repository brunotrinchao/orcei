import { ref, computed, watch } from 'vue'
import { 
  DialogRoot, 
  DialogPortal, 
  DialogOverlay, 
  DialogContent, 
  DialogTitle, 
  DialogClose 
} from 'radix-vue'
import { 
  Sparkles, 
  Loader2, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  X,
  Database,
  Globe,
  PlusCircle,
  HelpCircle,
  TrendingUp,
  Bookmark,
  UserCheck,
  UserPlus,
  User,
  Mail,
  Phone,
  MapPin,
  Check
} from 'lucide-vue-next'

export function useAIProposalWizard(
  props: { open: boolean },
  emit: { (e: 'close'): void; (e: 'update:open', val: boolean): void; (e: 'success', payload: { client?: any; items: any[] }): void }
) {
  const step = ref<'prompt' | 'loading' | 'results'>('prompt')
  const promptText = ref('')
  const results = ref<any>(null)

  const extractedClients = ref<any[]>([])
  const selectedClientIndex = ref<number>(0)
  const matchedClientsMap = ref<Record<number, any>>({})
  const isSearchingClient = ref(false)
  const importClientEnabled = ref(true)
  const isExistingClientModalOpen = ref(false)
  const existingClientFound = ref<any>(null)

  const currentSelectedClient = computed(() => extractedClients.value[selectedClientIndex.value] || null)
  const currentMatchedClient = computed(() => matchedClientsMap.value[selectedClientIndex.value] || null)

  const { notify } = useAlerts()
  const { creditLabel } = useCreditCosts()
  const { 
    isCreditConfirmOpen, 
    confirmTitle, 
    confirmDescription, 
    executeWithCreditCheck, 
    handleCreditConfirm, 
    handleCreditCancel 
  } = useConfirmCreditAction()
  const config = useRuntimeConfig()
  const maxPromptLength = computed(() => Number(config.public.aiMaxProposalWizardPrompt) || 1500)

  watch(promptText, (val) => {
    if (val && val.length > maxPromptLength.value) {
      promptText.value = val.slice(0, maxPromptLength.value)
    }
  })

  function handleGenerateRequest() {
    if (!promptText.value) return notify('Aviso', 'Digite o texto da proposta ou conversa.')
    if (promptText.value.length > maxPromptLength.value) {
      return notify('Aviso', `O texto ultrapassou o limite máximo de ${maxPromptLength.value} caracteres.`)
    }
    executeWithCreditCheck('proposalSuggest', () => generate(), {
      title: 'Analisar com IA',
      customDescription: `A análise de cliente e orçamentos por IA consumirá ${creditLabel('proposalSuggest')} do seu saldo. Deseja continuar? `
    })
  }

  async function searchAllExistingClients(clientsList: any[]) {
    isSearchingClient.value = true
    try {
      const map: Record<number, any> = {}
      for (let i = 0; i < clientsList.length; i++) {
        const cData = clientsList[i]
        const searchTerm = cData.email || cData.phone || cData.name
        if (!searchTerm) continue

        const searchRes: any = await $fetch('/api/clients', {
          query: { limit: 5, search: searchTerm }
        })
        const items = searchRes?.items || []
        if (items.length > 0) {
          const emailMatch = cData.email 
            ? items.find((item: any) => item.email?.toLowerCase().trim() === cData.email.toLowerCase().trim())
            : null
          const phoneMatch = !emailMatch && cData.phone
            ? items.find((item: any) => item.phone && item.phone.replace(/\D/g, '') === cData.phone.replace(/\D/g, ''))
            : null
          const nameMatch = !emailMatch && !phoneMatch && cData.name
            ? items.find((item: any) => item.name?.toLowerCase().trim() === cData.name.toLowerCase().trim())
            : null

          const bestMatch = emailMatch || phoneMatch || nameMatch
          if (bestMatch) {
            map[i] = bestMatch
          }
        }
      }
      matchedClientsMap.value = map
    } catch (err) {
      console.error('[searchAllExistingClients] Erro ao buscar clientes:', err)
    } finally {
      isSearchingClient.value = false
    }
  }

  const LOADING_STEPS = [
    'Lendo a conversa…',
    'Identificando o cliente…',
    'Extraindo serviços mencionados…',
    'Consultando preços de mercado…',
    'Montando o orçamento…'
  ]
  const loadingStepIndex = ref(0)
  const currentLoadingMessage = computed(() => LOADING_STEPS[loadingStepIndex.value])
  let loadingInterval: any = null

  function startLoadingAnimation() {
    loadingStepIndex.value = 0
    if (loadingInterval) clearInterval(loadingInterval)
    loadingInterval = setInterval(() => {
      if (loadingStepIndex.value < LOADING_STEPS.length - 1) {
        loadingStepIndex.value++
      }
    }, 1800)
  }

  function stopLoadingAnimation() {
    if (loadingInterval) {
      clearInterval(loadingInterval)
      loadingInterval = null
    }
  }

  async function generate() {
    step.value = 'loading'
    startLoadingAnimation()
    extractedClients.value = []
    selectedClientIndex.value = 0
    matchedClientsMap.value = {}
    try {
      const data: any = await $fetch('/api/ai/proposal-suggest', {
        method: 'POST',
        body: { prompt: promptText.value }
      })

      const rawClients = Array.isArray(data.clients) && data.clients.length > 0
        ? data.clients
        : (data.client ? [data.client] : [])
      
      extractedClients.value = rawClients.filter((c: any) => c && (c.name || c.email || c.phone))
      selectedClientIndex.value = 0

      if (extractedClients.value.length > 0) {
        importClientEnabled.value = true
        await searchAllExistingClients(extractedClients.value)
      } else {
        importClientEnabled.value = false
      }
      
      results.value = {
        ...data,
        items: data.items.map((item: any, idx: number) => ({
          ...item,
          quantity: (item.quantity && Number(item.quantity) > 0) ? Number(item.quantity) : 1,
          _uid: item._uid || `ai_item_${idx}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          isCatalog: !!item.catalogItemId,
          isSaving: false
        }))
      }
      step.value = 'results'
    } catch (e: any) {
      notify('Erro', e.data?.statusMessage || 'Erro ao processar com IA')
      step.value = 'prompt'
    } finally {
      stopLoadingAnimation()
    }
  }

  async function saveToCatalog(item: any) {
    if (item.isCatalog) return
    item.isSaving = true
    
    try {
      const createdItem: any = await $fetch('/api/catalog', {
        method: 'POST',
        body: {
          type: 'service',
          name: item.name,
          description: item.description,
          price: item.price,
          unit: item.unit || 'UN',
          aiAssisted: true
        }
      })
      
      item.isCatalog = true
      item.catalogItemId = createdItem._id || createdItem.id
      notify('Catálogo Atualizado', `"${item.name}" foi salvo com sucesso!`)
    } catch (e) {
      notify('Erro', 'Erro ao salvar serviço no catálogo')
    } finally {
      item.isSaving = false
    }
  }

  async function handleFinish() {
    if (!results.value || !results.value.items.length) return

    if (importClientEnabled.value && extractedClients.value.length > 0) {
      const curIdx = selectedClientIndex.value
      const curExtracted = extractedClients.value[curIdx]
      let matched = matchedClientsMap.value[curIdx]

      const nameTrimmed = (curExtracted?.name || '').trim()
      const emailTrimmed = (curExtracted?.email || '').trim()
      const phoneTrimmed = (curExtracted?.phone || '').trim()

      if (!matched && (emailTrimmed || phoneTrimmed)) {
        try {
          const searchRes: any = await $fetch('/api/clients', {
            query: { limit: 10, search: emailTrimmed || phoneTrimmed }
          })
          const items = searchRes?.items || []
          const emailMatch = emailTrimmed
            ? items.find((item: any) => item.email?.toLowerCase().trim() === emailTrimmed.toLowerCase())
            : null
          const phoneMatch = !emailMatch && phoneTrimmed
            ? items.find((item: any) => item.phone && item.phone.replace(/\D/g, '') === phoneTrimmed.replace(/\D/g, ''))
            : null

          matched = emailMatch || phoneMatch
        } catch (e) {
          console.error('[handleFinish] Erro ao consultar cliente existente:', e)
        }
      }

      if (matched) {
        existingClientFound.value = matched
        isExistingClientModalOpen.value = true
        return
      }

      // Validações para cadastro de novo cliente
      if (!nameTrimmed) {
        notify('Aviso', 'O nome do cliente é obrigatório para realizar a importação.')
        return
      }
      if (!emailTrimmed) {
        notify('Aviso', 'Para poder importar o contato, é preciso preencher o e-mail do cliente.')
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(emailTrimmed)) {
        notify('Aviso', 'Por favor, insira um e-mail válido para importar o cliente.')
        return
      }

      await proceedFinishWithClient(null)
    } else {
      await proceedFinishWithClient(null)
    }
  }

  async function confirmUseExistingClient() {
    isExistingClientModalOpen.value = false
    const clientToUse = existingClientFound.value
    await proceedFinishWithClient(clientToUse)
  }

  async function proceedFinishWithClient(existingClient: any = null) {
    if (!results.value || !results.value.items.length) return
    
    try {
      let finalClient: any = null

      if (importClientEnabled.value && extractedClients.value.length > 0) {
        if (existingClient) {
          if (!existingClient.email || !existingClient.email.trim()) {
            notify('Aviso', 'O cliente cadastrado precisa ter um e-mail para ser importado.')
            return
          }
          finalClient = existingClient
        } else {
          const curIdx = selectedClientIndex.value
          const curExtracted = extractedClients.value[curIdx]
          const nameTrimmed = (curExtracted?.name || '').trim()
          const emailTrimmed = (curExtracted?.email || '').trim()

          try {
            const newClientData: any = {
              name: nameTrimmed,
              email: emailTrimmed,
              phone: curExtracted.phone?.trim() || '',
              notes: curExtracted.notes || 'Cliente cadastrado via Assistente de IA'
            }
            if (curExtracted.address) {
              newClientData.address = curExtracted.address
            }

            const createdClient: any = await $fetch('/api/clients', {
              method: 'POST',
              body: newClientData
            })
            finalClient = createdClient
            notify('Cliente Cadastrado', `"${createdClient.name}" foi cadastrado com sucesso!`)
          } catch (createErr: any) {
            console.error('Erro ao cadastrar cliente automático:', createErr)
            if (createErr.data?.statusMessage?.includes('Já existe um cliente')) {
              notify('Erro', 'Já existe um cliente cadastrado com este e-mail.')
              return
            }
            finalClient = {
              name: nameTrimmed,
              email: emailTrimmed,
              phone: curExtracted?.phone || ''
            }
          }
        }
      }

      const itemsToSave = results.value.items.filter((item: any) => !item.isCatalog)
      const itemsInCatalog = results.value.items.filter((item: any) => item.isCatalog)
      
      const savedNewItems = await Promise.all(
        itemsToSave.map((item: any) => 
          $fetch('/api/catalog', {
            method: 'POST',
            body: {
              type: 'service',
              name: item.name,
              description: item.description,
              price: item.price,
              unit: item.unit || 'UN',
              aiAssisted: true
            }
          })
        )
      )
      
      const allFinalItems = [
        ...itemsInCatalog.map((item: any) => ({ ...item, id: item.catalogItemId || item.id || item._id })),
        ...savedNewItems.map((item: any) => ({ ...item, id: item._id || item.id }))
      ]
      
      emit('success', { client: finalClient, items: allFinalItems })
      close()
    } catch (e) {
      notify('Erro', 'Erro ao processar e salvar os serviços')
    }
  }

  function close() {
    step.value = 'prompt'
    promptText.value = ''
    results.value = null
    extractedClients.value = []
    selectedClientIndex.value = 0
    matchedClientsMap.value = {}
    importClientEnabled.value = true
    emit('close')
    emit('update:open', false)
  }

  function removeItem(idx: number) {
    results.value.items.splice(idx, 1)
    if (results.value.items.length === 0) {
      step.value = 'prompt'
    }
  }

  return {
    step,
    promptText,
    results,
    extractedClients,
    selectedClientIndex,
    currentSelectedClient,
    currentMatchedClient,
    matchedClientsMap,
    isSearchingClient,
    importClientEnabled,
    isExistingClientModalOpen,
    existingClientFound,
    confirmUseExistingClient,
    maxPromptLength,
    creditLabel,
    LOADING_STEPS,
    loadingStepIndex,
    currentLoadingMessage,
    isCreditConfirmOpen,
    confirmTitle,
    confirmDescription,
    handleGenerateRequest,
    saveToCatalog,
    handleFinish,
    close,
    removeItem,
    handleCreditConfirm,
    handleCreditCancel,
    DialogRoot,
    DialogPortal,
    DialogOverlay,
    DialogContent,
    DialogTitle,
    DialogClose,
    Sparkles,
    Loader2,
    Search,
    Plus,
    Trash2,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    X,
    Database,
    Globe,
    PlusCircle,
    HelpCircle,
    TrendingUp,
    Bookmark,
    UserCheck,
    UserPlus,
    User,
    Mail,
    Phone,
    MapPin,
    Check
  }
}


