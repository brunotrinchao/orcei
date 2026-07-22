<script setup lang="ts">
import { SubscriptionPlan } from '../../types/enums'
import { onClickOutside } from '@vueuse/core'
import { Shield, ArrowLeft, Home, FileText, Plus, Users, Settings, LogOut, BookOpen, ReceiptText, Coins, Moon, Sun, HelpCircle } from 'lucide-vue-next'
import type { ProfileDTO } from '../../types'
const { loggedIn, user, session, clear, fetch: refreshSession } = useUserSession()
const { data: profile, refresh: refreshLayoutProfile } = useFetch<ProfileDTO>('/api/profile', { key: 'profile' })

watch(() => user.value?.id, (newId, oldId) => {
  if (newId && newId !== oldId) refreshLayoutProfile()
})

async function stopImpersonating() {
  await $fetch('/api/admin/impersonate/stop', { method: 'POST' })
  await refreshSession()
  navigateTo('/admin/users')
}

const isMenuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

onClickOutside(menuRef, () => {
  isMenuOpen.value = false
})

const route = useRoute()
const { hasTourForRoute, startTour } = useOnboarding()
const tourId = computed(() => hasTourForRoute(route.path))

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}
const { isDark, toggle } = useDarkMode()
const { notify, confirm: confirmAlert } = useAlerts()
const { resetConsent } = useCookieConsent()

async function logout() {
  confirmAlert({
    title: 'Sair da Conta',
    description: 'Tem certeza que deseja encerrar sua sessão?',
    actionText: 'Sair',
    variant: 'destructive',
    onConfirm: async () => {
      await $fetch('/api/auth/logout', { method: 'POST' })
      await clear()
      navigateTo('/')
    }
  })
}

const { data: systemInfo } = useFetch<any>('/api/system/status', {
  key: 'system-status'
})

let pageshowHandler: ((e: PageTransitionEvent) => void) | null = null

onMounted(() => {
  pageshowHandler = (e: PageTransitionEvent) => {
    if (e.persisted) refreshLayoutProfile()
  }
  window.addEventListener('pageshow', pageshowHandler)
})

