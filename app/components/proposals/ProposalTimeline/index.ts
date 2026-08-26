import { computed } from 'vue'
import { 
  PlusCircle, 
  Send, 
  CheckCheck, 
  MailOpen, 
  MousePointerClick, 
  Eye, 
  Check, 
  XCircle,
  AlertCircle,
  Clock,
  Inbox,
  RefreshCcw,
  FileText
} from 'lucide-vue-next'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface HistoryItem {
  _id: string
  type: 'system' | 'email'
  action: string
  details?: any
  timestamp: string
}

export function useProposalTimeline(props: { history: HistoryItem[] }) {
  const filteredHistory = computed(() => {
    if (!props.history || props.history.length === 0) return []

    const result: HistoryItem[] = []

    for (const currentItem of props.history) {
      if (result.length === 0) {
        result.push(currentItem)
        continue
      }

      const previousItem = result[result.length - 1]

      const isSameAction = currentItem.action === previousItem.action && currentItem.type === previousItem.type

      if (isSameAction) {
        const dCurr = new Date(currentItem.timestamp)
        const dPrev = new Date(previousItem.timestamp)

        const isSameDayAndHour =
          !isNaN(dCurr.getTime()) &&
          !isNaN(dPrev.getTime()) &&
          dCurr.getFullYear() === dPrev.getFullYear() &&
          dCurr.getMonth() === dPrev.getMonth() &&
          dCurr.getDate() === dPrev.getDate() &&
          dCurr.getHours() === dPrev.getHours()

        if (isSameDayAndHour) {
          continue
        }
      }

      result.push(currentItem)
    }

    return result
  })

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'created': 'Orçamento criado',
      'sent': 'E-mail enviado',
      'delivered': 'E-mail entregue',
      'opened': 'E-mail aberto',
      'clicked': 'Link clicado no e-mail',
      'viewed': 'Orçamento visualizado pelo cliente',
      'accepted': 'Orçamento aceito',
      'declined': 'Orçamento recusado',
      'bounced': 'Erro na entrega (Bounced)',
      'complained': 'Marcado como Spam',
      'scheduled': 'Envio agendado',
      'received': 'E-mail recebido pelo servidor de destino',
      'delayed': 'Entrega atrasada',
      'failed': 'Falha no envio',
      'suppressed': 'Envio suprimido (Lista de rejeição)',
      'google_sync': 'Sincronizado com Google',
      'signature_requested': 'Solicitação de assinatura enviada',
      'uploaded': 'Documento gerado no Assinafy',
      'signed': 'Documento assinado digitalmente',
      'rejected': 'Assinatura recusada pelo cliente'
    }
    return labels[action] || action
  }

  const getActionIcon = (action: string) => {
    const icons: Record<string, any> = {
      'created': PlusCircle,
      'sent': Send,
      'delivered': CheckCheck,
      'opened': MailOpen,
      'clicked': MousePointerClick,
      'viewed': Eye,
      'accepted': Check,
      'declined': XCircle,
      'bounced': AlertCircle,
      'complained': AlertCircle,
      'scheduled': Clock,
      'received': Inbox,
      'delayed': Clock,
      'failed': AlertCircle,
      'suppressed': XCircle,
      'google_sync': RefreshCcw,
      'signature_requested': Clock,
      'uploaded': FileText,
      'signed': CheckCheck,
      'rejected': XCircle
    }
    return icons[action] || AlertCircle
  }

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'created': 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800',
      'sent': 'text-blue-500 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/60',
      'delivered': 'text-green-500 dark:text-green-400 bg-green-100 dark:bg-green-950/60',
      'opened': 'text-sky-500 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/60',
      'clicked': 'text-orange-500 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/60',
      'viewed': 'text-indigo-500 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/60',
      'accepted': 'text-emerald-500 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60',
      'declined': 'text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-950/60',
      'bounced': 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/60',
      'complained': 'text-black dark:text-gray-200 bg-gray-200 dark:bg-gray-700',
      'scheduled': 'text-blue-400 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40',
      'received': 'text-green-400 dark:text-green-300 bg-green-50 dark:bg-green-950/40',
      'delayed': 'text-yellow-500 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/40',
      'failed': 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/60',
      'suppressed': 'text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-800',
      'google_sync': 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40',
      'signature_requested': 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40',
      'uploaded': 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40',
      'signed': 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60',
      'rejected': 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/60'
    }
    return colors[action] || 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
  }

  const formatDate = (date: string) => {
    return format(new Date(date), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })
  }

  return {
    filteredHistory,
    getActionLabel,
    getActionIcon,
    getActionColor,
    formatDate
  }
}
