import { ref, computed, watch, nextTick } from 'vue'
import { isToday, isYesterday, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Phone, MessageCircle, CheckCircle2, Download, ExternalLink, MapPin, X, Loader2, AlertCircle, PencilLine, ThumbsDown, Eye, FileText, CreditCard, Banknote, Clock, Shield, Mail, Send, Check, CheckCheck, Instagram, Youtube, Facebook, Twitter, FileSignature } from 'lucide-vue-next'
import type { ProposalDTO } from '~/types'

export function usePublicProposalPage() {
  const { notify, confirm: confirmAlert } = useAlerts()
  const { hasConsent } = useCookieConsent()
  const route = useRoute()
  const config = useRuntimeConfig()

  const { t: token, preview } = route.query
  const isPreview = computed(() => preview === 'true')
  const { data: proposal, refresh, error, pending } = useLazyFetch<ProposalDTO>(`/api/proposals/public/${route.params.slug}`, {
    query: computed(() => ({ 
      t: token, 
      preview: preview,
      consent: hasConsent.value ? 'accepted' : 'declined'
    }))
  })

  const isAccepting = ref(false)
  const isAcceptConfirmModalOpen = ref(false)
  const isTermsOpen = ref(false)
  const isChatModalOpen = ref(false)

  const selectedMethod = ref<'cash' | 'credit_card'>('cash')
  const selectedUpsells = ref<string[]>([])
  const actionType = ref<'decline' | 'request_changes'>('decline')
  const actionNotes = ref('')
  const isActionModalOpen = ref(false)
  const isSubmittingAction = ref(false)

  const {
    messages,
    newMessage,
    isSendingMessage,
    groupedMessages,
    loadMessages,
    sendMessage,
    markAsRead,
    connectPusher
  } = useProposalChat({
    role: 'client',
    slug: route.params.slug as string,
    token: token as string
  })

  const chatMessagesRef = ref<HTMLElement | null>(null)

  function scrollToBottom() {
    nextTick(() => {
      if (chatMessagesRef.value) {
        chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
      }
    })
  }

  watch(isChatModalOpen, async (val) => {
    if (val) {
      scrollToBottom()
      await loadMessages()
      if (proposal.value?.unreadMessages > 0) {
        await markAsRead()
        proposal.value.unreadMessages = 0
      }
    }
  })

  watch(messages, () => {
    if (isChatModalOpen.value) {
      scrollToBottom()
    }
  }, { deep: true })

  watch(proposal, (newProposal) => {
    if (newProposal) {
      connectPusher(newProposal._id)
    }
  }, { immediate: true })

  const formatMessageTime = (date: any) => {
    return format(new Date(date), 'HH:mm')
  }

  const selectedUpsellList = computed(() => {
    if (!proposal.value?.upsellItems) return []
    return proposal.value.upsellItems.filter(item => selectedUpsells.value.includes(item._id!))
  })

  const activeUpsellTotal = computed(() => {
    return selectedUpsellList.value.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  })

  const computedTotals = computed(() => {
    if (!proposal.value) return { subtotal: 0, discount: 0, additional: 0, final: 0 }
    const subtotalBase = proposal.value.totals.subtotal + activeUpsellTotal.value
    const additional = proposal.value.totals.additional || 0
    const discount = proposal.value.totals.discount || 0
    const base = subtotalBase + additional - discount
    
    let final = base
    if (selectedMethod.value === 'cash') {
      final = base * (1 - (proposal.value.paymentConfig.cashDiscount / 100))
    }
    
    return {
      subtotal: subtotalBase,
      discount,
      additional,
      final
    }
  })

  const finalTotal = computed(() => computedTotals.value.final)

  function openAcceptModal() {
    if (isPreview.value) return
    isAcceptConfirmModalOpen.value = true
  }

  async function handleAccept(autoOpenSignature = false) {
    if (isPreview.value) return
    isAccepting.value = true
    try {
      const res: any = await $fetch(`/api/proposals/public/accept`, {
        method: 'POST',
        body: { 
          slug: route.params.slug,
          token: token,
          paymentMethod: selectedMethod.value,
          selectedUpsells: selectedUpsells.value
        }
      })
      isAcceptConfirmModalOpen.value = false
      await refresh()

      const sigUrl = res?.proposal?.signature?.signingUrl || proposal.value?.signature?.signingUrl
      if (autoOpenSignature && sigUrl) {
        window.open(sigUrl, '_blank')
        notify('Sucesso', 'Proposta aceita com sucesso! Redirecionando para a assinatura digital do contrato...')
      } else {
        notify('Sucesso', 'Proposta aceita com sucesso! Um e-mail com o link de assinatura do contrato foi enviado.')
      }
    } catch (e: any) {
      notify('Erro', e.data?.statusMessage || 'Erro ao aceitar orçamento')
    } finally {
      isAccepting.value = false
    }
  }

  function openActionModal(type: 'decline' | 'request_changes') {
    if (isPreview.value) return
    if (type === 'request_changes') {
      isChatModalOpen.value = true
      return
    }
    actionType.value = type
    actionNotes.value = ''
    isActionModalOpen.value = true
  }

  async function handleAction() {
    if (isPreview.value) return
    if (!actionNotes.value) return notify('Aviso', 'Por favor, escreva uma mensagem.')
    
    isSubmittingAction.value = true
    try {
      await $fetch(`/api/proposals/public/action`, {
        method: 'POST',
        body: {
          slug: route.params.slug,
          token: token,
          type: actionType.value,
          notes: actionNotes.value
        }
      })
      isActionModalOpen.value = false
      notify('Sucesso', actionType.value === 'decline' ? 'Orçamento recusado.' : 'Solicitação de alteração enviada!')
      await refresh()
    } catch (e) {
      notify('Erro', 'Erro ao processar ação')
    } finally {
      isSubmittingAction.value = false
    }
  }

  const formatDate = (date: any, format?: any) => {
    if (!date) return 'Sem validade'
    const newFormat = format || { day: '2-digit', month: '2-digit', year: 'numeric' }
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'Sem validade'
    return d.toLocaleDateString('pt-BR', newFormat)
  }

  const profileWhatsapp = computed(() => {
    const phones = (proposal.value?.profileId as any)?.contact?.phones
    if (!phones?.length) return null
    const wa = phones.find((p: any) => p?.isWhatsapp)
    return (wa || phones[0])?.number || null
  })

  const { data: systemInfo } = useFetch<any>('/api/system/status', { key: 'system-status' })

  const social = computed(() => (proposal.value?.profileId as any)?.contact?.social || {})

  const socialLinks = computed(() => {
    const s = social.value
    const links: { key: string; url: string; icon: any; hoverClass: string }[] = []
    if (s.instagram) {
      links.push({ key: 'instagram', url: `https://instagram.com/${s.instagram.replace('@', '')}`, icon: Instagram, hoverClass: 'hover:text-pink-400' })
    }
    if (s.facebook) {
      links.push({ key: 'facebook', url: `https://facebook.com/${s.facebook.replace('@', '')}`, icon: Facebook, hoverClass: 'hover:text-blue-400' })
    }
    if (s.twitter) {
      links.push({ key: 'twitter', url: `https://x.com/${s.twitter.replace('@', '')}`, icon: Twitter, hoverClass: 'hover:text-gray-300' })
    }
    if (s.youtube) {
      links.push({ key: 'youtube', url: `https://youtube.com/${s.youtube.replace('@', '')}`, icon: Youtube, hoverClass: 'hover:text-red-400' })
    }
    return links
  })

  const statusMap: any = {
    draft:      { label: 'Rascunho',   variant: 'default' },
    created:    { label: 'Enviado',    variant: 'info' },
    sent:       { label: 'Enviado',    variant: 'info' },
    delivered:  { label: 'Entregue',   variant: 'info' },
    opened:     { label: 'Aberto',     variant: 'info' },
    clicked:    { label: 'Visualizado', variant: 'info' },
    viewed:     { label: 'Visualizado', variant: 'info' },
    pending:    { label: 'Pendente',   variant: 'warning' },
    scheduled:  { label: 'Agendado',   variant: 'info' },
    received:   { label: 'Recebido',   variant: 'info' },
    bounced:    { label: 'Enviado',    variant: 'info' },
    delayed:    { label: 'Enviado',    variant: 'info' },
    failed:     { label: 'Enviado',    variant: 'info' },
    suppressed: { label: 'Enviado',    variant: 'info' },
    accepted:   { label: 'Aceito',     variant: 'success' },
    expired:    { label: 'Expirado',   variant: 'error' },
    declined:   { label: 'Recusado',   variant: 'error' },
    changes_requested: { label: 'Revisão Solicitada', variant: 'warning' }
  }

  const isExpired = computed(() => {
    if (!proposal.value) return false
    if (proposal.value.status === 'expired') return true
    if (proposal.value.status === 'accepted') return false
    if (!proposal.value.expiresAt) return false
    const exp = new Date(proposal.value.expiresAt)
    return exp.getTime() < Date.now()
  })

  const whatsappRenewMessage = computed(() => {
    if (!proposal.value) return ''
    const code = proposal.value.code || ''
    const title = proposal.value.title || ''
    const clientName = proposal.value.client?.name || ''
    const expStr = formatDate(proposal.value.expiresAt)
    return `Olá! Gostaria de solicitar a renovação da proposta ${code} ("${title}"), que venceu em ${expStr}. Cliente: ${clientName}.`
  })

  const whatsappRenewLink = computed(() => {
    if (!profileWhatsapp.value) return '#'
    const cleanPhone = profileWhatsapp.value.replace(/\D/g, '')
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappRenewMessage.value)}`
  })

  return {
    proposal,
    pending,
    error,
    refresh,
    isPreview,
    isAccepting,
    isAcceptConfirmModalOpen,
    isTermsOpen,
    isChatModalOpen,
    selectedMethod,
    selectedUpsells,
    actionType,
    actionNotes,
    isActionModalOpen,
    isSubmittingAction,
    messages,
    newMessage,
    isSendingMessage,
    groupedMessages,
    loadMessages,
    sendMessage,
    chatMessagesRef,
    formatMessageTime,
    computedTotals,
    finalTotal,
    openAcceptModal,
    handleAccept,
    openActionModal,
    handleAction,
    formatDate,
    profileWhatsapp,
    systemInfo,
    socialLinks,
    statusMap,
    isExpired,
    whatsappRenewMessage,
    whatsappRenewLink,
    Phone,
    MessageCircle,
    CheckCircle2,
    Download,
    ExternalLink,
    MapPin,
    X,
    Loader2,
    AlertCircle,
    PencilLine,
    ThumbsDown,
    Eye,
    FileText,
    CreditCard,
    Banknote,
    Clock,
    Shield,
    Mail,
    Send,
    Check,
    CheckCheck,
    FileSignature,
  }
}
