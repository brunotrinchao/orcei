import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../server/models/Notification', () => ({
  Notification: {
    create: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateMany: vi.fn()
  }
}))

import { Notification } from '../server/models/Notification'
import { NotificationService } from '../server/services/NotificationService'

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createNotification', () => {
    it('cria notificação com read=false', async () => {
      const mockCreated = {
        _id: 'notif-1',
        profileId: 'prof-123',
        type: 'proposal_accepted',
        title: 'Orçamento Aceito!',
        summary: 'Cliente aceitou proposta',
        read: false
      }
      vi.mocked(Notification.create).mockResolvedValue(mockCreated as any)

      const result = await NotificationService.createNotification({
        profileId: 'prof-123',
        type: 'proposal_accepted',
        title: 'Orçamento Aceito!',
        summary: 'Cliente aceitou proposta'
      })

      expect(Notification.create).toHaveBeenCalledWith({
        profileId: 'prof-123',
        type: 'proposal_accepted',
        title: 'Orçamento Aceito!',
        summary: 'Cliente aceitou proposta',
        details: {},
        metadata: {},
        read: false
      })
      expect(result.read).toBe(false)
    })
  })

  describe('getNotifications', () => {
    it('busca lista de notificações com contagem de não lidas', async () => {
      const mockChain = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          { _id: 'notif-1', title: 'Notif 1', read: false },
          { _id: 'notif-2', title: 'Notif 2', read: true }
        ])
      }
      vi.mocked(Notification.find).mockReturnValue(mockChain as any)
      vi.mocked(Notification.countDocuments)
        .mockResolvedValueOnce(2) // total
        .mockResolvedValueOnce(1) // unreadCount

      const result = await NotificationService.getNotifications('prof-123')

      expect(result.items).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.unreadCount).toBe(1)
    })

    it('aplica filtro unreadOnly se solicitado', async () => {
      const mockChain = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          { _id: 'notif-1', title: 'Notif 1', read: false }
        ])
      }
      vi.mocked(Notification.find).mockReturnValue(mockChain as any)
      vi.mocked(Notification.countDocuments)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1)

      await NotificationService.getNotifications('prof-123', { unreadOnly: true })

      expect(Notification.find).toHaveBeenCalledWith({ profileId: 'prof-123', read: false })
    })
  })

  describe('markAsRead', () => {
    it('marca notificação individual como lida e re-calcula unreadCount', async () => {
      vi.mocked(Notification.findOneAndUpdate).mockResolvedValue({ _id: 'notif-1', read: true } as any)
      vi.mocked(Notification.countDocuments).mockResolvedValue(0)

      const result = await NotificationService.markAsRead('prof-123', 'notif-1')

      expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'notif-1', profileId: 'prof-123' },
        { $set: { read: true } },
        { new: true }
      )
      expect(result.unreadCount).toBe(0)
    })
  })

  describe('markAllAsRead', () => {
    it('marca todas as notificações não lidas como lidas', async () => {
      vi.mocked(Notification.updateMany).mockResolvedValue({ modifiedCount: 3 } as any)

      const result = await NotificationService.markAllAsRead('prof-123')

      expect(Notification.updateMany).toHaveBeenCalledWith(
        { profileId: 'prof-123', read: false },
        { $set: { read: true } }
      )
      expect(result.unreadCount).toBe(0)
      expect(result.success).toBe(true)
    })
  })

  describe('getUnreadCount', () => {
    it('retorna a quantidade de não lidas', async () => {
      vi.mocked(Notification.countDocuments).mockResolvedValue(4)

      const count = await NotificationService.getUnreadCount('prof-123')

      expect(Notification.countDocuments).toHaveBeenCalledWith({ profileId: 'prof-123', read: false })
      expect(count).toBe(4)
    })
  })
})
