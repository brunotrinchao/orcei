import { Notification } from '../models/Notification'

export const NotificationService = {
  /**
   * Cria e persiste uma nova notificação para o usuário
   */
  async createNotification(params: {
    profileId: string
    type: 'proposal_accepted' | 'proposal_rejected' | 'proposal_sent' | 'report_generated'
    title: string
    summary: string
    details?: Record<string, any>
    metadata?: Record<string, any>
  }) {
    const notification = await Notification.create({
      profileId: params.profileId,
      type: params.type,
      title: params.title,
      summary: params.summary,
      details: params.details || {},
      metadata: params.metadata || {},
      read: false
    })

    return notification
  },

  /**
   * Busca lista de notificações com filtros e paginação
   */
  async getNotifications(profileId: string, options: { unreadOnly?: boolean; limit?: number; skip?: number } = {}) {
    const query: any = { profileId }
    if (options.unreadOnly) {
      query.read = false
    }

    const limit = options.limit || 50
    const skip = options.skip || 0

    const [items, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ profileId, read: false })
    ])

    return {
      items,
      total,
      unreadCount
    }
  },

  /**
   * Marca uma notificação individual como lida
   */
  async markAsRead(profileId: string, notificationId: string) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, profileId },
      { $set: { read: true } },
      { new: true }
    )

    const unreadCount = await Notification.countDocuments({ profileId, read: false })

    return {
      notification,
      unreadCount
    }
  },

  /**
   * Marca todas as notificações não lidas do usuário como lidas
   */
  async markAllAsRead(profileId: string) {
    await Notification.updateMany(
      { profileId, read: false },
      { $set: { read: true } }
    )

    return {
      success: true,
      unreadCount: 0
    }
  },

  /**
   * Retorna apenas a contagem de notificações não lidas
   */
  async getUnreadCount(profileId: string) {
    return Notification.countDocuments({ profileId, read: false })
  }
}
