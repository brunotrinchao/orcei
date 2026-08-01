/**
 * Login com Google numa janela popup, sem navegar a aba principal.
 * server/api/auth/google.get.ts roda dentro dessa janela e se comunica de
 * volta via BroadcastChannel antes de se fechar sozinha — mesmo padrão do
 * fluxo de integração Google (ver useGoogleConnect.ts).
 */
export type GoogleLoginResult = 'success' | 'blocked' | 'cancelled' | 'error'

export function useGoogleLogin() {
  function login(): Promise<GoogleLoginResult> {
    return new Promise((resolve) => {
      const width = 500
      const height = 650
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2

      const popup = window.open(
        '/api/auth/google',
        'google-login',
        `width=${width},height=${height},left=${left},top=${top}`
      )

      if (!popup) {
        // Popup bloqueado pelo navegador — diferente de cancelamento manual,
        // vale avisar o usuário pra liberar popups e tentar de novo.
        resolve('blocked')
        return
      }

      let settled = false
      let channel: BroadcastChannel | null = null

      function cleanup() {
        window.removeEventListener('message', onMessage)
        channel?.close()
        clearInterval(pollClosed)
      }

      function finish(status: string | null | undefined) {
        if (settled) return
        settled = true
        cleanup()
        if (status === 'success') resolve('success')
        else if (status === 'error') resolve('error')
        else resolve('cancelled') // janela fechada manualmente, sem completar
      }

      function onMessage(event: MessageEvent) {
        if (event.origin !== window.location.origin) return
        if (event.data?.source !== 'google-login') return
        finish(event.data.status)
      }

      window.addEventListener('message', onMessage)

      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('google-login')
        channel.onmessage = (event) => {
          if (event.data?.source === 'google-login') finish(event.data.status)
        }
      }

      // Fallback: usuário fechou a janela manualmente sem completar o login
      const pollClosed = setInterval(() => {
        if (popup.closed) finish(null)
      }, 500)
    })
  }

  return { login }
}
