<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  DialogRoot, 
  DialogPortal, 
  DialogOverlay, 
  DialogContent, 
  DialogTitle, 
  DialogDescription, 
  DialogClose 
} from 'radix-vue'
import {
  Bell,
  X,
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
import BaseButton from '~/components/ui/BaseButton.vue'
import NotificationDetailModal from './NotificationDetailModal.vue'
import { useNotifications, type INotificationItem } from '~/composables/useNotifications'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits(['update:open'])

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

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    activeTab.value = 'unread'
    fetchNotifications()
  }
})

function handleOpenUpdate(val: boolean) {
  if (!val) {
    emit('update:open', false)
  }
}

const filteredNotifications = computed(() => {
  if (activeTab.value === 'unread') {
    return notifications.value.filter(n => !n.read)
  }
  return notifications.value
})

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
  <DialogRoot :open="open" @update:open="handleOpenUpdate">
    <DialogPortal>
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <DialogOverlay class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50" />
      </Transition>

      <Transition
        enter-active-class="transition duration-300 ease-out transform"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition duration-200 ease-in transform"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
      >
        <DialogContent class="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col outline-none">
          
          <!-- Header da Central de Notificações -->
          <div class="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="p-2.5 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Bell class="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle class="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Central de Notificações
                  </DialogTitle>
                  <DialogDescription class="text-xs font-bold text-slate-400">
                    Acompanhe orçamentos e relatórios em tempo real
                  </DialogDescription>
                </div>
              </div>

              <DialogClose @click="emit('update:open', false)" class="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X class="w-5 h-5" />
              </DialogClose>
            </div>

            <!-- Abas de Filtro e Atalhos -->
            <div class="flex items-center justify-between pt-2">
              <div class="flex bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-xl gap-1">
                <button
                  @click="activeTab = 'unread'"
                  class="px-3 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1.5"
                  :class="activeTab === 'unread' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
                >
                  Não lidas
                  <span v-if="unreadCount > 0" class="px-1.5 py-0.5 text-[9px] font-extrabold bg-blue-600 text-white rounded-full">
                    {{ unreadCount }}
                  </span>
                </button>
                <button
                  @click="activeTab = 'all'"
                  class="px-3 py-1.5 text-xs font-black rounded-lg transition-all"
                  :class="activeTab === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
                >
                  Todas
                </button>
              </div>

              <button
                v-if="unreadCount > 0"
                @click="markAllAsRead"
                class="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 transition-colors"
              >
                <CheckCheck class="w-3.5 h-3.5" />
                Marcar lidas
              </button>
            </div>
          </div>

          <!-- Lista de Cards de Notificação -->
          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            <div v-if="isLoading" class="p-8 text-center text-xs font-bold text-slate-400">
              Carregando notificações...
            </div>

            <div v-else-if="filteredNotifications.length === 0" class="p-12 text-center flex flex-col items-center justify-center gap-3">
              <div class="p-4 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-400">
                <Inbox class="w-8 h-8" />
              </div>
              <p class="text-xs font-black uppercase text-slate-400 tracking-wider">
                {{ activeTab === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação por aqui' }}
              </p>
            </div>

            <div
              v-for="n in filteredNotifications"
              :key="n._id"
              @click="openDetail(n)"
              class="p-4 rounded-2xl border transition-all cursor-pointer relative group flex gap-3 items-start"
              :class="
                n.type === 'admin_new_signup' ? 'bg-orange-50/80 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800/50 shadow-sm' :
                n.type === 'admin_credit_purchase' ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/50 shadow-sm' :
                !n.read ? 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40 shadow-sm' : 'bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700'
              "
            >
              <!-- Avatar do usuário (cadastro/compra de crédito) no lugar do ícone genérico -->
              <img
                v-if="n.details?.userAvatar && (n.type === 'admin_new_signup' || n.type === 'admin_credit_purchase')"
                :src="n.details.userAvatar"
                class="w-9 h-9 rounded-xl object-cover shrink-0 ring-2"
                :class="n.type === 'admin_new_signup' ? 'ring-orange-400' : 'ring-emerald-400'"
                alt=""
              />
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
                <div class="flex justify-between items-center">
                  <h4 class="text-xs font-black uppercase tracking-wider" :class="!n.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'">
                    {{ n.title }}
                  </h4>
                  <span class="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Clock class="w-3 h-3 text-slate-400" />
                    {{ timeAgo(n.createdAt) }}
                  </span>
                </div>
                <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {{ n.summary }}
                </p>
              </div>

              <!-- Indicador Azul de Não Lido -->
              <div v-if="!n.read" class="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-1.5"></div>
            </div>
          </div>

        </DialogContent>
      </Transition>
    </DialogPortal>
  </DialogRoot>

  <!-- Modal Detalhado ao clicar no Card -->
  <NotificationDetailModal
    v-model:open="isDetailModalOpen"
    :notification="selectedNotification"
  />
</template>
