import { ref, onMounted, onUnmounted } from 'vue'

export interface INotificationItem {
  _id: string
  profileId: string
  type: 'proposal_accepted' | 'proposal_rejected' | 'proposal_sent' | 'report_generated'
  title: string
  summary: string
  details?: Record<string, any>
  read: boolean
  metadata?: Record<string, any>
  createdAt: string
  updatedAt?: string
}

const notifications = ref<INotificationItem[]>([])
const unreadCount = ref<number>(0)
const isLoading = ref<boolean>(false)
const isDrawerOpen = ref<boolean>(false)
let timer: any = null

export function useNotifications() {
  async function fetchUnreadCount() {
    try {
      const data = await $fetch<{ unreadCount: number }>('/api/notifications/unread-count')
      if (data && typeof data.unreadCount === 'number') {
        unreadCount.value = data.unreadCount
      }
    } catch (e) {
      // Silently catch in polling
    }
  }

  async function fetchNotifications(filterUnread = false) {
    isLoading.value = true
    try {
      const data = await $fetch<{ items: INotificationItem[]; total: number; unreadCount: number }>('/api/notifications', {
        query: filterUnread ? { unread: 'true' } : {}
      })
      if (data) {
        notifications.value = data.items || []
        unreadCount.value = data.unreadCount || 0
      }
    } catch (e) {
      console.error('[useNotifications] Erro ao buscar notificações:', e)
    } finally {
      isLoading.value = false
    }
  }

  async function markAsRead(id: string) {
    // Atualização otimista local
    const target = notifications.value.find(n => n._id === id)
    if (target && !target.read) {
      target.read = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }

    try {
      const res = await $fetch<{ notification: INotificationItem; unreadCount: number }>(`/api/notifications/${id}/read`, {
        method: 'PATCH'
      })
      if (res) {
        unreadCount.value = res.unreadCount
      }
    } catch (e) {
      console.error('[useNotifications] Erro ao marcar como lida:', e)
    }
  }

  async function markAllAsRead() {
    notifications.value.forEach(n => { n.read = true })
    unreadCount.value = 0

    try {
      await $fetch('/api/notifications/read-all', { method: 'PATCH' })
    } catch (e) {
      console.error('[useNotifications] Erro ao marcar todas como lidas:', e)
    }
  }

  function startPolling(intervalMs = 15000) {
    if (import.meta.client && !timer) {
      fetchUnreadCount()
      timer = setInterval(fetchUnreadCount, intervalMs)
    }
  }

  function stopPolling() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    isDrawerOpen,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    startPolling,
    stopPolling
  }
}
