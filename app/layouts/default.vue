<script setup lang="ts">
import { SubscriptionPlan } from '../../types/enums'
import { onClickOutside } from '@vueuse/core'
import { Shield, ArrowLeft, Home, FileText, Plus, Users, Settings, LogOut, BookOpen, ReceiptText, Coins, Moon, Sun, HelpCircle, Menu, X, ChevronRight, Calendar, Bell } from 'lucide-vue-next'
import type { ProfileDTO } from '../../types'
import NotificationCenterDrawer from '~/components/notifications/NotificationCenterDrawer.vue'
import { useNotifications } from '~/composables/useNotifications'

const { loggedIn, user, session, clear, fetch: refreshSession } = useUserSession()
const { data: profile, refresh: refreshLayoutProfile } = useFetch<ProfileDTO>('/api/profile', { key: 'profile' })
const { unreadCount, isDrawerOpen, startPolling, stopPolling, fetchNotifications } = useNotifications()

onMounted(() => {
  if (loggedIn.value) {
    startPolling(15000)
  }
})

onUnmounted(() => {
  stopPolling()
})

function openNotificationCenter() {
  fetchNotifications()
  isDrawerOpen.value = true
}

watch(() => user.value?.id, (newId, oldId) => {
  if (newId && newId !== oldId) refreshLayoutProfile()
})

async function stopImpersonating() {
  await $fetch('/api/admin/impersonate/stop', { method: 'POST' })
  await refreshSession()
  navigateTo('/admin/users')
}

const isMenuOpen = ref(false)
const isMobileDrawerOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

onClickOutside(menuRef, () => {
  isMenuOpen.value = false
})

const route = useRoute()
const { hasTourForRoute, startTour } = useOnboarding()
const tourId = computed(() => hasTourForRoute(route.path))

