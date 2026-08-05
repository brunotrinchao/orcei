<script setup lang="ts">
import {
  CheckCircle2,
  XCircle,
  Send,
  Sparkles,
  ExternalLink,
  FileText,
  Download,
  Calendar,
  User,
  DollarSign,
  Mail,
  AlertTriangle,
  Settings,
  UserPlus,
  Coins
} from 'lucide-vue-next'
import BaseDialog from '~/components/ui/BaseDialog.vue'
import BaseButton from '~/components/ui/BaseButton.vue'
import type { INotificationItem } from '~/composables/useNotifications'

const props = defineProps<{
  open: boolean
  notification: INotificationItem | null
}>()

const emit = defineEmits(['update:open', 'close-all'])

const router = useRouter()

function handleOpenUpdate(val: boolean) {
  if (!val) {
    emit('update:open', false)
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatCurrency(val?: number) {
  if (typeof val !== 'number' || isNaN(val)) return 'Não informado'
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatPaymentMethod(method?: string) {
  if (!method) return 'A combinar'
  const map: Record<string, string> = {
    credit_card: 'Cartão de Crédito',
    pix: 'PIX',
    cash: 'À Vista',
    bank_transfer: 'Transferência Bancária',
    boleto: 'Boleto'
  }
  return map[method] || method
}

function goToProposal() {
  emit('update:open', false)
  emit('close-all')
  const notif = props.notification
  const filterTerm =
    notif?.details?.code ||
    notif?.metadata?.code ||
    notif?.details?.title ||
    ''

  if (filterTerm) {
    const cleanTerm = filterTerm.replace('#', '')
    router.push(`/orcamentos?search=${encodeURIComponent(cleanTerm)}`)
  } else {
    router.push('/orcamentos')
  }
}

function goToReports() {
  emit('update:open', false)
  emit('close-all')
  router.push('/relatorios')
}

function goToIntegrations() {
  emit('update:open', false)
  emit('close-all')
  router.push('/configuracoes')
}

function goToUser() {
  emit('update:open', false)
  emit('close-all')
  router.push('/admin/users')
}

function downloadPdf(reportId?: string) {
  if (reportId) {
    window.open(`/api/reports/${reportId}/pdf`, '_blank')
  }
}
</script>

<template>
  <BaseDialog
    :open="open"
    @update:open="handleOpenUpdate"
    title="Detalhes da Notificação"
    size="lg"
  >
    <div v-if="notification" class="space-y-6">
      
      <!-- Cabeçalho com badge por tipo de notificação -->
      <div class="flex items-center gap-3 p-4 rounded-2xl border" :class="{
        'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300': notification.type === 'proposal_accepted' || notification.type === 'admin_credit_purchase',
        'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300': notification.type === 'proposal_rejected',
        'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40 text-blue-800 dark:text-blue-300': notification.type === 'proposal_sent',
        'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/40 text-indigo-800 dark:text-indigo-300': notification.type === 'report_generated',
        'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300': notification.type === 'google_sync_failed',
        'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/40 text-orange-800 dark:text-orange-300': notification.type === 'admin_new_signup'
      }">
        <img
          v-if="notification.details?.userAvatar && (notification.type === 'admin_new_signup' || notification.type === 'admin_credit_purchase')"
          :src="notification.details.userAvatar"
          class="w-9 h-9 rounded-xl object-cover shrink-0 ring-2"
          :class="notification.type === 'admin_new_signup' ? 'ring-orange-400' : 'ring-emerald-400'"
          alt=""
        />
        <CheckCircle2 v-else-if="notification.type === 'proposal_accepted'" class="w-7 h-7 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <XCircle v-else-if="notification.type === 'proposal_rejected'" class="w-7 h-7 text-rose-600 dark:text-rose-400 shrink-0" />
        <Send v-else-if="notification.type === 'proposal_sent'" class="w-7 h-7 text-blue-600 dark:text-blue-400 shrink-0" />
        <Sparkles v-else-if="notification.type === 'report_generated'" class="w-7 h-7 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <AlertTriangle v-else-if="notification.type === 'google_sync_failed'" class="w-7 h-7 text-amber-600 dark:text-amber-400 shrink-0" />
        <UserPlus v-else-if="notification.type === 'admin_new_signup'" class="w-7 h-7 text-orange-600 dark:text-orange-400 shrink-0" />
        <Coins v-else-if="notification.type === 'admin_credit_purchase'" class="w-7 h-7 text-emerald-600 dark:text-emerald-400 shrink-0" />

        <div>
          <h3 class="text-base font-black uppercase tracking-wider">{{ notification.title }}</h3>
          <p class="text-xs font-bold opacity-80">{{ formatDate(notification.createdAt) }}</p>
        </div>
      </div>

      <!-- Conteúdo Específico por Tipo -->
      <div v-if="notification.type === 'proposal_accepted'" class="space-y-4">
        <p class="text-sm font-bold text-gray-700 dark:text-gray-200 leading-relaxed">
          {{ notification.summary }}
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 text-xs font-bold">
          <div class="space-y-1">
            <span class="text-gray-400 uppercase">Código da Proposta</span>
            <p class="text-gray-900 dark:text-white font-black text-sm">#{{ notification.details?.code || notification.metadata?.code }}</p>
          </div>
          <div class="space-y-1">
            <span class="text-gray-400 uppercase">Cliente</span>
            <p class="text-gray-900 dark:text-white font-black text-sm">{{ notification.details?.clientName || 'Cliente' }}</p>
          </div>
          <div class="space-y-1">
            <span class="text-gray-400 uppercase">Valor Final Aprovado</span>
            <p class="text-emerald-600 dark:text-emerald-400 font-black text-base">{{ formatCurrency(notification.details?.finalValue) }}</p>
          </div>
          <div class="space-y-1">
            <span class="text-gray-400 uppercase">Forma de Pagamento</span>
            <p class="text-gray-900 dark:text-white font-black text-sm uppercase">{{ formatPaymentMethod(notification.details?.paymentMethod) }}</p>
          </div>
        </div>
      </div>

      <div v-else-if="notification.type === 'proposal_rejected'" class="space-y-4">
        <p class="text-sm font-bold text-gray-700 dark:text-gray-200 leading-relaxed">
          {{ notification.summary }}
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 text-xs font-bold">
          <div class="space-y-1">
            <span class="text-gray-400 uppercase">Código da Proposta</span>
            <p class="text-gray-900 dark:text-white font-black text-sm">#{{ notification.details?.code || notification.metadata?.code }}</p>
          </div>
          <div class="space-y-1">
            <span class="text-gray-400 uppercase">Cliente</span>
            <p class="text-gray-900 dark:text-white font-black text-sm">{{ notification.details?.clientName || 'Cliente' }}</p>
          </div>
        </div>
      </div>

      <div v-else-if="notification.type === 'proposal_sent'" class="space-y-4">
        <p class="text-sm font-bold text-gray-700 dark:text-gray-200 leading-relaxed">
          {{ notification.summary }}
        </p>

        <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 text-xs font-bold space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-gray-400 uppercase">E-mail Destinatário:</span>
            <span class="text-gray-900 dark:text-white font-black">{{ notification.details?.clientEmail }}</span>
          </div>
          <div v-if="notification.details?.url" class="flex justify-between items-center">
            <span class="text-gray-400 uppercase">Link Público:</span>
            <a :href="notification.details?.url" target="_blank" class="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1">
              Abrir Proposta <ExternalLink class="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <div v-else-if="notification.type === 'report_generated'" class="space-y-4">
        <p class="text-sm font-bold text-gray-700 dark:text-gray-200">
          {{ notification.summary }}
        </p>

        <!-- Markdown do Relatório -->
        <div v-if="notification.details?.content" class="prose prose-blue dark:prose-invert max-w-none p-6 bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-100 dark:border-gray-800 max-h-[50vh] overflow-y-auto">
          <div v-html="$md ? $md.render(notification.details.content) : notification.details.content"></div>
        </div>
      </div>

      <div v-else-if="notification.type === 'google_sync_failed'" class="space-y-4">
        <p class="text-sm font-bold text-gray-700 dark:text-gray-200 leading-relaxed">
          {{ notification.summary }}
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 text-xs font-bold">
          <div class="space-y-1">
            <span class="text-gray-400 uppercase">Código da Proposta</span>
            <p class="text-gray-900 dark:text-white font-black text-sm">#{{ notification.details?.code }}</p>
          </div>
          <div class="space-y-1">
            <span class="text-gray-400 uppercase">Falhou</span>
            <p class="text-gray-900 dark:text-white font-black text-sm capitalize">{{ notification.details?.stage === 'calendar' ? 'Agenda do Google' : 'Google Drive' }}</p>
          </div>
        </div>
      </div>

      <div v-else-if="notification.type === 'admin_new_signup'" class="space-y-4">
        <p class="text-sm font-bold text-gray-700 dark:text-gray-200 leading-relaxed">
          {{ notification.summary }}
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 text-xs font-bold">
          <div class="space-y-1">
            <span class="text-gray-400 uppercase flex items-center gap-1"><User class="w-3 h-3" /> Nome</span>
            <p class="text-gray-900 dark:text-white font-black text-sm">{{ notification.details?.userName || 'Não informado' }}</p>
          </div>
          <div class="space-y-1">
            <span class="text-gray-400 uppercase flex items-center gap-1"><Mail class="w-3 h-3" /> E-mail</span>
            <p class="text-gray-900 dark:text-white font-black text-sm">{{ notification.details?.userEmail || 'Não informado' }}</p>
          </div>
        </div>
      </div>

      <div v-else-if="notification.type === 'admin_credit_purchase'" class="space-y-4">
        <p class="text-sm font-bold text-gray-700 dark:text-gray-200 leading-relaxed">
          {{ notification.summary }}
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 text-xs font-bold">
          <div class="space-y-1">
            <span class="text-gray-400 uppercase flex items-center gap-1"><User class="w-3 h-3" /> Nome</span>
            <p class="text-gray-900 dark:text-white font-black text-sm">{{ notification.details?.userName || 'Não informado' }}</p>
          </div>
          <div class="space-y-1">
            <span class="text-gray-400 uppercase flex items-center gap-1"><Mail class="w-3 h-3" /> E-mail</span>
            <p class="text-gray-900 dark:text-white font-black text-sm">{{ notification.details?.userEmail || 'Não informado' }}</p>
          </div>
          <div class="space-y-1">
            <span class="text-gray-400 uppercase flex items-center gap-1"><Coins class="w-3 h-3" /> Créditos Comprados</span>
            <p class="text-emerald-600 dark:text-emerald-400 font-black text-base">{{ notification.details?.creditsAdded }}</p>
          </div>
          <div class="space-y-1">
            <span class="text-gray-400 uppercase">Novo Saldo</span>
            <p class="text-gray-900 dark:text-white font-black text-sm">{{ notification.details?.newBalance }}</p>
          </div>
        </div>
      </div>

    </div>

    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <BaseButton variant="secondary" @click="emit('update:open', false)">Fechar</BaseButton>

        <BaseButton 
          v-if="notification?.type === 'proposal_accepted' || notification?.type === 'proposal_rejected'" 
          variant="primary" 
          @click="goToProposal()"
        >
          <FileText class="w-4 h-4 mr-2" />
          Ver Orçamentos
        </BaseButton>

        <BaseButton
          v-else-if="notification?.type === 'report_generated'"
          variant="primary"
          @click="goToReports"
        >
          <Sparkles class="w-4 h-4 mr-2" />
          Meus Relatórios
        </BaseButton>

        <BaseButton
          v-else-if="notification?.type === 'google_sync_failed'"
          variant="primary"
          @click="goToIntegrations"
        >
          <Settings class="w-4 h-4 mr-2" />
          Ir para Integrações
        </BaseButton>

        <BaseButton
          v-else-if="notification?.type === 'admin_new_signup' || notification?.type === 'admin_credit_purchase'"
          variant="primary"
          @click="goToUser"
        >
          <User class="w-4 h-4 mr-2" />
          Ver Usuários
        </BaseButton>
      </div>
    </template>
  </BaseDialog>
</template>
