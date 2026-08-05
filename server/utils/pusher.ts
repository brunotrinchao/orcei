import Pusher from 'pusher'

let pusher: Pusher | null = null
let hasWarnedConfig = false

export const usePusher = () => {
  if (pusher) return pusher

  const config = useRuntimeConfig()
  
  if (!config.pusherAppId || !config.pusherKey || !config.pusherSecret || !config.pusherCluster) {
    if (!hasWarnedConfig) {
      console.warn('[Pusher] Recursos de WebSocket desabilitados: credenciais PUSHER_APP_ID, PUSHER_KEY ou PUSHER_SECRET não configuradas nas variáveis de ambiente.')
      hasWarnedConfig = true
    }
    return null
  }

  pusher = new Pusher({
    appId: config.pusherAppId,
    key: config.pusherKey,
    secret: config.pusherSecret,
    cluster: config.pusherCluster,
    useTLS: true
  })

  return pusher
}
