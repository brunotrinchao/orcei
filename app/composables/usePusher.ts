import Pusher from 'pusher-js'

let pusherInstance: Pusher | null = null
let currentAuthParams: string | null = null

export const usePusher = (authParams?: Record<string, any>) => {
  const config = useRuntimeConfig()
  const pusherKey = config.public.pusherKey
  const pusherCluster = config.public.pusherCluster

  if (!pusherKey || !pusherCluster) {
    return { pusher: null }
  }

  const authParamsString = JSON.stringify(authParams || {})

  if (pusherInstance) {
    // Se os parâmetros de autenticação são os mesmos, reutiliza a instância
    if (currentAuthParams === authParamsString) {
      return { pusher: pusherInstance }
    }
    // Se mudaram (ex: mudou de uma proposta para outra no lado do cliente), reconecta
    pusherInstance.disconnect()
  }

  pusherInstance = new Pusher(pusherKey, {
    cluster: pusherCluster,
    forceTLS: true,
    authEndpoint: '/api/chat/auth',
    auth: {
      params: authParams || {}
    }
  })

  currentAuthParams = authParamsString

  return { pusher: pusherInstance }
}
