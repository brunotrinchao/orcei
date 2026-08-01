<script setup lang="ts">
import { Sparkles, ShieldCheck, Zap, ArrowRight, Loader2 } from 'lucide-vue-next'

definePageMeta({
  layout: 'blank'
})

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
      // Sessão já foi gravada no cookie (compartilhado entre a janela popup e
      // esta aba, mesma origem) — só precisamos atualizar o estado local.
      await refreshSession()
      await navigateTo('/dashboard')
    } else if (result === 'blocked') {
      notify('Pop-up bloqueado', 'Seu navegador bloqueou a janela de login do Google. Permita pop-ups para este site e tente novamente.')
    } else if (result === 'error') {
      notify('Erro ao entrar', 'Não foi possível concluir o login com o Google. Tente novamente.')
    }
    // 'cancelled': usuário fechou a janela manualmente — silencioso, não é falha.
  } finally {
    isLoggingIn.value = false
  }
}

// Redirect authenticated users to dashboard
watchEffect(() => {
  if (loggedIn.value) {
    navigateTo('/dashboard')
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-white dark:bg-gray-950">

    <!-- Lado Esquerdo: Formulário de Login (Mobile e Desktop) -->
    <div class="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10 bg-white dark:bg-gray-950">
      <div class="max-w-md w-full space-y-10">

        <!-- Logo e Boas-vindas -->
        <div class="flex flex-col items-center md:items-start text-center md:text-left gap-4">
          <AppLogo size="lg" />
          <div class="space-y-2 mt-4">
            <h1 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Bem-vindo de volta!</h1>
            <p class="text-gray-500 dark:text-gray-400 font-medium">Faça login para continuar turbinando suas propostas com IA.</p>
          </div>
        </div>

        <!-- Aceite obrigatório de Termos/Privacidade -->
        <label class="flex items-start gap-3 text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed cursor-pointer">
          <input v-model="acceptedTerms" type="checkbox" class="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900 text-blue-600 focus:ring-blue-500 shrink-0">
          <span>
            Li e aceito os <NuxtLink to="/terms" target="_blank" class="text-blue-600 dark:text-blue-400 underline font-black">Termos de Uso</NuxtLink>
            e a <NuxtLink to="/privacy" target="_blank" class="text-blue-600 dark:text-blue-400 underline font-black">Política de Privacidade</NuxtLink>
            do {{ systemInfo?.landingPage?.appName || 'Orcei' }}.
          </span>
        </label>

        <!-- Botão de Login Google com Efeito Hover Avançado -->
        <div class="pt-4">
          <button
            type="button"
            :disabled="isLoggingIn"
            :class="[
              'group relative w-full flex items-center justify-center gap-4 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 py-4 rounded-2xl font-black transition-all duration-300 text-gray-700 dark:text-gray-200 overflow-hidden',
              acceptedTerms ? 'hover:border-blue-600 dark:hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400' : 'opacity-50 cursor-not-allowed',
              isLoggingIn ? 'opacity-70 cursor-wait' : ''
            ]"
            @click="onGoogleLoginClick"
          >

            <Loader2 v-if="isLoggingIn" class="w-5 h-5 relative z-10 animate-spin" />
            <img v-else src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-6 h-6 relative z-10" alt="Google" loading="lazy">
            <span class="relative z-10 text-lg">{{ isLoggingIn ? 'Conectando...' : 'Entrar com Google' }}</span>
            <ArrowRight v-if="!isLoggingIn" class="w-5 h-5 absolute right-6 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 relative z-10" />
          </button>
        </div>
      </div>
    </div>

    <!-- Lado Direito: Painel Decorativo (Apenas Desktop) -->
    <div class="hidden md:flex flex-1 relative overflow-hidden bg-slate-900">

      <!-- Conteúdo Visual -->
      <div class="relative z-10 flex flex-col justify-center items-center w-full p-12 text-center">
        <div class="max-w-lg space-y-12">
          
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-lg border border-white/10 rounded-full text-indigo-300 text-xs font-black uppercase tracking-widest shadow-2xl">
            <Sparkles class="w-4 h-4 text-indigo-400 animate-pulse" />
            A Nova Era das Vendas
          </div>
          
          <h2 class="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
            Seus orçamentos criados <br /> em segundos com a <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Poderosa IA</span>
          </h2>

          <div class="grid grid-cols-2 gap-6 pt-8">
            <div class="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] flex flex-col items-center gap-3 hover:bg-white/10 transition-colors">
              <Zap class="w-8 h-8 text-yellow-400" />
              <span class="text-white font-bold text-sm">Ultra Rápido</span>
            </div>
            <div class="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] flex flex-col items-center gap-3 hover:bg-white/10 transition-colors">
              <ShieldCheck class="w-8 h-8 text-green-400" />
              <span class="text-white font-bold text-sm">Fechamento Seguro</span>
            </div>
          </div>
          
        </div>
      </div>
    </div>

  </div>
</template>
