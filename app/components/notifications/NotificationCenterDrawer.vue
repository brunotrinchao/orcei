<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Bell,
  CheckCircle2,
  XCircle,
  Send,
  Sparkles,
  CheckCheck,
  Inbox,
  Clock,
  AlertTriangle,
  UserPlus,
  Coins
} from 'lucide-vue-next'
import BaseDrawer from '~/components/ui/BaseDrawer.vue'
import NotificationDetailModal from './NotificationDetailModal.vue'
import { useNotifications, type INotificationItem } from '~/composables/useNotifications'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})

const {
  notifications,
  unreadCount,
  isLoading,
  fetchNotifications,
  markAsRead,
  markAllAsRead
} = useNotifications()

const activeTab = ref<'unread' | 'all'>('unread')
const selectedNotification = ref<INotificationItem | null>(null)
const isDetailModalOpen = ref(false)

watch(() => props.open, (val) => {
  if (val) {
    activeTab.value = 'unread'
    fetchNotifications()
  }
})

const filteredNotifications = computed(() => {
  if (activeTab.value === 'unread') {
    return notifications.value.filter(n => !n.read)
  }
  return notifications.value
})

const getCardColor = (type) => {
  if (type === 'admin_new_signup') return 'amber'
  if (type === 'admin_credit_purchase') return 'emerald'
  return 'blue'
}

function openDetail(notification: INotificationItem) {
  selectedNotification.value = notification
  if (!notification.read) {
    markAsRead(notification._id)
  }
  isDetailModalOpen.value = true
}

function timeAgo(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Agora mesmo'
  const minutes = Math.floor(diffInSeconds / 60)
  if (minutes < 60) return `Há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Há ${hours} h`
  const days = Math.floor(hours / 24)
  return `Há ${days} d`
}
</script>

<template>
  <BaseDrawer v-model:open="isOpen" title="Central de Notificações"
    description="Acompanhe orçamentos e relatórios em tempo real" position="right" size="md">
    <template #context-menu>
      <div class="p-2 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-[.5rem]">
        <Bell class="w-4 h-4" />
      </div>
    </template>

    <div class="space-y-4">
      <!-- Abas de Filtro e Atalhos -->
      <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div class="flex bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-xl gap-1">
          <button type="button" @click="activeTab = 'unread'"
            class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            :class="activeTab === 'unread' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'">
            Não lidas
            <span v-if="unreadCount > 0"
              class="px-1.5 py-0.5 text-[9px] font-semibold bg-blue-600 text-white rounded-full">
              {{ unreadCount }}
            </span>
          </button>
          <button type="button" @click="activeTab = 'all'"
            class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer"
            :class="activeTab === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'">
            Todas
          </button>
        </div>

        <button v-if="unreadCount > 0" type="button" @click="markAllAsRead"
          class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 transition-colors cursor-pointer">
          <CheckCheck class="w-3.5 h-3.5" />
          Marcar lidas
        </button>
      </div>

      <!-- Lista de Cards de Notificação -->
      <div class="space-y-3">
        <div v-if="isLoading" class="p-8 text-center text-xs font-bold text-slate-400">
          Carregando notificações...
        </div>

        <div v-else-if="filteredNotifications.length === 0"
          class="p-12 text-center flex flex-col items-center justify-center gap-3">
          <div class="p-4 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-400">
            <Inbox class="w-8 h-8" />
          </div>
          <p class="text-xs font-black uppercase text-slate-400 tracking-wider">
            {{ activeTab === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação por aqui' }}
          </p>
        </div>
        <BaseCard v-for="n in filteredNotifications" :key="n._id" compact :color="getCardColor(n.type)"
          @click="openDetail(n)" class="transition-all cursor-pointer relative">
          <template #header>
            <!-- Avatar do usuário (cadastro/compra de crédito) no lugar do ícone genérico -->
            <img v-if="n.details?.userAvatar && (n.type === 'admin_new_signup' || n.type === 'admin_credit_purchase')"
              :src="n.details.userAvatar" class="w-9 h-9 rounded-xl object-cover shrink-0 ring-2"
              :class="n.type === 'admin_new_signup' ? 'ring-orange-400' : 'ring-emerald-400'" alt="" />
            <!-- Ícone Distintivo por Tipo -->
            <div v-else class="p-2.5 rounded-xl shrink-0" :class="{
              'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400': n.type === 'proposal_accepted' || n.type === 'admin_credit_purchase',
              'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400': n.type === 'proposal_rejected',
              'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400': n.type === 'proposal_sent',
              'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400': n.type === 'report_generated',
              'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400': n.type === 'google_sync_failed',
              'bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400': n.type === 'admin_new_signup'
            }">
              <CheckCircle2 v-if="n.type === 'proposal_accepted'" class="w-4 h-4" />
              <XCircle v-else-if="n.type === 'proposal_rejected'" class="w-4 h-4" />
              <Send v-else-if="n.type === 'proposal_sent'" class="w-4 h-4" />
              <Sparkles v-else-if="n.type === 'report_generated'" class="w-4 h-4" />
              <AlertTriangle v-else-if="n.type === 'google_sync_failed'" class="w-4 h-4" />
              <UserPlus v-else-if="n.type === 'admin_new_signup'" class="w-4 h-4" />
              <Coins v-else-if="n.type === 'admin_credit_purchase'" class="w-4 h-4" />
            </div>
            <!-- Conteúdo Breve do Card -->
            <div class="flex-1 space-y-1 pr-3">
              <div class="flex grid grid-column items-center">
                <h4 class="text-xs font-semibold uppercase tracking-wider"
                  :class="!n.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'">
                  {{ n.title }}
                </h4>
                <span class="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                  <Clock class="w-3 h-3 text-slate-400" />
                  {{ timeAgo(n.createdAt) }}
                </span>
              </div>

            </div>

            <div v-if="!n.read" class="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-1.5"></div>
          </template>
          <p class="text-xs font-base text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {{ n.summary }}
          </p>
          <!-- Indicador Azul de Não Lido -->
        </BaseCard>
      </div>
    </div>
  </BaseDrawer>

  <!-- Modal Detalhado ao clicar no Card -->
  <NotificationDetailModal v-model:open="isDetailModalOpen" :notification="selectedNotification"
    @close-all="emit('update:open', false)" />
</template>
