export const QueueService = {
  /**
   * Publica uma tarefa na fila do QStash
   * @param action Nome da ação/job (ex: 'PROPOSAL_ACCEPTED')
   * @param payload Dados necessários para o job
   * @param delay Tempo de espera em segundos (opcional)
   */
  async publish(action: string, payload: any, delay: number = 0) {
    const config = useRuntimeConfig()
    const token = config.qstashToken
    const siteUrl = config.public.siteUrl

    if (!token) {
      console.warn('[QueueService] QSTASH_TOKEN não configurado. As tarefas serão executadas de forma síncrona ou ignoradas.')
      return null
    }

    const destination = `${siteUrl}/api/webhooks/qstash`
    console.log(`[QueueService] Publicando job [${action}] para: ${destination}`)
    
    try {
      const response = await fetch(`https://qstash.upstash.io/v2/publish/${destination}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Upstash-Forward-Action': action, // Header customizado para identificarmos o job no webhook
          ...(delay > 0 ? { 'Upstash-Delay': `${delay}s` } : {})
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`QStash publish failed: ${error}`)
      }

      const result: any = await response.json()
      console.log(`[QueueService] Job [${action}] publicado no QStash:`, result.messageId)
      return result
    } catch (error) {
      console.error('[QueueService] Erro ao publicar na fila:', error)
      throw error
    }
  }
}
