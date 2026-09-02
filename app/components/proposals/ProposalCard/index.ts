import { computed } from 'vue'
import { MessageCircle, MoreVertical, History, Download, RefreshCcw, Mail, Pencil, Trash2 } from 'lucide-vue-next'
import { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuContent, DropdownMenuItem } from 'radix-vue'
import type { ProposalDTO } from '../../../../types'
import { getAllowedActions, type ProposalAction } from '~/utils/proposalLifecycle'

export function useProposalCard(props: {
  proposal: ProposalDTO
  statusVariant: 'default' | 'success' | 'warning' | 'error' | 'info'
  statusLabel: string
  isResending: boolean
}) {
  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const isExpiredState = computed(() =>
    props.proposal.status === 'expired' ||
    (props.proposal.status !== 'accepted' && new Date(props.proposal.expiresAt).getTime() <= Date.now())
  )

  const validityPercent = computed(() => {
    if (props.proposal.status === 'accepted') return 100
    const created = new Date(props.proposal.createdAt).getTime()
    const expires = new Date(props.proposal.expiresAt).getTime()
    if (!expires || expires <= created) return 0
    const remaining = expires - Date.now()
    const total = expires - created
    return Math.max(0, Math.min(100, (remaining / total) * 100))
  })

  const validityBarColor = computed(() =>
    props.proposal.status === 'accepted'
      ? 'bg-green-600'
      : isExpiredState.value
        ? 'bg-red-400'
        : 'bg-green-500'
  )

  function canShowChatButton(status: string) {
    return !['draft', 'accepted', 'bounced'].includes(status)
  }

  function canShowWhatsappButton(status: string) {
    return status !== 'draft'
  }

  /** Ação permitida p/ o status atual (fonte central: proposalLifecycle) */
  function can(action: ProposalAction) {
    return getAllowedActions(props.proposal.status, props.proposal.signature?.status ?? null, props.proposal.expiresAt).includes(action)
  }

  return {
    formatDate,
    isExpiredState,
    validityPercent,
    validityBarColor,
    can,
    canShowChatButton,
    canShowWhatsappButton,
    MessageCircle,
    MoreVertical,
    History,
    Download,
    RefreshCcw,
    Mail,
    Pencil,
    Trash2,
    DropdownMenuRoot,
    DropdownMenuTrigger,
    DropdownMenuPortal,
    DropdownMenuContent,
    DropdownMenuItem
  }
}
