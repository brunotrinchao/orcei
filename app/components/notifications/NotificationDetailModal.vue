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
  Mail
} from 'lucide-vue-next'
import BaseDialog from '~/components/ui/BaseDialog.vue'
import BaseButton from '~/components/ui/BaseButton.vue'
import type { INotificationItem } from '~/composables/useNotifications'

const props = defineProps<{
  open: boolean
  notification: INotificationItem | null
}>()

const emit = defineEmits(['update:open'])

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
  if (typeof val !== 'number') return 'R$ 0,00'
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function goToProposal(proposalId?: string) {
  emit('update:open', false)
  router.push('/orcamentos')
}

function goToReports() {
  emit('update:open', false)
  router.push('/relatorios')
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
        'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300': notification.type === 'proposal_accepted',
        'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300': notification.type === 'proposal_rejected',
        'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40 text-blue-800 dark:text-blue-300': notification.type === 'proposal_sent',
        'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/40 text-indigo-800 dark:text-indigo-300': notification.type === 'report_generated'
      }">
        <CheckCircle2 v-if="notification.type === 'proposal_accepted'" class="w-7 h-7 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <XCircle v-else-if="notification.type === 'proposal_rejected'" class="w-7 h-7 text-rose-600 dark:text-rose-400 shrink-0" />
        <Send v-else-if="notification.type === 'proposal_sent'" class="w-7 h-7 text-blue-600 dark:text-blue-400 shrink-0" />
        <Sparkles v-else-if="notification.type === 'report_generated'" class="w-7 h-7 text-indigo-600 dark:text-indigo-400 shrink-0" />

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
            <p class="text-gray-900 dark:text-white font-black text-sm uppercase">{{ notification.details?.paymentMethod || 'A combinar' }}</p>
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

    </div>

    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <BaseButton variant="secondary" @click="emit('update:open', false)">Fechar</BaseButton>

        <BaseButton 
          v-if="notification?.type === 'proposal_accepted' || notification?.type === 'proposal_rejected'" 
          variant="primary" 
          @click="goToProposal(notification.details?.proposalId)"
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
      </div>
    </template>
  </BaseDialog>
</template>
