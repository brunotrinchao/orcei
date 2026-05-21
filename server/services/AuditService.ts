import { AuditLog } from '../models/AuditLog'
import { QueueService } from './QueueService'

export const AuditService = {
  /**
   * Registra um log de auditoria de forma assíncrona via fila
   */
  async log(data: {
    adminId: string,
    adminName?: string,
    action: string,
    targetId?: string,
    targetType?: string,
    details?: any,
    ip?: string
  }) {
    try {
      await QueueService.publish('REGISTER_AUDIT_LOG', data)
    } catch (error) {
      console.error('[AuditService] Erro ao agendar log de auditoria:', error)
      // Fallback síncrono se a fila falhar (opcional, aqui preferimos apenas logar o erro)
    }
  },

  /**
   * Persiste o log no banco de dados (chamado pelo worker da fila)
   */
  async persist(data: any) {
    try {
      return await AuditLog.create(data)
    } catch (error) {
      console.error('[AuditService] Erro ao persistir log no banco:', error)
      throw error
    }
  }
}