onUnmounted(() => {
  if (pageshowHandler) {
    window.removeEventListener('pageshow', pageshowHandler)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50/50 dark:bg-gray-950 pb-16 md:pb-0 font-sans text-gray-900 dark:text-gray-50 antialiased">
    <!-- Desktop/Mobile Header -->
    <header class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800">
      <nav class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-12">
          <NuxtLink :to="loggedIn ? '/dashboard' : '/'"><AppLogo size="sm" :light="isDark" /></NuxtLink>
          <div v-if="loggedIn" class="hidden md:flex gap-8 items-center">
            <NuxtLink to="/dashboard" @mouseenter="preloadRouteComponents('/dashboard')" @focus="preloadRouteComponents('/dashboard')" class="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" active-class="text-gray-900 dark:text-white">Dashboard</NuxtLink>
            <NuxtLink to="/clientes" @mouseenter="preloadRouteComponents('/clientes')" @focus="preloadRouteComponents('/clientes')" class="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" active-class="text-gray-900 dark:text-white">Clientes</NuxtLink>
            <NuxtLink to="/catalogo" @mouseenter="preloadRouteComponents('/catalogo')" @focus="preloadRouteComponents('/catalogo')" class="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" active-class="text-gray-900 dark:text-white">Catálogo</NuxtLink>
            <NuxtLink to="/orcamentos" @mouseenter="preloadRouteComponents('/orcamentos')" @focus="preloadRouteComponents('/orcamentos')" class="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" active-class="text-gray-900 dark:text-white">Orçamentos</NuxtLink>
            <NuxtLink to="/relatorios" @mouseenter="preloadRouteComponents('/relatorios')" @focus="preloadRouteComponents('/relatorios')" class="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" active-class="text-gray-900 dark:text-white">Relatórios</NuxtLink>
          </div>
          <div v-else class="hidden md:flex gap-8">
            <a href="#features" class="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Funcionalidades</a>
            <a href="#como-funciona" class="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Como Funciona</a>
          </div>
        </div>

        <div class="flex items-center gap-2 md:gap-3">
          <template v-if="loggedIn">
            <!-- Credits & Plan Display -->
            <div class="flex items-center gap-2 md:gap-3.5 bg-slate-50 dark:bg-slate-900/60 px-2.5 md:px-3.5 py-1.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-inner mr-0.5 md:mr-1">
              <!-- Créditos -->
              <div class="flex items-center gap-1.5 py-0.5">
                <div class="w-6 h-6 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-500">
                  <Coins class="w-3.5 h-3.5" />
                </div>
                <div class="flex flex-col">
                  <span class="hidden md:inline-block text-[7px] uppercase font-black text-gray-400 dark:text-gray-500 tracking-wider leading-none">Créditos</span>
                  <span class="text-xs font-black text-slate-800 dark:text-slate-100 leading-none md:leading-tight mt-0.5 md:mt-0.5">{{ profile?.creditsBalance ?? 0 }}</span>
                </div>
              </div>
              
              <!-- Divisor (Oculto no mobile) -->
              <div v-if="profile?.subscriptionPlan && profile.subscriptionPlan !== SubscriptionPlan.FREE" class="hidden md:block h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
              
              <!-- Plano (Oculto no mobile) -->
              <div v-if="profile?.subscriptionPlan && profile.subscriptionPlan !== SubscriptionPlan.FREE" class="hidden md:flex items-center gap-1.5 py-0.5">
                <div class="flex flex-col">
                  <span class="text-[7px] uppercase font-black text-gray-400 dark:text-gray-500 tracking-wider leading-none">
                    {{ profile.cancelAtPeriodEnd ? 'Cancela em' : 'Assinatura' }}
                  </span>
                  <span 
                    :class="[
                      'text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md leading-none mt-0.5 tracking-wider',
                      profile.cancelAtPeriodEnd 
                        ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' 
                        : 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                    ]"
                  >
                    {{ profile.subscriptionPlan }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Admin Quick Access (Oculto no mobile) -->
            <NuxtLink 
              v-if="user?.role === 'admin'"
              to="/admin" 
              class="hidden md:flex w-10 h-10 rounded-2xl items-center justify-center bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 dark:text-red-400 shadow-sm hover:ring-4 ring-red-500/5 dark:ring-red-950/20 transition-all"
              title="Painel de Administração"
              aria-label="Acessar Painel de Administração"
            >
              <Shield class="w-4.5 h-4.5" />
            </NuxtLink>

            <!-- Onboarding Help Button (Oculto no mobile) -->
            <OnboardingHelpButton class="hidden md:flex" />

            <!-- Dark Mode Toggle -->
            <button
              @click="toggle()"
              class="hidden md:flex w-10 h-10 rounded-2xl items-center justify-center bg-gray-50 dark:bg-gray-900/60 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 border border-slate-100 dark:border-slate-800/80 shadow-sm hover:ring-4 ring-gray-100 dark:ring-gray-800/50 transition-all"
              :aria-label="isDark ? 'Ativar modo claro' : 'Ativar modo escuro'"
            >
              <ClientOnly>
                <Sun v-if="isDark" class="w-4.5 h-4.5 text-amber-500" />
                <Moon v-else class="w-4.5 h-4.5 text-slate-400" />
              </ClientOnly>
            </button>

            <!-- User Avatar -->
            <div ref="menuRef" class="relative">
              <button 
                @click="toggleMenu" 
                class="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-hidden hover:ring-4 ring-gray-100 dark:ring-gray-800/50 transition-all border border-slate-100 dark:border-slate-800/80 shadow-sm relative z-[60]"
              >
                <img v-if="(user as any)?.avatar || profile?.avatar" :src="(user as any)?.avatar || profile?.avatar" class="w-full h-full object-cover" loading="lazy">
                <span v-else class="text-sm font-black text-gray-900 dark:text-gray-50">{{ (user as any)?.name?.charAt(0).toUpperCase() || profile?.name?.charAt(0).toUpperCase() }}</span>
              </button>

              <!-- Dropdown (Minimalist) -->
              <div v-if="isMenuOpen" class="absolute right-0 mt-3 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1.5 overflow-hidden ring-1 ring-black/5 dark:ring-white/5 z-[70]">
                <div class="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                  <div class="w-6 h-6 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
                    <img v-if="(user as any)?.avatar || profile?.avatar" :src="(user as any)?.avatar || profile?.avatar" class="w-full h-full object-cover" loading="lazy">
                  </div>
                  <p class="text-xs font-bold text-gray-900 dark:text-gray-50 truncate">{{ (user as any)?.name || profile?.name }}</p>
                </div>
                <NuxtLink to="/configuracoes" @click="isMenuOpen = false" class="block px-4 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">Configurações</NuxtLink>
                <NuxtLink to="/planos" @click="isMenuOpen = false" class="block px-4 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">Plano</NuxtLink>
                
                <!-- Alternar Aparência (Apenas no Mobile) -->
                <button 
                  @click="toggle()" 
                  class="md:hidden w-full text-left px-4 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center justify-between border-t border-gray-50 dark:border-gray-800"
                >
                  <span>Alternar Tema</span>
                  <span class="flex items-center gap-1.5 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase font-mono">
                    <ClientOnly>
                      <template v-if="isDark">
                        <Moon class="w-3.5 h-3.5 text-blue-500" />
                        <span>Escuro</span>
                      </template>
                      <template v-else>
                        <Sun class="w-3.5 h-3.5 text-amber-500" />
                        <span>Claro</span>
                      </template>
                    </ClientOnly>
                  </span>
                </button>

                <!-- Tour Guiado (Apenas no Mobile se houver tour configurado) -->
                <button 
                  v-if="tourId"
                  @click="startTour(tourId, { force: true }); isMenuOpen = false" 
                  class="md:hidden w-full text-left px-4 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center justify-between border-t border-gray-50 dark:border-gray-800"
                >
                  <span>Tour Guiado (Ajuda)</span>
                  <HelpCircle class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </button>

                <NuxtLink v-if="user?.role === 'admin'" to="/admin" @click="isMenuOpen = false" class="block px-4 py-2 text-xs text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-950/30 transition border-t border-gray-50 dark:border-gray-800">Painel Admin</NuxtLink>
                <button @click="logout" class="w-full text-left px-4 py-2 text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition border-t border-gray-50 dark:border-gray-800 mt-1">Sair</button>
              </div>
            </div>
          </template>
          <template v-else>
            <NuxtLink
              to="/auth/login"
              class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-sm shadow-blue-100"
            >
              Entrar
            </NuxtLink>
          </template>
        </div>
      </nav>
    </header>

    <!-- Impersonation Banner -->
    <div v-if="session?.impersonatedBy" class="bg-amber-500 text-white px-6 py-2.5 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest sticky top-16 z-40">
      <span>Personificando: {{ user?.name }}</span>
      <button @click="stopImpersonating" class="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-all">
        <LogOut class="w-3.5 h-3.5" />
        Voltar ao Admin
      </button>
    </div>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-6 min-h-[calc(100dvh-250px)]">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pt-8 pb-8 md:pb-16 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div class="md:col-span-2 space-y-6">
            <AppLogo size="md" :light="isDark" />
            <p class="text-sm text-gray-500 dark:text-gray-400 font-medium max-w-sm leading-relaxed">
              Transformando a gestão comercial de freelancers e pequenas empresas através de inteligência artificial e processos automatizados.
            </p>
            <div v-if="profile?.company" class="space-y-1">
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">{{ profile.company.legalName }}</p>
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">CNPJ: {{ profile.company.taxId }}</p>
            </div>
          </div>
          
          <div class="space-y-4">
            <h3 class="text-[10px] font-black text-gray-900 dark:text-gray-50 uppercase tracking-widest">Navegação</h3>
            <nav class="flex flex-col gap-3">
              <NuxtLink to="/dashboard" class="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Dashboard</NuxtLink>
              <NuxtLink to="/orcamentos" class="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Orçamentos</NuxtLink>
              <NuxtLink to="/clientes" class="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Clientes</NuxtLink>
            </nav>
          </div>

          <div class="space-y-4">
            <h3 class="text-[10px] font-black text-gray-900 dark:text-gray-50 uppercase tracking-widest">Suporte & Legal</h3>
            <nav class="flex flex-col gap-3">
              <NuxtLink to="/terms" class="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Termos de Uso</NuxtLink>
              <NuxtLink to="/privacy" class="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacidade</NuxtLink>
              <button @click="resetConsent" class="text-left text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Gerenciar Cookies</button>
              <a href="mailto:contato@orceifacil.com.br" class="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">contato@orceifacil.com.br</a>
            </nav>
          </div>
        </div>
        
        <div class="pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p class="text-[10px] font-black text-gray-300 dark:text-gray-400 uppercase tracking-widest">
            {{ systemInfo?.footerText || `© ${new Date().getFullYear()} ${systemInfo?.landingPage?.appName || 'ORCEI'}. Todos os direitos reservados.` }}
          </p>
          <div class="flex items-center gap-6">
            <!-- <a v-if="profile?.contact?.social?.instagram" :href="`https://instagram.com/${profile.contact.social.instagram.replace('@', '')}`" target="_blank" class="text-gray-400 hover:text-pink-600 transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.074 4.771 4.85.058 1.266.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.164 4.771-4.771 4.85-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.075-4.771-4.85-.058-1.265-.069-1.644-.069-4.849 0-3.204.013-3.583.069-4.849.149-3.227 1.157-4.771 4.771-4.85 1.266-.058 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a> -->
            <div class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700">
              <div 
                :class="[
                  systemInfo?.systemStatus?.color === 'green' ? 'bg-green-500' : 
                  systemInfo?.systemStatus?.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                ]" 
                class="w-1.5 h-1.5 rounded-full animate-pulse"
              ></div>
              <span class="text-[8px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{{ systemInfo?.systemStatus?.label || 'Sistema Online' }}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>

    <OnboardingController v-if="loggedIn" />

    <nav
      v-if="loggedIn"
      aria-label="Navegação principal mobile"
      class="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <ul class="flex items-center justify-around h-16 px-2">
        <li class="flex-1 flex justify-center h-full relative">
          <NuxtLink
            to="/dashboard"
            class="group flex flex-col items-center justify-center w-full h-full gap-1 outline-none transition-all duration-200 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"
            active-class="text-blue-600 dark:text-blue-400"
          >
            <Home class="w-5 h-5 active:scale-90 transition-transform duration-200" aria-hidden="true" />
            <span class="text-[9px] font-bold tracking-wide transition-colors">Início</span>
          </NuxtLink>
        </li>


        <li class="flex-1 flex justify-center h-full relative">
          <NuxtLink
            to="/clientes"
            class="group flex flex-col items-center justify-center w-full h-full gap-1 outline-none transition-all duration-200 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"
            active-class="text-blue-600 dark:text-blue-400"
          >
            <Users class="w-5 h-5 active:scale-90 transition-transform duration-200" aria-hidden="true" />
            <span class="text-[9px] font-bold tracking-wide transition-colors">Clientes</span>
          </NuxtLink>
        </li>

        <li class="flex-1 flex justify-center h-full relative">
          <NuxtLink
            to="/catalogo"
            class="group flex flex-col items-center justify-center w-full h-full gap-1 outline-none transition-all duration-200 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"
            active-class="text-blue-600 dark:text-blue-400"
          >
            <BookOpen class="w-5 h-5 active:scale-90 transition-transform duration-200" aria-hidden="true" />
            <span class="text-[9px] font-bold tracking-wide transition-colors">Catálogo</span>
          </NuxtLink>
        </li>

        <!-- <li class="flex-1 flex justify-center h-full relative">
          <NuxtLink
            to="/orcamentos?new=true"
            class="group flex flex-col items-center justify-center w-full h-full gap-1 outline-none transition-all duration-200"
          >
            <div class="absolute -top-6 flex flex-col items-center justify-center">
              <div class="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-200 active:scale-95 transition-transform duration-200 ring-4 ring-white">
                <Plus class="w-6 h-6" aria-hidden="true" />
              </div>
              <span class="text-[9px] font-bold tracking-wide mt-1 text-gray-500">Novo</span>
            </div>
          </NuxtLink>
        </li> -->

        <li class="flex-1 flex justify-center h-full relative">
          <NuxtLink
            to="/orcamentos"
            class="group flex flex-col items-center justify-center w-full h-full gap-1 outline-none transition-all duration-200 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"
            active-class="text-blue-600 dark:text-blue-400"
          >
            <FileText class="w-5 h-5 active:scale-90 transition-transform duration-200" aria-hidden="true" />
            <span class="text-[9px] font-bold tracking-wide transition-colors">Orçamentos</span>
          </NuxtLink>
        </li>

        <li class="flex-1 flex justify-center h-full relative">
          <NuxtLink
            to="/relatorios"
            class="group flex flex-col items-center justify-center w-full h-full gap-1 outline-none transition-all duration-200 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"
            active-class="text-blue-600 dark:text-blue-400"
          >
            <ReceiptText class="w-5 h-5 active:scale-90 transition-transform duration-200" aria-hidden="true" />
            <span class="text-[9px] font-bold tracking-wide transition-colors">Relatórios</span>
          </NuxtLink>
        </li>

        <li class="flex-1 flex justify-center h-full relative">
          <NuxtLink
            to="/configuracoes"
            class="group flex flex-col items-center justify-center w-full h-full gap-1 outline-none transition-all duration-200 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"
            active-class="text-blue-600 dark:text-blue-400"
          >
            <Settings class="w-5 h-5 active:scale-90 transition-transform duration-200" aria-hidden="true" />
            <span class="text-[9px] font-bold tracking-wide transition-colors">Ajustes</span>
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </div>
</template>
