import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import { Plus, Search, Mail, Link as LinkIcon, Pencil, Share2, RefreshCcw, Loader2, FileText, ExternalLink, Eye, Download, CheckCircle2, MessageCircle, CreditCard, Banknote, History, Sparkles, Send, CheckCheck, X, ArrowLeft, ArrowRight, Trash2, MoreVertical, Check, Copy, Variable } from 'lucide-vue-next'
import { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuContent, DropdownMenuItem } from 'radix-vue'
import type { ProposalDTO } from '~/types'

export function useOrcamentosPage() {
  const { creditLabel } = useCreditCosts()
  const route = useRoute()
  const router = useRouter()

  const searchQuery = ref((route.query.search || route.query.email || '') as string)
  const filterStatus = ref('')
  const filterStartDate = ref('')
  const filterEndDate = ref('')
  const filterPendingChat = ref(false)

  const stagedFilterStatus = ref('')
  const stagedFilterStartDate = ref('')
  const stagedFilterEndDate = ref('')
  const stagedFilterPendingChat = ref(false)

  const itemsPerPage = 10

  const showProposalInfo = ref(false)
  const selectedProposalInfo = ref<ProposalDTO | null>(null)

  async function openProposalInfo(proposal: ProposalDTO) {
    selectedProposalInfo.value = proposal
    showProposalInfo.value = true
    try {
      const res: any = await $fetch(`/api/proposals/${proposal._id}`)
      if (res) {
        selectedProposalInfo.value = res
      }
    } catch (err) {
      console.error('[openProposalInfo] Erro ao carregar detalhes:', err)
    }
  }

  watch(() => route.query.search || route.query.email, (newSearch) => {
    if (newSearch !== undefined && String(newSearch) !== searchQuery.value) {
      searchQuery.value = String(newSearch)
    }
  })

  const hasFilters = computed(() => {
    return !!(searchQuery.value || filterStatus.value || filterStartDate.value || filterEndDate.value || filterPendingChat.value)
  })

  const activeFiltersCount = computed(() => {
    let count = 0
    if (searchQuery.value) count++
    if (filterStatus.value) count++
    if (filterStartDate.value || filterEndDate.value) count++
    if (filterPendingChat.value) count++
    return count
  })

  function onOpenFilters() {
    stagedFilterStatus.value = filterStatus.value
    stagedFilterStartDate.value = filterStartDate.value
    stagedFilterEndDate.value = filterEndDate.value
    stagedFilterPendingChat.value = filterPendingChat.value
  }

  function applyFilters() {
    filterStatus.value = stagedFilterStatus.value
    filterStartDate.value = stagedFilterStartDate.value
    filterEndDate.value = stagedFilterEndDate.value
    filterPendingChat.value = stagedFilterPendingChat.value
  }

  function clearFilters() {
    stagedFilterStatus.value = ''
    stagedFilterStartDate.value = ''
    stagedFilterEndDate.value = ''
    stagedFilterPendingChat.value = false
    searchQuery.value = ''
    filterStatus.value = ''
    filterStartDate.value = ''
    filterEndDate.value = ''
    filterPendingChat.value = false
  }

  const query = computed(() => ({
    search: searchQuery.value,
    status: filterStatus.value,
    startDate: filterStartDate.value,
    endDate: filterEndDate.value,
    pendingChat: filterPendingChat.value,
  }))

  const {
    items: proposals,
    total: totalProposals,
    pending,
    loadingMore,
    hasMore,
    loadMore,
    reset: refresh,
  } = useInfiniteList<ProposalDTO>('/api/proposals', query, { itemsPerPage })

  const mobileSentinelRef = ref<HTMLElement | null>(null)
  useIntersectionObserver(mobileSentinelRef, ([entry]) => {
    if (entry?.isIntersecting && hasMore.value && !loadingMore.value) {
      loadMore()
    }
  }, { threshold: 0.1 })

  const { copy } = useClipboard()

  const isModalOpen = ref(false)
  const isAIWizardOpen = ref(false)
  const isHistoryOpen = ref(false)
  const isChatOpen = ref(false)
  const isPaywallOpen = ref(false)
  const paywallReason = ref('')

  const isContractModalOpen = ref(false)
  const contractProposal = ref<ProposalDTO | null>(null)
  const localContractText = ref('')
  const isSavingContract = ref(false)
  const copiedContractTag = ref('')

  // Pusher Integration
  let notificationChannel: any = null
  const currentProfile = ref<any>(null)

  async function setupGlobalNotifications() {
    try {
      const profile = await $fetch<any>('/api/profile')
      currentProfile.value = profile
      const { pusher } = usePusher()
      if (pusher && profile) {
        notificationChannel = pusher.subscribe(`private-profile-${profile._id}`)
        notificationChannel.bind('proposal-notification', () => {
          refresh()
        })
      }
    } catch (e) {
      console.error('Failed to setup global notifications', e)
    }
  }

  const siteOrigin = ref('')

  onMounted(() => {
    const config = useRuntimeConfig()
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    siteOrigin.value = isLocal ? window.location.origin : (config.public.publicProposalUrl || window.location.origin)
    setupGlobalNotifications()
  })

  watch(() => route.query.new, (isNew) => {
    if (isNew === 'true') {
      isAIWizardOpen.value = true
      router.replace({ query: { ...route.query, new: undefined } })
    }
  }, { immediate: true })

  onUnmounted(() => {
    if (notificationChannel) notificationChannel.unbind_all()
  })

  function openChat(proposal: ProposalDTO) {
    selectedProposal.value = proposal
    isChatOpen.value = true
  }

  const isAcceptedModalOpen = ref(false)
  const isSuccessModalOpen = ref(false)
  const lastCreatedProposal = ref<ProposalDTO | null>(null)
  const selectedProposal = ref<ProposalDTO | null>(null)
  const selectedProposalHistory = ref<any[]>([])
  const isLoadingHistory = ref(false)
  const prefilledItems = ref<any[] | null>(null)
  const isAiAssistedProposal = ref(false)
  const isSubmitting = ref(false)
  const isResending = ref<string | null>(null)
  const proposalFormRef = ref<any>(null)

  const { notify, confirm: confirmAlert } = useAlerts()

  async function openHistory(proposal: ProposalDTO) {
    selectedProposal.value = proposal
    isHistoryOpen.value = true
    isLoadingHistory.value = true
    try {
      const data: any = await $fetch(`/api/proposals/${proposal._id}`)
      selectedProposalHistory.value = data.history || []
    } catch (e) {
      notify('Erro', 'Não foi possível carregar o histórico')
    } finally {
      isLoadingHistory.value = false
    }
  }

  function canShowChatButton(status: string) {
    return !['draft', 'accepted', 'bounced'].includes(status)
  }

  function canShowWhatsappButton(status: string) {
    return status !== 'draft'
  }

  function sendWhatsapp(proposal: ProposalDTO) {
    if (!proposal.client.phone) return
    const phone = proposal.client.phone.replace(/\D/g, '')

    if (proposal.status === 'accepted') {
      window.open(`https://wa.me/55${phone}`, '_blank')
      isSuccessModalOpen.value = false
      return
    }

    const tokenPart = proposal.token ? `?t=${proposal.token}` : ''
    const baseOrigin = siteOrigin.value || window.location.origin
    const message = encodeURIComponent(
      `Olá, ${proposal.client.name}! \n\n` +
      `Preparei o orçamento *${proposal.title}* para você.\n\n` +
      `Confira os detalhes e aprove através deste link:\n` +
      `${baseOrigin}/p/${proposal.slug}${tokenPart}\n\n` +
      `Qualquer dúvida, estou à disposição!\n\n` +
      `*${currentProfile.value?.name || ''}*`
    )

    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank')
    isSuccessModalOpen.value = false
  }

  function resendEmail(proposal: any) {
    const proposalId = typeof proposal === 'string' ? proposal : proposal._id
    const targetProposal = typeof proposal === 'object' ? proposal : (proposals.value || []).find((p: any) => p._id === proposalId)
    const clientName = targetProposal?.client?.name ? ` para ${targetProposal.client.name}` : ''

    confirmAlert({
      title: 'Reenviar E-mail',
      description: `Tem certeza que deseja reenviar o e-mail de notificação deste orçamento${clientName}?`,
      actionText: 'Sim, Reenviar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        isResending.value = proposalId
        try {
          await $fetch(`/api/proposals/${proposalId}/resend`, { method: 'POST' })
          notify('Sucesso', 'E-mail reenviado com sucesso!')
        } catch (e: any) {
          notify('Erro', e.data?.statusMessage || 'Erro ao reenviar e-mail')
        } finally {
          isResending.value = null
        }
      }
    })
  }

  async function shareProposal(proposal: ProposalDTO) {
    const tokenPart = proposal.token ? `?t=${proposal.token}` : ''
    const baseOrigin = siteOrigin.value || window.location.origin
    const url = `${baseOrigin}/p/${proposal.slug}${tokenPart}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Orçamento: ${proposal.title}`,
          text: `Confira o orçamento que preparei para você: ${proposal.title}`,
          url: url
        })
      } catch (err) {
        console.log('Share cancelled or failed', err)
      }
    } else {
      copy(url)
      notify('Sucesso', 'Link copiado! Seu navegador não suporta compartilhamento nativo.')
    }
  }

  function openModal(proposal: ProposalDTO | null = null, items: any[] | null = null, aiAssisted: boolean = false, prefilledClient: any = null) {
    selectedProposal.value = proposal
    prefilledItems.value = items
    isAiAssistedProposal.value = aiAssisted
    isModalOpen.value = true
    if (prefilledClient) {
      nextTick(() => {
        if (proposalFormRef.value) {
          proposalFormRef.value.setPrefilledClientAndStep(prefilledClient, 2)
        }
      })
    }
  }

  async function onAIWizardSuccess(payload: any) {
    const items = Array.isArray(payload) ? payload : (payload.items || [])
    const client = !Array.isArray(payload) ? payload.client : null

    const formattedItems = items.map((item: any) => ({
      catalogItemId: item.id || item._id || undefined,
      name: item.name,
      description: item.description,
      price: Number(item.price) || 0,
      quantity: (item.quantity && Number(item.quantity) > 0) ? Number(item.quantity) : 1
    }))

    try {
      const draftPayload: any = {
        status: 'draft',
        aiAssisted: true,
        items: formattedItems,
        client: {
          name: client?.name || 'Cliente Sem Nome',
          email: client?.email || 'cliente@exemplo.com',
          phone: client?.phone || '',
          address: client?.address || ''
        }
      }

      if (client?._id || client?.id) {
        draftPayload.clientId = client._id || client.id
      }

      const createdDraft: any = await $fetch('/api/proposals', {
        method: 'POST',
        body: draftPayload
      })

      await refresh()
      notify('Rascunho Criado', 'O rascunho do orçamento foi gerado e aberto para edição!')
      openModal(createdDraft, null, true)
    } catch (err: any) {
      console.error('[onAIWizardSuccess] Erro ao criar rascunho automático:', err)
      openModal(null, formattedItems, true, client)
    }
  }

  function downloadPdf(proposal: ProposalDTO) {
    window.open(`/api/proposals/${proposal._id}/pdf`, '_blank')
  }

  function openPreview(proposal: ProposalDTO) {
    selectedProposal.value = proposal
    if (proposal.status === 'accepted') {
      isAcceptedModalOpen.value = true
    } else {
      const tokenPart = proposal.token ? `&t=${proposal.token}` : ''
      const url = `${siteOrigin.value}/p/${proposal.slug}?preview=true${tokenPart}`
      window.open(url, '_blank')
    }
  }

  function whatsappLink(phone: string) {
    return `https://wa.me/55${phone.replace(/\D/g, '')}`
  }

  async function handleProposalSubmit(formData: Partial<ProposalDTO>) {
    isSubmitting.value = true
    try {
      const isNew = !selectedProposal.value
      const method = isNew ? 'POST' : 'PUT'
      const endpoint = isNew 
        ? '/api/proposals'
        : `/api/proposals/${selectedProposal.value?._id}`

      if (isNew && isAiAssistedProposal.value) {
        formData.aiAssisted = true
      }

      const res: any = await $fetch(endpoint, {
        method,
        body: formData
      })
      
      isModalOpen.value = false
      refresh()

      if (isNew && res.status === 'created' && res.client?.phone) {
        lastCreatedProposal.value = res
        isSuccessModalOpen.value = true
      } else {
        notify('Sucesso', 'Orçamento processado com sucesso!')
      }
    } catch (e: any) {
      if (e.statusCode === 402) {
        paywallReason.value = 'criar e enviar orçamentos'
        isPaywallOpen.value = true
      } else {
        const html = parseApiErrors(e)
        notify(html ? 'Dados inválidos' : 'Erro', html ?? (e.data?.statusMessage || 'Erro ao processar orçamento'))
      }
    } finally {
      isSubmitting.value = false
    }
  }

  const statusMap: any = {
    draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
    created: { label: 'Criado', color: 'bg-blue-50 text-blue-700' },
    sent: { label: 'Enviado', color: 'bg-blue-100 text-blue-800' },
    delivered: { label: 'Entregue', color: 'bg-emerald-100 text-emerald-800' },
    viewed: { label: 'Visualizado', color: 'bg-indigo-100 text-indigo-800' },
    opened: { label: 'Aberto', color: 'bg-sky-100 text-sky-800' },
    clicked: { label: 'Clicado', color: 'bg-orange-100 text-orange-800' },
    accepted: { label: 'Aceito', color: 'bg-emerald-600 text-white' },
    pending_signature: { label: 'Aguardando Assinatura', color: 'bg-amber-600 text-white' },
    signed: { label: 'Aceito & Assinado', color: 'bg-emerald-700 text-white' },
    expired: { label: 'Expirado', color: 'bg-red-100 text-red-800' },
    failed: { label: 'Erro Envio', color: 'bg-red-600 text-white' },
    rejected: { label: 'Rejeitado', color: 'bg-red-700 text-white' }
  }

  /** Opções do filtro agrupadas por fase do ciclo de vida (ordem = PROPOSAL_PHASES) */
  const statusFilterGroups = computed(() => {
    const byPhase = new Map<string, { label: string; value: string }[]>()
    for (const [value, info] of Object.entries(statusMap)) {
      const phase = getProposalPhase(value)
      if (!byPhase.has(phase)) byPhase.set(phase, [])
      byPhase.get(phase)!.push({ label: (info as any).label, value })
    }
    return PROPOSAL_PHASES
      .map((p) => ({ label: p.label, options: byPhase.get(p.key) || [] }))
      .filter((g) => g.options.length > 0)
  })

  const getStatusVariant = (proposal: ProposalDTO | string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    const statusStr = typeof proposal === 'string' ? proposal : proposal.status
    const sigStatus = typeof proposal === 'object' ? proposal.signature?.status : null

    // Assinatura só conta APÓS o aceite
    if (sigStatus === 'signed') return 'success'
    if (statusStr === 'accepted' && (sigStatus === 'pending' || sigStatus === 'signing')) return 'warning'
    return getPhaseBadgeVariant(getProposalPhase(statusStr))
  }

  function getProposalStatusLabel(proposal: ProposalDTO) {
    if (!proposal) return ''
    if (proposal.signature?.status === 'signed') return 'Aceito & Assinado'
    if (proposal.status === 'accepted' && (proposal.signature?.status === 'pending' || proposal.signature?.status === 'signing')) return 'Aguardando Assinatura'
    if (proposal.status === 'accepted') return 'Aceito'
    if (proposal.status === 'rejected') return 'Rejeitado'
    if (proposal.status === 'failed' || proposal.status === 'bounced') return 'Erro no Envio'
    const item = statusMap[proposal.status]
    return item?.label || proposal.status
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  function confirmDeleteProposal(proposal: ProposalDTO) {
    confirmAlert({
      title: 'Excluir Orçamento',
      description: `Tem certeza que deseja excluir "${proposal.title || proposal.code}"? Essa ação não pode ser desfeita.`,
      variant: 'destructive',
      actionText: 'Excluir',
      onConfirm: async () => {
        try {
          await $fetch(`/api/proposals/${proposal._id}`, { method: 'DELETE' })
          notify('Sucesso', 'Orçamento excluído com sucesso.')
          refresh()
        } catch (e: any) {
          notify('Erro', e.data?.statusMessage || 'Erro ao excluir orçamento')
        }
      }
    })
  }

  const contractVariables = [
    { tag: '{{nome_cliente}}', desc: 'Nome do cliente' },
    { tag: '{{valor_total}}', desc: 'Valor final do orçamento' },
    { tag: '{{dias_validade}}', desc: 'Dias restantes de validade' },
    { tag: '{{forma_pagamento}}', desc: 'Método (À Vista / Cartão)' },
    { tag: '{{detalhes_pagamento}}', desc: 'Ex: Parcelado em 3x...' },
    { tag: '{{nome_empresa}}', desc: 'Nome do perfil' },
    { tag: '{{nome_fantasia}}', desc: 'Nome fantasia da empresa' },
    { tag: '{{razao_social}}', desc: 'Razão social da empresa' },
    { tag: '{{cnpj}}', desc: 'CNPJ do prestador' },
    { tag: '{{telefone}}', desc: 'Telefone do prestador' },
    { tag: '{{endereco_prestador}}', desc: 'Endereço completo' },
    { tag: '{{cep}}', desc: 'CEP do prestador' },
    { tag: '{{rua}}', desc: 'Rua do prestador' },
    { tag: '{{numero}}', desc: 'Número do endereço' },
    { tag: '{{bairro}}', desc: 'Bairro do prestador' },
    { tag: '{{cidade}}', desc: 'Cidade do prestador' },
    { tag: '{{estado}}', desc: 'Estado do prestador' },
    { tag: '{{data_inicio}}', desc: 'Data de início do serviço' },
  ]

  function openContractModal(proposal: ProposalDTO) {
    contractProposal.value = proposal
    localContractText.value = proposal.contractText || ''
    isContractModalOpen.value = true
  }

  function copyContractTag(tag: string) {
    copy(tag)
    copiedContractTag.value = tag
    setTimeout(() => copiedContractTag.value = '', 2000)
  }

  async function saveContract() {
    if (!contractProposal.value) return
    isSavingContract.value = true
    try {
      await $fetch(`/api/proposals/${contractProposal.value._id}/contract`, {
        method: 'PATCH',
        body: { contractText: localContractText.value }
      })
      isContractModalOpen.value = false
      refresh()
      notify('Sucesso', 'Contrato atualizado com sucesso!')
    } catch (e: any) {
      notify('Erro', e.data?.statusMessage || 'Erro ao salvar contrato')
    } finally {
      isSavingContract.value = false
    }
  }

  return {
    creditLabel,
    searchQuery,
    filterStatus,
    filterStartDate,
    filterEndDate,
    filterPendingChat,
    stagedFilterStatus,
    stagedFilterStartDate,
    stagedFilterEndDate,
    stagedFilterPendingChat,
    onOpenFilters,
    applyFilters,
    showProposalInfo,
    selectedProposalInfo,
    openProposalInfo,
    activeFiltersCount,
    clearFilters,
    proposals,
    totalProposals,
    pending,
    loadingMore,
    hasMore,
    loadMore,
    refresh,
    mobileSentinelRef,
    isModalOpen,
    isAIWizardOpen,
    isHistoryOpen,
    isChatOpen,
    isPaywallOpen,
    paywallReason,
    isContractModalOpen,
    contractProposal,
    localContractText,
    isSavingContract,
    copiedContractTag,
    isAcceptedModalOpen,
    isSuccessModalOpen,
    lastCreatedProposal,
    selectedProposal,
    selectedProposalHistory,
    isLoadingHistory,
    prefilledItems,
    isAiAssistedProposal,
    isSubmitting,
    isResending,
    proposalFormRef,
    siteOrigin,
    openChat,
    openHistory,
    canShowChatButton,
    canShowWhatsappButton,
    sendWhatsapp,
    resendEmail,
    shareProposal,
    openModal,
    onAIWizardSuccess,
    downloadPdf,
    openPreview,
    whatsappLink,
    handleProposalSubmit,
    statusMap,
    statusFilterGroups,
    getStatusVariant,
    getProposalStatusLabel,
    formatDate,
    confirmDeleteProposal,
    contractVariables,
    openContractModal,
    copyContractTag,
    saveContract,
    Plus,
    Search,
    Mail,
    LinkIcon,
    Pencil,
    Share2,
    RefreshCcw,
    Loader2,
    FileText,
    ExternalLink,
    Eye,
    Download,
    CheckCircle2,
    MessageCircle,
    CreditCard,
    Banknote,
    History,
    Sparkles,
    Send,
    CheckCheck,
    X,
    ArrowLeft,
    ArrowRight,
    Trash2,
    MoreVertical,
    Check,
    Copy,
    Variable,
    DropdownMenuRoot,
    DropdownMenuTrigger,
    DropdownMenuPortal,
    DropdownMenuContent,
    DropdownMenuItem,
  }
}
