<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Menu, X, ArrowUp } from 'lucide-vue-next'

const { loggedIn, user } = useUserSession()
const { getAppUrl, isExternalUrl } = useAppUrl()
const route = useRoute()

const { data: profile } = useFetch<any>('/api/profile', {
  key: 'profile',
  lazy: true
})

const { data: systemInfo } = useFetch<any>('/api/system/status', {
  key: 'system-status'
})

const scrollProgress = ref(0)
const mobileMenuOpen = ref(false)

function handleScroll() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
  if (scrollHeight > 0) {
    scrollProgress.value = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100))
  } else {
    scrollProgress.value = 0
  }
}

function scrollToSection(event: MouseEvent, targetId: string) {
  event.preventDefault()
  mobileMenuOpen.value = false
  const element = document.querySelector(targetId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

function scrollToTop(event: MouseEvent) {
  if (route.path === '/') {
    event.preventDefault()
  }
  mobileMenuOpen.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="landing-page-root font-sans antialiased relative">
    <!-- Barra de Progresso de Scroll no Topo (3px Azul) -->
    <div
      class="fixed top-0 left-0 h-[3px] bg-[#0870f8] z-[100] transition-all duration-75 ease-out pointer-events-none"
      :style="{ width: `${scrollProgress}%` }"
      aria-hidden="true"
    ></div>

    <!-- Header Fixo Translúcido Premium -->
    <header class="bg-white/90 backdrop-blur-md fixed top-0 left-0 right-0 z-50 border-b border-[#dfe6f0]">
      <nav class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div class="flex items-center gap-12">
          <!-- Logo da Plataforma (Subir ao topo com rolagem suave) -->
          <NuxtLink to="/" @click="scrollToTop">
            <AppLogo size="sm" class="hover:opacity-90 transition-opacity cursor-pointer" />
          </NuxtLink>
          <div class="hidden md:flex gap-8">
            <a href="#features" @click="scrollToSection($event, '#features')" class="text-sm font-semibold text-[#61708a] hover:text-[#0870f8] transition-colors cursor-pointer">Funcionalidades</a>
            <a href="#como-funciona" @click="scrollToSection($event, '#como-funciona')" class="text-sm font-semibold text-[#61708a] hover:text-[#0870f8] transition-colors cursor-pointer">Como Funciona</a>
            <a href="#pricing" @click="scrollToSection($event, '#pricing')" class="text-sm font-semibold text-[#61708a] hover:text-[#0870f8] transition-colors cursor-pointer">Preços</a>
            <a href="#faq" @click="scrollToSection($event, '#faq')" class="text-sm font-semibold text-[#61708a] hover:text-[#0870f8] transition-colors cursor-pointer">FAQ</a>
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
              <span class="text-xs font-bold text-[#0870f8] group-hover:text-white transition-colors sm:inline hidden">
                Ir para o App
              </span>
            </NuxtLink>
          </template>
          <NuxtLink
            v-else
            :href="getAppUrl('/auth/login')"
            :external="isExternalUrl()"
            target="_self"
            class="hidden sm:inline-flex bg-[#07111f] hover:bg-[#0c1424] text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-md hover:scale-[1.02]"
          >
            Entrar
          </NuxtLink>

          <!-- Botão Menu Mobile -->
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden p-2 rounded-xl text-[#61708a] hover:text-[#0c1424] hover:bg-gray-100 transition-colors"
            aria-label="Alternar Menu"
          >
            <Menu v-if="!mobileMenuOpen" class="w-6 h-6" />
            <X v-else class="w-6 h-6" />
          </button>
        </div>
      </nav>

      <!-- Menu Mobile Expansível -->
      <div v-show="mobileMenuOpen" class="md:hidden border-t border-[#dfe6f0] bg-white px-6 py-6 space-y-4 animate-fade-in">
        <nav class="flex flex-col gap-4">
          <a href="#features" @click="scrollToSection($event, '#features')" class="text-base font-semibold text-[#61708a] hover:text-[#0870f8] transition-colors py-1">Funcionalidades</a>
          <a href="#como-funciona" @click="scrollToSection($event, '#como-funciona')" class="text-base font-semibold text-[#61708a] hover:text-[#0870f8] transition-colors py-1">Como Funciona</a>
          <a href="#pricing" @click="scrollToSection($event, '#pricing')" class="text-base font-semibold text-[#61708a] hover:text-[#0870f8] transition-colors py-1">Preços</a>
          <a href="#faq" @click="scrollToSection($event, '#faq')" class="text-base font-semibold text-[#61708a] hover:text-[#0870f8] transition-colors py-1">FAQ</a>
        </nav>
        <div class="pt-4 border-t border-gray-100" v-if="!loggedIn">
          <NuxtLink
            :href="getAppUrl('/auth/login')"
            :external="isExternalUrl()"
            target="_self"
            class="w-full flex items-center justify-center bg-[#07111f] text-white py-3 rounded-xl font-bold text-sm"
          >
            Entrar
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- Espaçamento do Header Fixo -->
    <div class="h-20"></div>

    <!-- Contêiner estrutural do Layout para permitir seções fluidas -->
    <div class="w-full">
      <slot />
    </div>

    <!-- Rodapé Simplificado Minimalista -->
    <footer class="bg-white border-t border-[#dfe6f0] pt-12 pb-10 px-6 relative">
      <div class="max-w-7xl mx-auto">
        <!-- Linha Superior do Rodapé: Logo, Descrição Curta e Voltar ao topo -->
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div class="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
            <!-- Logo com ação de voltar ao topo -->
            <NuxtLink to="/" @click="scrollToTop">
              <AppLogo size="sm" class="hover:opacity-90 transition-opacity cursor-pointer" />
            </NuxtLink>
            <!-- Descrição Curta -->
            <p class="text-xs md:text-sm text-[#61708a] font-medium max-w-lg leading-relaxed">
              Uma base pronta para transformar ideias em propostas comerciais de orçamento com IA — sem improvisar a fundação a cada novo cliente.
            </p>
          </div>

          <!-- Link Voltar ao Topo -->
          <a
            href="#"
            @click="scrollToTop"
            class="text-xs md:text-sm font-bold text-[#0870f8] hover:text-[#0055c8] transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0"
          >
            <span>Voltar ao topo</span>
            <ArrowUp class="w-4 h-4" />
          </a>
        </div>

        <!-- Divisor Horizontal -->
        <div class="border-t border-[#dfe6f0] my-8"></div>

        <!-- Linha Inferior do Rodapé: Direitos Autorais & Termos / Privacidade -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#61708a] font-medium">
          <p>
            {{ systemInfo?.footerText || `© ${new Date().getFullYear()} ${systemInfo?.landingPage?.appName || 'Orcei Fácil'}. Todos os direitos reservados.` }}
          </p>

          <div class="flex items-center gap-6">
            <NuxtLink to="/terms" class="hover:text-[#0870f8] transition-colors font-semibold">
              Termos de Uso
            </NuxtLink>
            <NuxtLink to="/privacy" class="hover:text-[#0870f8] transition-colors font-semibold">
              Privacidade
            </NuxtLink>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
