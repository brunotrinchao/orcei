<script setup lang="ts">
import { 
  PlusCircle, 
  Send, 
  CheckCheck, 
  MailOpen, 
  MousePointerClick, 
  Eye, 
  Check, 
  XCircle,
  AlertCircle
} from 'lucide-vue-next'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface HistoryItem {
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
    Inbox
  } from 'lucide-vue-next'
  ...
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
      'suppressed': 'Envio suprimido (Lista de rejeição)'
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
      'suppressed': XCircle
    }
    return icons[action] || AlertCircle
  }

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'created': 'text-gray-500 bg-gray-100',
      'sent': 'text-blue-500 bg-blue-100',
      'delivered': 'text-green-500 bg-green-100',
      'opened': 'text-purple-500 bg-purple-100',
      'clicked': 'text-orange-500 bg-orange-100',
      'viewed': 'text-indigo-500 bg-indigo-100',
      'accepted': 'text-emerald-500 bg-emerald-100',
      'declined': 'text-red-500 bg-red-100',
      'bounced': 'text-red-600 bg-red-100',
      'complained': 'text-black bg-gray-200',
      'scheduled': 'text-blue-400 bg-blue-50',
      'received': 'text-green-400 bg-green-50',
      'delayed': 'text-yellow-500 bg-yellow-50',
      'failed': 'text-red-700 bg-red-100',
      'suppressed': 'text-gray-700 bg-gray-200'
    }
    return colors[action] || 'text-gray-500 bg-gray-100'
  }

const formatDate = (date: string) => {
  return format(new Date(date), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })
}
</script>

<template>
  <div class="flow-root">
    <ul role="list" class="-mb-8">
      <li v-for="(event, eventIdx) in history" :key="event._id">
        <div class="relative pb-8">
          <span v-if="eventIdx !== history.length - 1" class="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
          <div class="relative flex space-x-3">
            <div>
              <span :class="[getActionColor(event.action), 'flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white']">
                <component :is="getActionIcon(event.action)" class="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <div class="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
              <div>
                <p class="text-sm text-gray-500">
                  {{ getActionLabel(event.action) }}
                  <span v-if="event.details?.paymentMethod" class="font-medium text-gray-900">
                    via {{ event.details.paymentMethod === 'cash' ? 'À vista' : 'Cartão' }}
                  </span>
                </p>
              </div>
              <div class="whitespace-nowrap text-right text-sm text-gray-500">
                <time :datetime="event.timestamp">{{ formatDate(event.timestamp) }}</time>
              </div>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