watch(() => route.path, () => {
  isMobileDrawerOpen.value = false
  isMenuOpen.value = false
})

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function toggleMobileDrawer() {
  isMobileDrawerOpen.value = !isMobileDrawerOpen.value
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
      isMobileDrawerOpen.value = false
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
  <div class="min-h-screen bg-slate-100/80 dark:bg-gray-950 pb-0 font-sans text-gray-900 dark:text-gray-50 antialiased">
    <!-- Desktop/Mobile Header -->
    <header class="backdrop-blur-[18px] bg-white/90 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/90 dark:border-gray-800 shadow-sm shadow-slate-200/40 dark:shadow-none">
      <nav class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-12">
          <NuxtLink :to="loggedIn ? '/dashboard' : '/'"><AppLogo size="sm" :light="isDark" /></NuxtLink>
          <div v-if="loggedIn" class="hidden md:flex gap-1.5 items-center">
            <NuxtLink to="/dashboard" @mouseenter="preloadRouteComponents('/dashboard')" @focus="preloadRouteComponents('/dashboard')" class="px-3.5 py-2.5 rounded-full text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-gray-800/50 transition-all" active-class="!text-blue-600 dark:!text-blue-400 font-black bg-blue-100/90 dark:bg-blue-950/40">Dashboard</NuxtLink>
            <NuxtLink to="/clientes" @mouseenter="preloadRouteComponents('/clientes')" @focus="preloadRouteComponents('/clientes')" class="px-3.5 py-2.5 rounded-full text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-gray-800/50 transition-all" active-class="!text-blue-600 dark:!text-blue-400 font-black bg-blue-100/90 dark:bg-blue-950/40">Clientes</NuxtLink>
            <NuxtLink to="/catalogo" @mouseenter="preloadRouteComponents('/catalogo')" @focus="preloadRouteComponents('/catalogo')" class="px-3.5 py-2.5 rounded-full text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-gray-800/50 transition-all" active-class="!text-blue-600 dark:!text-blue-400 font-black bg-blue-100/90 dark:bg-blue-950/40">Catálogo</NuxtLink>
            <NuxtLink to="/orcamentos" @mouseenter="preloadRouteComponents('/orcamentos')" @focus="preloadRouteComponents('/orcamentos')" class="px-3.5 py-2.5 rounded-full text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-gray-800/50 transition-all" active-class="!text-blue-600 dark:!text-blue-400 font-black bg-blue-100/90 dark:bg-blue-950/40">Orçamentos</NuxtLink>
            <NuxtLink to="/agenda" @mouseenter="preloadRouteComponents('/agenda')" @focus="preloadRouteComponents('/agenda')" class="px-3.5 py-2.5 rounded-full text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-gray-800/50 transition-all" active-class="!text-blue-600 dark:!text-blue-400 font-black bg-blue-100/90 dark:bg-blue-950/40">Agenda</NuxtLink>
            <NuxtLink to="/relatorios" @mouseenter="preloadRouteComponents('/relatorios')" @focus="preloadRouteComponents('/relatorios')" class="px-3.5 py-2.5 rounded-full text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-gray-800/50 transition-all" active-class="!text-blue-600 dark:!text-blue-400 font-black bg-blue-100/90 dark:bg-blue-950/40">Relatórios</NuxtLink>
          </div>
          <div v-else class="hidden md:flex gap-8">
            <a href="#features" class="text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">Funcionalidades</a>
            <a href="#como-funciona" class="text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">Como Funciona</a>
          </div>
        </div>

        <div class="flex items-center gap-2 md:gap-3">
          <template v-if="loggedIn">
            <!-- Credits & Plan Display (Desktop) -->
            <div class="hidden md:flex items-center gap-2 md:gap-3.5 bg-white dark:bg-slate-900/60 px-2.5 md:px-3.5 py-1.5 rounded-[0.75rem] border border-slate-200 dark:border-slate-800/80 shadow-sm mr-0.5 md:mr-1">
              <!-- Créditos -->
              <div class="flex items-center gap-1.5 py-0.5">
                <div class="w-6 h-6 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-500">
                  <Coins class="w-3.5 h-3.5" />
                </div>
                <div class="flex flex-col">
                  <span class="hidden md:inline-block text-[7px] uppercase font-black text-gray-500 dark:text-gray-500 tracking-wider leading-none">Créditos</span>
                  <span class="text-xs font-black text-slate-800 dark:text-slate-100 leading-none md:leading-tight mt-0.5 md:mt-0.5">{{ profile?.creditsBalance ?? 0 }}</span>
                </div>
              </div>
              
              <!-- Divisor -->
              <div v-if="profile?.subscriptionPlan && profile.subscriptionPlan !== SubscriptionPlan.FREE" class="hidden md:block h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
              
              <!-- Plano -->
              <div v-if="profile?.subscriptionPlan && profile.subscriptionPlan !== SubscriptionPlan.FREE" class="hidden md:flex items-center gap-1.5 py-0.5">
                <div class="flex flex-col">
                  <span class="text-[7px] uppercase font-black text-gray-500 dark:text-gray-500 tracking-wider leading-none">
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

            <!-- Admin Quick Access (Desktop) -->
            <NuxtLink 
              v-if="user?.role === 'admin'"
              to="/admin" 
              class="hidden md:flex w-10 h-10 rounded-[0.75rem] items-center justify-center  text-red-600 dark:text-red-400 hover:ring-4 ring-red-500/5 dark:ring-red-950/20 transition-all"
              title="Painel de Administração"
              aria-label="Acessar Painel de Administração"
            >
              <Shield class="w-4.5 h-4.5" />
            </NuxtLink>

            <!-- Onboarding Help Button (Desktop) -->
            <OnboardingHelpButton class="hidden md:flex" />

            <!-- Central de Notificações (Sino com Badge) -->
            <button
              @click="openNotificationCenter"
              class="relative w-10 h-10 rounded-[0.75rem] items-center justify-center text-gray-600 dark:text-gray-400 hover:ring-4 ring-slate-100 dark:ring-gray-800/50 transition-all flex cursor-pointer"
              aria-label="Abrir Central de Notificações"
              title="Central de Notificações"
            >
              <Bell class="w-4.5 h-4.5 text-slate-700 dark:text-slate-300" />
              <span 
                v-if="unreadCount > 0" 
                class="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-blue-600 text-white text-[10px] font-black rounded-full border-2 border-white dark:border-slate-950"
              >
                {{ unreadCount > 99 ? '99+' : unreadCount }}
              </span>
            </button>

            <!-- User Avatar (Desktop) -->
            <div ref="menuRef" class="hidden md:block relative">
              <button 
                @click="toggleMenu" 
                class="w-10 h-10 rounded-[0.75rem] bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden hover:ring-4 ring-slate-100 dark:ring-gray-800/50 transition-all border border-slate-200 dark:border-slate-800/80 shadow-sm relative z-[60]"
              >
                <img v-if="(user as any)?.avatar || profile?.avatar" :src="(user as any)?.avatar || profile?.avatar" class="w-full h-full object-cover" loading="lazy">
                <span v-else class="text-sm font-black text-gray-900 dark:text-gray-50">{{ (user as any)?.name?.charAt(0).toUpperCase() || profile?.name?.charAt(0).toUpperCase() }}</span>
              </button>

              <!-- Dropdown Desktop -->
              <div v-if="isMenuOpen" class="absolute right-0 mt-3 w-48 bg-white dark:bg-gray-900 rounded-[0.75rem] shadow-xl border border-slate-200 dark:border-gray-700 py-1.5 overflow-hidden ring-1 ring-black/5 dark:ring-white/5 z-[70]">
                <div class="px-4 py-2 border-b border-slate-200 dark:border-gray-700 flex items-center gap-3">
                  <div class="w-6 h-6 rounded-lg overflow-hidden bg-slate-100 dark:bg-gray-700 shrink-0">
                    <img v-if="(user as any)?.avatar || profile?.avatar" :src="(user as any)?.avatar || profile?.avatar" class="w-full h-full object-cover" loading="lazy">
                  </div>
                  <p class="text-xs font-bold text-gray-900 dark:text-gray-50 truncate">{{ (user as any)?.name || profile?.name }}</p>
                </div>
                <NuxtLink to="/configuracoes" @click="isMenuOpen = false" class="block px-4 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition" active-class="!text-blue-600 dark:!text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/30">Configurações</NuxtLink>
                <NuxtLink to="/planos" @click="isMenuOpen = false" class="block px-4 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition" active-class="!text-blue-600 dark:!text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/30">Plano e Recarga</NuxtLink>
                <button @click="toggle()" class="w-full text-left px-4 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center justify-between">
                  <span>Aparência</span>
                  <span class="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1">
                    <Sun v-if="isDark" class="w-3.5 h-3.5 text-amber-500" />
                    <Moon v-else class="w-3.5 h-3.5 text-slate-400" />
                    {{ isDark ? 'Escuro' : 'Claro' }}
                  </span>
                </button>
                <NuxtLink v-if="user?.role === 'admin'" to="/admin" @click="isMenuOpen = false" class="block px-4 py-2 text-xs text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-950/30 transition border-t border-gray-50 dark:border-gray-800">Painel Admin</NuxtLink>
                <button @click="logout" class="w-full text-left px-4 py-2 text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition border-t border-gray-50 dark:border-gray-800 mt-1">Sair</button>
              </div>
            </div>

            <!-- Botão Hambúrguer (Mobile) -->
            <BaseButton
              variant="ghost"
              size="icon"
              @click="toggleMobileDrawer"
              class="md:hidden text-gray-700 dark:text-gray-200"
              aria-label="Abrir menu principal"
            >
              <Menu v-if="!isMobileDrawerOpen" class="w-6 h-6" />
              <X v-else class="w-6 h-6" />
            </BaseButton>
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

    <!-- Overlay & Drawer Lateral Mobile (Slideover) -->
    <ClientOnly>
      <Teleport to="body">
        <!-- Backdrop Backdrop-blur -->
        <Transition
          enter-active-class="transition-opacity duration-300 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-200 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="isMobileDrawerOpen"
            @click="isMobileDrawerOpen = false"
            class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[200] md:hidden"
          ></div>
        </Transition>

        <!-- Drawer Content Container -->
        <Transition
          enter-active-class="transition-transform duration-300 ease-out"
          enter-from-class="translate-x-full"
          enter-to-class="translate-x-0"
          leave-active-class="transition-transform duration-200 ease-in"
          leave-from-class="translate-x-0"
          leave-to-class="translate-x-full"
        >
          <aside
            v-if="isMobileDrawerOpen"
            class="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 z-[201] shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-gray-800 p-6 md:hidden overflow-y-auto custom-scrollbar"
          >
            <div class="space-y-6">
              <!-- Header da Gaveta -->
              <div class="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-gray-800">
                <AppLogo size="sm" :light="isDark" />
                <BaseButton variant="ghost" size="icon-sm" @click="isMobileDrawerOpen = false" aria-label="Fechar menu">
                  <X class="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </BaseButton>
              </div>

              <!-- Card de Usuário & Créditos -->
              <div class="bg-slate-50/80 dark:bg-gray-800/60 p-4 rounded-3xl border border-slate-200 dark:border-gray-800 space-y-4">
                <div class="flex items-center gap-3">
                  <div class="w-11 h-11 rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-gray-700 shadow-sm shrink-0">
                    <img v-if="(user as any)?.avatar || profile?.avatar" :src="(user as any)?.avatar || profile?.avatar" class="w-full h-full object-cover" loading="lazy">
                    <span v-else class="text-base font-black text-gray-900 dark:text-gray-50">{{ (user as any)?.name?.charAt(0).toUpperCase() || profile?.name?.charAt(0).toUpperCase() }}</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <h4 class="text-sm font-black text-gray-900 dark:text-gray-50 truncate">{{ (user as any)?.name || profile?.name }}</h4>
                    <p class="text-[10px] font-bold text-gray-400 dark:text-gray-500 truncate">{{ (user as any)?.email || profile?.email }}</p>
                  </div>
                </div>

                <div class="flex items-center justify-between pt-3 border-t border-slate-200/50 dark:border-gray-700/50">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-500">
                      <Coins class="w-4 h-4" />
                    </div>
                    <span class="text-xs font-black text-gray-900 dark:text-gray-50">{{ profile?.creditsBalance ?? 0 }} créditos</span>
                  </div>
                  <span class="text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 tracking-wider">
                    {{ profile?.subscriptionPlan || 'FREE' }}
                  </span>
                </div>
              </div>

              <!-- Menu de Links -->
              <div class="space-y-1">
                <p class="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 px-3 mb-2">Navegação</p>
                <NuxtLink
                  to="/dashboard"
                  @click="isMobileDrawerOpen = false"
                  class="flex items-center justify-between px-3 py-3 rounded-2xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                  active-class="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-black"
                >
                  <div class="flex items-center gap-3">
                    <Home class="w-4.5 h-4.5" />
                    <span>Dashboard</span>
                  </div>
                  <ChevronRight class="w-4 h-4 opacity-40" />
                </NuxtLink>

                <NuxtLink
                  to="/clientes"
                  @click="isMobileDrawerOpen = false"
                  class="flex items-center justify-between px-3 py-3 rounded-2xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                  active-class="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-black"
                >
                  <div class="flex items-center gap-3">
                    <Users class="w-4.5 h-4.5" />
                    <span>Clientes</span>
                  </div>
                  <ChevronRight class="w-4 h-4 opacity-40" />
                </NuxtLink>

                <NuxtLink
                  to="/catalogo"
                  @click="isMobileDrawerOpen = false"
                  class="flex items-center justify-between px-3 py-3 rounded-2xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                  active-class="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-black"
                >
                  <div class="flex items-center gap-3">
                    <BookOpen class="w-4.5 h-4.5" />
                    <span>Catálogo</span>
                  </div>
                  <ChevronRight class="w-4 h-4 opacity-40" />
                </NuxtLink>

                <NuxtLink
                  to="/orcamentos"
                  @click="isMobileDrawerOpen = false"
                  class="flex items-center justify-between px-3 py-3 rounded-2xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                  active-class="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-black"
                >
                  <div class="flex items-center gap-3">
                    <FileText class="w-4.5 h-4.5" />
                    <span>Orçamentos</span>
                  </div>
                  <ChevronRight class="w-4 h-4 opacity-40" />
                </NuxtLink>

                <NuxtLink
                  to="/agenda"
                  @click="isMobileDrawerOpen = false"
                  class="flex items-center justify-between px-3 py-3 rounded-2xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                  active-class="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-black"
                >
                  <div class="flex items-center gap-3">
                    <Calendar class="w-4.5 h-4.5" />
                    <span>Agenda</span>
                  </div>
                  <ChevronRight class="w-4 h-4 opacity-40" />
                </NuxtLink>

                <NuxtLink
                  to="/relatorios"
                  @click="isMobileDrawerOpen = false"
                  class="flex items-center justify-between px-3 py-3 rounded-2xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                  active-class="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-black"
                >
                  <div class="flex items-center gap-3">
                    <ReceiptText class="w-4.5 h-4.5" />
                    <span>Relatórios</span>
                  </div>
                  <ChevronRight class="w-4 h-4 opacity-40" />
                </NuxtLink>

                <NuxtLink
                  to="/configuracoes"
                  @click="isMobileDrawerOpen = false"
                  class="flex items-center justify-between px-3 py-3 rounded-2xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                  active-class="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-black"
                >
                  <div class="flex items-center gap-3">
                    <Settings class="w-4.5 h-4.5" />
                    <span>Configurações</span>
                  </div>
                  <ChevronRight class="w-4 h-4 opacity-40" />
                </NuxtLink>

                <NuxtLink
                  to="/planos"
                  @click="isMobileDrawerOpen = false"
                  class="flex items-center justify-between px-3 py-3 rounded-2xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                  active-class="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-black"
                >
                  <div class="flex items-center gap-3">
                    <Coins class="w-4.5 h-4.5" />
                    <span>Planos & Assinatura</span>
                  </div>
                  <ChevronRight class="w-4 h-4 opacity-40" />
                </NuxtLink>
              </div>

              <!-- Seção de Preferências e Ferramentas -->
              <div class="pt-4 border-t border-slate-200 dark:border-gray-800 space-y-2">
                <p class="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 px-3 mb-2">Preferências & Ajuda</p>

                <!-- Dark Mode -->
                <button
                  @click="toggle()"
                  class="w-full flex items-center justify-between px-3 py-3 rounded-2xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div class="flex items-center gap-3">
                    <Sun v-if="isDark" class="w-4.5 h-4.5 text-amber-500" />
                    <Moon v-else class="w-4.5 h-4.5 text-slate-400" />
                    <span>Aparência</span>
                  </div>
                  <span class="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {{ isDark ? 'Escuro' : 'Claro' }}
                  </span>
                </button>

                <!-- Tour Guiado / Ajuda -->
                <button
                  v-if="tourId"
                  @click="startTour(tourId, { force: true }); isMobileDrawerOpen = false"
                  class="w-full flex items-center justify-between px-3 py-3 rounded-2xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div class="flex items-center gap-3">
                    <HelpCircle class="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                    <span>Tour Guiado (Ajuda)</span>
                  </div>
                  <ChevronRight class="w-4 h-4 opacity-40" />
                </button>

                <!-- Painel Admin -->
                <NuxtLink
                  v-if="user?.role === 'admin'"
                  to="/admin"
                  @click="isMobileDrawerOpen = false"
                  class="flex items-center justify-between px-3 py-3 rounded-2xl text-xs font-black text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <div class="flex items-center gap-3">
                    <Shield class="w-4.5 h-4.5" />
                    <span>Painel Admin</span>
                  </div>
                  <ChevronRight class="w-4 h-4 opacity-40" />
                </NuxtLink>
              </div>
            </div>

            <!-- Rodapé com Botão de Sair -->
            <div class="pt-6 border-t border-slate-200 dark:border-gray-800 mt-6">
              <BaseButton variant="danger" size="md" class="w-full" @click="logout">
                <LogOut class="w-4 h-4 mr-2" /> Sair da Conta
              </BaseButton>
            </div>
          </aside>
        </Transition>
      </Teleport>
    </ClientOnly>

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
    <footer class="bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-gray-800 pt-8 pb-8 md:pb-16 px-6">
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
            <nav class="flex flex-col gap-2.5">
              <NuxtLink to="/dashboard" class="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Dashboard</NuxtLink>
              <NuxtLink to="/clientes" class="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Clientes</NuxtLink>
              <NuxtLink to="/catalogo" class="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Catálogo</NuxtLink>
              <NuxtLink to="/orcamentos" class="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Orçamentos</NuxtLink>
              <NuxtLink to="/agenda" class="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Agenda</NuxtLink>
              <NuxtLink to="/relatorios" class="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Relatórios</NuxtLink>
              <NuxtLink to="/planos" class="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Planos & Assinatura</NuxtLink>
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
        
        <div class="pt-8 border-t border-slate-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p class="text-[10px] font-black text-gray-300 dark:text-gray-400 uppercase tracking-widest">
            {{ systemInfo?.footerText || `© ${new Date().getFullYear()} ${systemInfo?.landingPage?.appName || 'ORCEI'}. Todos os direitos reservados.` }}
          </p>
          <div class="flex items-center gap-6">
            <!-- <a v-if="profile?.contact?.social?.instagram" :href="`https://instagram.com/${profile.contact.social.instagram.replace('@', '')}`" target="_blank" class="text-gray-400 hover:text-pink-600 transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.074 4.771 4.85.058 1.266.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.164 4.771-4.771 4.85-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.075-4.771-4.85-.058-1.265-.069-1.644-.069-4.849 0-3.204.013-3.583.069-4.849.149-3.227 1.157-4.771 4.771-4.85 1.266-.058 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a> -->
            <div class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-full border border-slate-200 dark:border-gray-700">
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

    <NotificationCenterDrawer v-model:open="isDrawerOpen" />
  </div>
</template>
