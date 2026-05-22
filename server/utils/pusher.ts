import Pusher from 'pusher'

let pusher: Pusher | null = null

export const usePusher = () => {
  if (pusher) return pusher

  const config = useRuntimeConfig()
  
  if (!config.pusherAppId || !config.pusherKey || !config.pusherSecret || !config.pusherCluster) {
    console.error('[Pusher] Missing configuration')
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
