import { computed, ref } from "vue"
import {
  FileText,
  DollarSign,
  Calendar,
  Eye,
  MessageSquare,
  ExternalLink,
  Copy,
  Pencil,
  Mail,
  Phone,
  User,
  Package,
  Sparkles,
  CreditCard,
  Lock,
  CheckCircle2,
  AlertCircle,
  CheckCheck,
  Clock
} from "lucide-vue-next"
import type { ProposalDTO } from "../../../../types"
import { ProposalSignatureStatus } from "../../../../types/enums"
import { getAllowedActions, getPhaseBadgeVariant, getPhaseInfo, getProposalPhase, type ProposalAction } from "~/utils/proposalLifecycle"

export function useProposalDetailModal(
  props: { open: boolean; proposal: ProposalDTO | null },
  emit: (e: "update:open" | "edit", val: any) => void
) {
  const { notify } = useAlerts()

  const currentStatus = computed(() => {
    if (!props.proposal) return { label: 'Rascunho', variant: 'default' as const }
    const sig = props.proposal.signature?.status
    const st = props.proposal.status

    if (sig === ProposalSignatureStatus.SIGNED) {
      return { label: 'Aceito & Assinado', variant: 'success' as const }
    }
    // Assinatura pendente só é exibida APÓS o aceite
    if (st === 'accepted' && (sig === ProposalSignatureStatus.PENDING || sig === ProposalSignatureStatus.SIGNING)) {
      return { label: 'Aguardando Assinatura', variant: 'warning' as const }
    }
    if (st === 'accepted') {
      return { label: 'Aceito', variant: 'success' as const }
    }
    if (st === 'sent' || st === 'delivered' || st === 'opened' || st === 'clicked' || st === 'viewed' || st === 'pending') {
      return { label: 'Aguardando Aceite', variant: 'info' as const }
    }
    const phase = getProposalPhase(st, sig)
    return {
      label: getPhaseInfo(phase).label,
      variant: getPhaseBadgeVariant(phase)
    }
  })

  const calculatedViewsCount = computed(() => {
    if (typeof props.proposal?.viewsCount === "number" && props.proposal.viewsCount > 0) {
      return props.proposal.viewsCount
    }
    if (Array.isArray((props.proposal as any)?.history)) {
      return (props.proposal as any).history.filter((h: any) =>
        ["viewed", "opened", "clicked", "signer_viewed_document"].includes(h.action)
      ).length
    }
    return props.proposal?.viewsCount || 0
  })

  const calculatedLastViewedAt = computed(() => {
    if (props.proposal?.lastViewedAt) {
      return props.proposal.lastViewedAt
    }
    if (Array.isArray((props.proposal as any)?.history)) {
      const viewEvents = (props.proposal as any).history.filter((h: any) =>
        ["viewed", "opened", "clicked", "signer_viewed_document"].includes(h.action)
      )
      return viewEvents.length > 0 ? viewEvents[0].timestamp : null
    }
    return null
  })

  const canOpenPublicLink = computed(() => {
    if (!props.proposal?.status) return false
    const st = props.proposal.status
    return st !== "draft" && st !== "rejected"
  })

  /** Ação permitida p/ status atual (fonte central: proposalLifecycle) */
  function can(action: ProposalAction) {
    if (!props.proposal) return false
    return getAllowedActions(props.proposal.status, props.proposal.signature?.status ?? null).includes(action)
  }

  const publicUrl = computed(() => {
    if (!props.proposal?.slug) return ""
    const config = useRuntimeConfig()
    const isLocal =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1")
    const baseOrigin =
      typeof window !== "undefined"
        ? isLocal
          ? window.location.origin
          : config.public.publicProposalUrl || window.location.origin
        : ""
    const tokenPart = (props.proposal as any).token
      ? `?t=${(props.proposal as any).token}`
      : ""
    return `${baseOrigin}/p/${props.proposal.slug}${tokenPart}`
  })

  function copyPublicLink() {
    if (!canOpenPublicLink.value) {
      notify(
        "Aviso",
        "O link público só fica disponível após a proposta ser enviada ao cliente."
      )
      return
    }
    if (!publicUrl.value) return
    navigator.clipboard.writeText(publicUrl.value)
    notify("Sucesso", "Link público copiado para a área de transferência!")
  }

  function openPublicLink() {
    if (!canOpenPublicLink.value) {
      notify(
        "Aviso",
        "O link público só fica disponível após a proposta ser enviada ao cliente."
      )
      return
    }
    if (!publicUrl.value) return
    window.open(publicUrl.value, "_blank")
  }

  function openWhatsApp() {
    if (!props.proposal?.client?.phone) return
    const cleanPhone = props.proposal.client.phone.replace(/\D/g, "")
    const message = encodeURIComponent(
      `Olá ${props.proposal.client.name || ""}, segue o link do seu orçamento "${props.proposal.title}":\n${publicUrl.value}`
    )
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, "_blank")
  }

  function formatCurrency(val?: number) {
    return (val ?? 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  function formatDate(dateStr?: string | Date) {
    if (!dateStr) return "Não informada"
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return "Não informada"
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  }

  function formatPhone(phone?: string) {
    if (!phone) return "Não informado"
    const digits = phone.replace(/\D/g, "")
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    }
    return phone
  }

  const calculatedSubtotal = computed(() => {
    if (!props.proposal) return 0
    if (
      props.proposal.totals?.subtotal !== undefined &&
      props.proposal.totals.subtotal > 0
    ) {
      return props.proposal.totals.subtotal
    }
    if (props.proposal.items && props.proposal.items.length > 0) {
      return props.proposal.items.reduce(
        (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
        0
      )
    }
    return 0
  })

  const calculatedAdditional = computed(() => {
    if (!props.proposal) return 0
    return props.proposal.totals?.additional || 0
  })

  const calculatedDiscount = computed(() => {
    if (!props.proposal) return 0
    return props.proposal.totals?.discount ?? props.proposal.discountAmount ?? 0
  })

  const calculatedTotal = computed(() => {
    if (!props.proposal) return 0
    if (
      props.proposal.totals?.final !== undefined &&
      props.proposal.totals.final > 0
    ) {
      return props.proposal.totals.final
    }
    if (
      props.proposal.totalAmount !== undefined &&
      props.proposal.totalAmount > 0
    ) {
      return props.proposal.totalAmount
    }
    return (
      calculatedSubtotal.value +
      calculatedAdditional.value -
      calculatedDiscount.value
    )
  })

  const expirationDate = computed(() => {
    if (!props.proposal) return null
    return props.proposal.expiresAt || props.proposal.expirationDate || null
  })

  const paymentTermsText = computed(() => {
    if (!props.proposal) return "Condição padrão"
    const cfg = (props.proposal as any).paymentConfig || {}
    const method = cfg.method || "cash"
    if (method === "cash") {
      const desc = cfg.cashDiscount
        ? ` ${cfg.cashDiscount}% de desconto à vista`
        : ""
      return `${desc}`
    }
    if (method === "installments") {
      const count = cfg.installments || 1
      const partVal = calculatedTotal.value / count
      return `Parcelado em ${count}x de ${formatCurrency(partVal)}`
    }
    if (method === "hybrid") {
      const count = cfg.installments || 1
      return `Entrada + ${count}x parcelado`
    }
    return "Conforme orçamento"
  })

  const isRequestingSignature = ref(false)

  async function requestDigitalSignature() {
    if (!props.proposal) return
    if (!props.proposal.client?.name || !props.proposal.client?.email) {
      notify("Aviso", "O cliente precisa ter nome e e-mail cadastrados para solicitar a assinatura eletrônica.")
      return
    }
    isRequestingSignature.value = true
    try {
      const res: any = await $fetch(`/api/proposals/${props.proposal._id}/signature`, { method: "POST" })
      notify("Sucesso", "Solicitação de assinatura eletrônica enviada para a fila! O status agora é 'Aguardando assinatura'.")
      if (props.proposal) {
        props.proposal.signature = res.signature || { provider: "assinafy", status: "pending" }
      }
    } catch (err: any) {
      notify("Erro", err.data?.statusMessage || "Erro ao solicitar assinatura eletrônica.")
    } finally {
      isRequestingSignature.value = false
    }
  }

  return {
    currentStatus,
    can,
    calculatedViewsCount,
    calculatedLastViewedAt,
    canOpenPublicLink,
    publicUrl,
    copyPublicLink,
    openPublicLink,
    openWhatsApp,
    formatCurrency,
    formatDate,
    formatPhone,
    calculatedSubtotal,
    calculatedAdditional,
    calculatedDiscount,
    calculatedTotal,
    expirationDate,
    paymentTermsText,
    isRequestingSignature,
    requestDigitalSignature,
    ProposalSignatureStatus,
    FileText,
    DollarSign,
    Calendar,
    Eye,
    MessageSquare,
    ExternalLink,
    Copy,
    Pencil,
    Mail,
    Phone,
    User,
    Package,
    Sparkles,
    CreditCard,
    Lock,
    CheckCircle2,
    AlertCircle,
    CheckCheck,
    Clock
  }
}
