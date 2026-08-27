<script setup lang="ts">
const { loggedIn, user } = useUserSession()
const { getAppUrl, isExternalUrl } = useAppUrl()

const { data: profile } = useFetch<any>('/api/profile', {
  key: 'profile',
  lazy: true
})

const { data: systemInfo } = useFetch<any>('/api/system/status', {
  key: 'system-status'
})
</script>

<template>
  <div class="landing-page-root font-sans antialiased">
    <!-- Header Translúcido Escuro/Limpo Premium (Luxury Minimal) -->
    <header class="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#dfe6f0]">
      <nav class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div class="flex items-center gap-12">
          <!-- Logo com versão adaptada -->
          <NuxtLink to="/">
            <AppLogo size="sm" class="hover:opacity-90 transition-opacity" />
          </NuxtLink>
          <div class="hidden md:flex gap-8">
            <a href="#features" class="text-sm font-semibold text-[#61708a] hover:text-[#0870f8] transition-colors">Funcionalidades</a>
            <a href="#como-funciona" class="text-sm font-semibold text-[#61708a] hover:text-[#0870f8] transition-colors">Como Funciona</a>
            <a href="#faq" class="text-sm font-semibold text-[#61708a] hover:text-[#0870f8] transition-colors">FAQ</a>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <template v-if="loggedIn">
            <NuxtLink
              :href="getAppUrl('/dashboard')"
              :external="isExternalUrl()"
              target="_self"
              class="flex items-center gap-3 bg-[#e9f3ff] hover:bg-[#0870f8] border border-[#0870f8]/30 p-1.5 pr-5 rounded-full transition-all duration-300 group shadow-sm hover:scale-[1.02]"
            >
              <!-- Avatar Foto ou Inicial -->
              <div class="w-9 h-9 rounded-full overflow-hidden bg-[#0870f8] flex items-center justify-center text-white font-black text-sm border border-[#0870f8]/30 flex-shrink-0 shadow-inner">
                <img
                  v-if="(user as any)?.avatar || profile?.avatar || profile?.logoUrl"
                  :src="(user as any)?.avatar || profile?.avatar || profile?.logoUrl"
                  :alt="(user as any)?.name || profile?.name || 'Avatar'"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
                <span v-else>
                  {{ ((user as any)?.name || (user as any)?.email || profile?.name || 'U')[0].toUpperCase() }}
                </span>
              </div>
              <span class="text-xs font-bold text-[#0870f8] group-hover:text-white transition-colors">
                Ir para o App
              </span>
            </NuxtLink>
          </template>
          <NuxtLink
            v-else
            :href="getAppUrl('/auth/login')"
            :external="isExternalUrl()"
            target="_self"
            class="bg-[#07111f] hover:bg-[#0c1424] text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-md hover:scale-[1.02]"
          >
            Entrar
          </NuxtLink>
        </div>
      </nav>
    </header>

    <!-- Contêiner estrutural do Layout para permitir seções fluidas -->
    <div class="w-full">
      <slot />
    </div>

    <!-- Rodapé Escuro Premium -->
    <footer class="bg-slate-950 border-t border-slate-900/80 pt-16 pb-12 px-6 relative overflow-hidden">
      <!-- Glow sutil de fundo -->
      <div class="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div class="max-w-7xl mx-auto relative z-10">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div class="md:col-span-2 space-y-6">
            <AppLogo size="md" light />
            <p class="text-sm text-slate-400 font-medium max-w-sm leading-relaxed">
              Simplificando o processo comercial de profissionais autônomos e freelancers através de inteligência artificial prática de orçamentos.
            </p>
          </div>
          
          <div class="space-y-4 text-left">
            <h3 class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Navegação</h3>
            <nav class="flex flex-col gap-3">
              <a href="#features" class="text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors">Funcionalidades</a>
              <a href="#como-funciona" class="text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors">Como Funciona</a>
              <a href="#faq" class="text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors">FAQ</a>
            </nav>
          </div>

          <div class="space-y-4 text-left">
            <h3 class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Legal &amp; Contato</h3>
            <nav class="flex flex-col gap-3">
              <NuxtLink to="/terms" class="text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors">Termos de Uso</NuxtLink>
              <NuxtLink to="/privacy" class="text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors">Privacidade</NuxtLink>
              <a href="mailto:contato@orceifacil.com.br" class="text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors">contato@orceifacil.com.br</a>
            </nav>
          </div>
        </div>
        
        <div class="pt-8 border-t border-slate-900/60 flex flex-col md:flex-row justify-between items-center gap-4">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {{ systemInfo?.footerText || `© ${new Date().getFullYear()} ${systemInfo?.landingPage?.appName || 'ORCEI'}. Todos os direitos reservados.` }}
          </p>
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 rounded-full border border-slate-800">
              <div 
                :class="[
                  systemInfo?.systemStatus?.color === 'green' ? 'bg-green-500' : 
                  systemInfo?.systemStatus?.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                ]" 
                class="w-1.5 h-1.5 rounded-full animate-pulse"
              ></div>
              <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">{{ systemInfo?.systemStatus?.label || 'Sistema Online' }}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
