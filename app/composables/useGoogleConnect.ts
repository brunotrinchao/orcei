/**
 * Conecta uma integração Google (Calendar ou Drive) numa janela popup, sem
 * navegar a aba/app principal. O callback do servidor
 * (server/api/integrations/google/callback.get.ts) roda dentro dessa janela
 * e se comunica de volta antes de se fechar sozinha.
 *
 * Usa BroadcastChannel como canal principal (não window.opener/postMessage):
 * accounts.google.com aplica Cross-Origin-Opener-Policy: same-origin nas
 * próprias páginas, o que desliga `window.opener` assim que o popup navega
 * pro domínio do Google — e essa referência não volta, mesmo quando o popup
 * retorna pro nosso domínio no final do fluxo. BroadcastChannel não depende
 * de referência de window, só de mesma origem, então sobrevive a isso.
 */
export function useGoogleConnect() {
  function connect(feature: 'drive' | 'calendar'): Promise<boolean> {
    return new Promise((resolve) => {
      const width = 500
      const height = 650
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2

      const popup = window.open(
        `/api/integrations/google/connect?feature=${feature}`,
        'google-connect',
        `width=${width},height=${height},left=${left},top=${top}`
      )

      if (!popup) {
        // Popup bloqueado pelo navegador
        resolve(false)
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
        resolve(status === 'connected')
      }

      function onMessage(event: MessageEvent) {
        if (event.origin !== window.location.origin) return
        if (event.data?.source !== 'google-connect') return
        finish(event.data.status)
      }

      window.addEventListener('message', onMessage)

      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('google-connect')
        channel.onmessage = (event) => {
          if (event.data?.source === 'google-connect') finish(event.data.status)
        }
      }

      // Fallback: se o usuário fechar a janela manualmente sem completar o fluxo
      // (ou em navegadores sem BroadcastChannel e com opener já quebrado pelo COOP)
      const pollClosed = setInterval(() => {
        if (popup.closed) finish(null)
      }, 500)
    })
  }

  return { connect }
}
