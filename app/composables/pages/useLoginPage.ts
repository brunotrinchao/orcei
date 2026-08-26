import { ref, watchEffect } from 'vue'
import { Sparkles, ShieldCheck, Zap, ArrowRight, Loader2 } from 'lucide-vue-next'

export function useLoginPage() {
  const { loggedIn, fetch: refreshSession } = useUserSession()
  const { data: systemInfo } = useFetch<any>('/api/system/status', { key: 'system-status' })
  const { notify } = useAlerts()
  const { login } = useGoogleLogin()

  const acceptedTerms = ref(false)
  const isLoggingIn = ref(false)

  async function onGoogleLoginClick() {
    if (!acceptedTerms.value) {
      notify('Aceite necessário', 'Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar.')
      return
    }

    isLoggingIn.value = true
    try {
      const result = await login()
      if (result === 'success') {
        await refreshSession()
        await navigateTo('/dashboard')
      } else if (result === 'blocked') {
        notify('Pop-up bloqueado', 'Seu navegador bloqueou a janela de login do Google. Permita pop-ups para este site e tente novamente.')
      } else if (result === 'error') {
        notify('Erro ao entrar', 'Não foi possível concluir o login com o Google. Tente novamente.')
      }
    } finally {
      isLoggingIn.value = false
    }
  }

  watchEffect(() => {
    if (loggedIn.value) {
      navigateTo('/dashboard')
    }
  })

  return {
    systemInfo,
    acceptedTerms,
    isLoggingIn,
    onGoogleLoginClick,
    Sparkles,
    ShieldCheck,
    Zap,
    ArrowRight,
    Loader2,
  }
}
