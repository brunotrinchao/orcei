<script setup lang="ts">
import { Sparkles, ShieldCheck, Zap, ArrowRight } from 'lucide-vue-next'

definePageMeta({
  layout: 'blank'
})

const { loggedIn } = useUserSession()
const { data: systemInfo } = useFetch<any>('/api/system/status')

// Redirect authenticated users to dashboard
watchEffect(() => {
  if (loggedIn.value) {
    navigateTo('/dashboard')
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-white">
    
    <!-- Lado Esquerdo: Formulário de Login (Mobile e Desktop) -->
    <div class="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10 bg-white">
      <div class="max-w-md w-full space-y-10">
        
        <!-- Logo e Boas-vindas -->
        <div class="flex flex-col items-center md:items-start text-center md:text-left gap-4">
          <AppLogo size="lg" />
          <div class="space-y-2 mt-4">
            <h1 class="text-3xl font-black text-gray-900 tracking-tight">Bem-vindo de volta!</h1>
            <p class="text-gray-500 font-medium">Faça login para continuar turbinando suas propostas com IA.</p>
          </div>
        </div>

        <!-- Botão de Login Google com Efeito Hover Avançado -->
        <div class="pt-4">
          <a
            href="/api/auth/google"
            class="group relative w-full flex items-center justify-center gap-4 bg-white border-2 border-gray-200 hover:border-blue-600 hover:shadow-xl hover:shadow-blue-500/10 py-4 rounded-2xl font-black transition-all duration-300 text-gray-700 hover:text-blue-600 overflow-hidden"
          >
            <!-- Efeito de brilho de fundo -->
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
            
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-6 h-6 relative z-10" alt="Google">
            <span class="relative z-10 text-lg">Entrar com Google</span>
            <ArrowRight class="w-5 h-5 absolute right-6 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 relative z-10" />
          </a>
        </div>

        <!-- Rodapé do formulário -->
        <p class="text-center md:text-left text-xs text-gray-400 font-medium leading-relaxed max-w-sm mx-auto md:mx-0">
          Ao prosseguir, você concorda com os termos de uso e políticas de privacidade do {{ systemInfo?.landingPage?.appName || 'Orcei' }}.
        </p>
      </div>
    </div>

    <!-- Lado Direito: Painel Decorativo (Apenas Desktop) -->
    <div class="hidden md:flex flex-1 relative overflow-hidden bg-slate-900">
      <!-- Background Gradiente Animado -->
      <div class="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900"></div>
      
      <!-- Efeitos de Luz (Glow) -->
      <div class="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl opacity-70"></div>
      <div class="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full blur-3xl opacity-50"></div>

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
