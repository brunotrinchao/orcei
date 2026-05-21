import { Client } from "@upstash/qstash"

export const QueueService = {
  /**
   * Publica uma tarefa na fila do QStash usando o SDK oficial
   * @param action Nome da ação/job (ex: 'PROPOSAL_ACCEPTED')
   * @param payload Dados necessários para o job
   * @param delay Tempo de espera em segundos (opcional)
   */
  async publish(action: string, payload: any, delay: number = 0) {
    const config = useRuntimeConfig()
    const token = config.qstashToken || process.env.QSTASH_TOKEN || process.env.NUXT_QSTASH_TOKEN
    const siteUrl = config.public.siteUrl || process.env.NUXT_PUBLIC_SITE_URL || 'https://orceifacil.com.br'

    if (!token) {
      console.warn(`[QueueService] QSTASH_TOKEN não configurado. Action [${action}] ignorada.`)
      return null
    }

    const client = new Client({ token })
    const destination = `${siteUrl}/api/webhooks/qstash`

    console.log(`[QueueService] Publicando job [${action}] via SDK para: ${destination}`)

    try {
      const result = await client.publishJSON({
        url: destination,
        body: payload,
        headers: {
          'Upstash-Forward-Action': action
        },
        delay: delay > 0 ? delay : undefined
      })

      console.log(`[QueueService] Job [${action}] publicado:`, result.messageId)
      return result
    } catch (error) {
      console.error('[QueueService] Erro ao publicar na fila:', error)
      throw error
    }
  }
}
