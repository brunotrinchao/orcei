<script setup lang="ts">
import { SubscriptionPlan } from '../../types/enums'
import { onClickOutside } from '@vueuse/core'
import {
  Shield, ArrowLeft, Home, FileText, Plus, Users, Settings, LogOut,
  BookOpen, ReceiptText, Coins, Moon, Sun, HelpCircle, Menu, X,
  ChevronRight, ChevronDown, Calendar, Bell, Search, LayoutDashboard, Sparkles, ChevronLeft
} from 'lucide-vue-next'
import type { Component } from 'vue'
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

// Estados do Sidebar e Menus
const isSidebarCollapsed = ref(false)
const isMobileDrawerOpen = ref(false)
const isUserMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)
const globalSearch = ref('')

onClickOutside(userMenuRef, () => {
  isUserMenuOpen.value = false
})

const route = useRoute()
const { hasTourForRoute, startTour } = useOnboarding()
const tourId = computed(() => hasTourForRoute(route.path))

watch(() => route.path, () => {
  isMobileDrawerOpen.value = false
  isUserMenuOpen.value = false
})

function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

function toggleMobileDrawer() {
  isMobileDrawerOpen.value = !isMobileDrawerOpen.value
}

const { isDark, toggle } = useDarkMode()
const { confirm: confirmAlert } = useAlerts()
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

// Mapeamento do Título da Página Atual
const pageTitle = computed(() => {
  if (route.meta.title) return route.meta.title as string
  const path = route.path
  if (path.startsWith('/dashboard')) return 'Dashboard'
  if (path.startsWith('/clientes')) return 'Clientes'
  if (path.startsWith('/catalogo')) return 'Catálogo'
  if (path.startsWith('/orcamentos')) return 'Orçamentos'
  if (path.startsWith('/agenda')) return 'Agenda'
  if (path.startsWith('/relatorios')) return 'Relatórios'
  if (path.startsWith('/configuracoes')) return 'Configurações'
  if (path.startsWith('/planos')) return 'Planos & Créditos'
  if (path.startsWith('/admin')) return 'Painel de Administração'
  return 'Orcei Fácil'
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

interface NavSubItem {
  id: string
  label: string
  to: string
  sectionId?: string
}

interface NavItem {
  label: string
  to: string
  icon: Component
  children?: NavSubItem[]
}

const settingsChildren: NavSubItem[] = [
  { id: 'visual', label: 'Identidade Visual', to: '/configuracoes?section=visual', sectionId: 'visual' },
  { id: 'empresa', label: 'Dados da Empresa', to: '/configuracoes?section=empresa', sectionId: 'empresa' },
  { id: 'endereco', label: 'Endereço', to: '/configuracoes?section=endereco', sectionId: 'endereco' },
  { id: 'contato', label: 'Contato', to: '/configuracoes?section=contato', sectionId: 'contato' },
  { id: 'integracoes', label: 'Integrações', to: '/configuracoes?section=integracoes', sectionId: 'integracoes' },
  { id: 'multiplos-cadastros', label: 'Múltiplos Cadastros', to: '/configuracoes?section=multiplos-cadastros', sectionId: 'multiplos-cadastros' },
  { id: 'negocio', label: 'Regras de Negócio', to: '/configuracoes?section=negocio', sectionId: 'negocio' },
  { id: 'modelos', label: 'Modelos Legais', to: '/configuracoes?section=modelos', sectionId: 'modelos' },
  { id: 'privacidade', label: 'Privacidade e Dados', to: '/configuracoes?section=privacidade', sectionId: 'privacidade' }
]

const navigationItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Clientes', to: '/clientes', icon: Users },
  { label: 'Catálogo', to: '/catalogo', icon: BookOpen },
  { label: 'Orçamentos', to: '/orcamentos', icon: FileText },
  { label: 'Agenda', to: '/agenda', icon: Calendar },
  { label: 'Relatórios', to: '/relatorios', icon: ReceiptText },
  { label: 'Configurações', to: '/configuracoes', icon: Settings, children: settingsChildren },
  { label: 'Planos & Créditos', to: '/planos', icon: Coins }
]

const openMenus = ref<Record<string, boolean>>({})

watch(() => route.path, (newPath) => {
  if (newPath?.startsWith('/configuracoes')) {
    openMenus.value['/configuracoes'] = true
  }
}, { immediate: true })

function toggleMenu(to: string) {
  openMenus.value[to] = !openMenus.value[to]
}

function handleParentClick(item: NavItem) {
  if (item.children) {
    if (isSidebarCollapsed.value) {
      isSidebarCollapsed.value = false
    }
    toggleMenu(item.to)
    if (!route.path.startsWith(item.to)) {
      navigateTo(item.to)
    }
  } else {
    navigateTo(item.to)
  }
}

function isNavActive(item: NavItem) {
  if (item.to === '/dashboard') return route.path === '/dashboard'
  return route.path.startsWith(item.to)
}

function isSubActive(sub: NavSubItem) {
  if (!route.path.startsWith('/configuracoes')) return false
  const currentSection = (route.query.section as string) || 'visual'
  return currentSection === sub.sectionId
}
</script>

<template>
  <div class="min-h-screen bg-[#F4F4F4] dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-50 antialiased flex">

    <!-- ─── SIDEBAR FIXO DESKTOP ─────────────────────────────────── -->
    <aside v-if="loggedIn"
      class="hidden md:flex flex-col fixed top-0 bottom-0 left-0 bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-800 z-40 transition-all duration-300 shadow-xs"
      :class="isSidebarCollapsed ? 'w-20' : 'w-64'">
      <!-- Header do Sidebar (Logo & Toggle) -->
      <div
        class="h-16 px-5 flex items-center justify-between border-b border-slate-100 dark:border-gray-800/80 shrink-0">
        <NuxtLink to="/dashboard" class="flex items-center gap-3 overflow-hidden">
          <AppLogo :size="isSidebarCollapsed ? 'sm' : 'sm'" :light="isDark" :iconOnly="isSidebarCollapsed"/>
        </NuxtLink>
      </div>

      <!-- Menu Principal de Links -->
      <div class="flex-1 space-y-1 overflow-y-auto custom-scrollbar px-2 py-2">
        <div v-for="item in navigationItems" :key="item.to">
          <!-- Item com Submenu -->
          <template v-if="item.children">
            <div
              @click="handleParentClick(item)"
              class="group flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800/60 transition-all cursor-pointer select-none"
              :class="isNavActive(item) ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/70 dark:bg-blue-950/40' : ''"
              :title="isSidebarCollapsed ? item.label : undefined"
            >
              <div class="flex items-center gap-3.5 min-w-0">
                <component :is="item.icon" class="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" :class="isNavActive(item) ? 'text-blue-600 dark:text-blue-400' : ''" />
                <span v-if="!isSidebarCollapsed" class="truncate">{{ item.label }}</span>
              </div>

              <component
                v-if="!isSidebarCollapsed"
                :is="openMenus[item.to] ? ChevronDown : ChevronRight"
                class="w-4 h-4 text-slate-400 dark:text-gray-500 transition-transform shrink-0"
              />
            </div>

            <!-- Lista de Submenus (Visualmente idêntica à imagem de exemplo) -->
            <div
              v-if="openMenus[item.to] && !isSidebarCollapsed"
              class="pl-9 pr-2 py-1 space-y-0.5"
            >
              <NuxtLink
                v-for="sub in item.children"
                :key="sub.id"
                :to="sub.to"
                class="flex items-center justify-between px-3 py-3 text-xs transition-all font-normal"
                :class="isSubActive(sub)
                  ? 'text-blue-600 dark:text-blue-400 font-normal'
                  : 'text-slate-500 dark:text-gray-400 hover:text-slate-900'"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  
                  <span class="truncate">{{ sub.label }}</span>
                </div>
              </NuxtLink>
            </div>
          </template>

          <!-- Item Normal sem Submenu -->
          <NuxtLink
            v-else
            :to="item.to"
            @mouseenter="preloadRouteComponents(item.to)"
            @focus="preloadRouteComponents(item.to)"
            class="group flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800/60 transition-all"
            :class="isNavActive(item) ? '!text-blue-600 dark:!text-blue-400 font-bold bg-blue-50/70 dark:bg-blue-950/40' : ''"
            :title="isSidebarCollapsed ? item.label : undefined"
          >
            <div class="flex items-center gap-3.5 min-w-0">
              <component :is="item.icon" class="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" :class="isNavActive(item) ? 'text-blue-600 dark:text-blue-400' : ''" />
              <span v-if="!isSidebarCollapsed" class="truncate">{{ item.label }}</span>
            </div>

            <ChevronRight
              v-if="!isSidebarCollapsed"
              class="w-4 h-4 text-slate-300 dark:text-gray-600 group-hover:text-slate-500 dark:group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all shrink-0"
            />
          </NuxtLink>
        </div>

        <!-- Link Admin no Sidebar se for admin -->
        <NuxtLink
          v-if="user?.role === 'admin'"
          to="/admin"
          class="group flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
          :class="route.path.startsWith('/admin') ? 'bg-red-100/80 dark:bg-red-950/50 font-bold' : ''"
          :title="isSidebarCollapsed ? 'Painel Admin' : undefined"
        >
          <div class="flex items-center gap-3.5 min-w-0">
            <Shield class="w-5 h-5 shrink-0" />
            <span v-if="!isSidebarCollapsed" class="truncate">Painel Admin</span>
          </div>
          <ChevronRight v-if="!isSidebarCollapsed" class="w-4 h-4 opacity-40 shrink-0" />
        </NuxtLink>
      </div>

      <!-- Botão CTA no fundo do Sidebar (+ Novo Orçamento) -->
      <div class="p-3 border-t border-slate-100 dark:border-gray-800/80 space-y-3 shrink-0">
        <BaseButton block>
          <NuxtLink to="/orcamentos?novo=true">
            <div class="flex">
            <Plus class="w-5 h-5 shrink-0" /> 
            <span v-if="!isSidebarCollapsed" class="truncate">Novo Orçamento</span>
            </div>
          </NuxtLink>
        </BaseButton>

        <!-- Informações Rápidas do Usuário / Créditos -->
        <div v-if="!isSidebarCollapsed"
          class="p-3 rounded-[.5rem] bg-slate-50 dark:bg-gray-800/40 border border-slate-200/60 dark:border-gray-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Coins class="w-4 h-4 text-amber-500 shrink-0" />
            <div class="flex flex-col">
              <span
                class="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-wider leading-none">Créditos</span>
              <span class="text-xs font-black text-slate-800 dark:text-slate-100 mt-0.5 leading-none">{{
                profile?.creditsBalance ?? 0 }}</span>
            </div>
          </div>
          <NuxtLink to="/planos"
            class="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-wider">
            Recarregar</NuxtLink>
        </div>
      </div>
    </aside>

    <!-- ─── CONTEÚDO PRINCIPAL (HEADER TOP + SLOT) ──────────────────── -->
    <div class="flex-1 flex flex-col min-w-0 transition-all duration-300"
      :class="loggedIn ? (isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64') : ''">
      <!-- Header Superior Fixo / Sticky -->
      <header
        class="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-gray-800 shadow-xs h-16 px-4 sm:px-8 flex items-center justify-between gap-4">

        <!-- Esquerda: Toggle Mobile + Título da Página / Breadcrumb -->
        <div class="flex items-center gap-4 min-w-0">
          <button v-if="loggedIn" @click="toggleMobileDrawer"
            class="md:hidden p-2 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer shrink-0"
            aria-label="Abrir Menu">
            <Menu class="w-6 h-6" />
          </button>

          <NuxtLink v-if="!loggedIn" to="/" class="md:hidden">
            <AppLogo size="sm" :light="isDark" />
          </NuxtLink>

          <!-- Título da Página -->
          <div class="flex items-center gap-2 min-w-0">
            <button @click="toggleSidebar"
              class="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer shrink-0"
              :title="isSidebarCollapsed ? 'Expandir Menu' : 'Recolher Menu'">
              <ChevronLeft
                :class="['w-5 h-5 transition-transform duration-300', isSidebarCollapsed ? 'rotate-180' : '']" />
            </button>
            <h1 class="text-base sm:text-2xl font-semibold text-slate-900 dark:text-white truncate tracking-tight">
              {{ pageTitle }}
            </h1>
          </div>
        </div>

        <!-- Direita: Pesquisa Global, Notificações, Perfil -->
        <div class="flex items-center gap-2 sm:gap-4 shrink-0">

          <template v-if="loggedIn">
            <!-- Botão de Aparência (Dark Mode) -->
            <button @click="toggle()"
              class="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
              :title="isDark ? 'Modo Claro' : 'Modo Escuro'">
              <Sun v-if="isDark" class="w-5 h-5 text-amber-500" />
              <Moon v-else class="w-5 h-5 text-slate-500" />
            </button>

            <!-- Central de Notificações -->
            <button @click="openNotificationCenter"
              class="relative w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
              title="Notificações">
              <Bell class="w-5 h-5 text-slate-600 dark:text-gray-300" />
              <span v-if="unreadCount > 0"
                class="absolute -top-1 -right-1 min-w-[18px] h-4 px-1 flex items-center justify-center bg-blue-600 text-white text-[9px] font-black rounded-full border-2 border-white dark:border-gray-900">
                {{ unreadCount > 99 ? '99+' : unreadCount }}
              </span>
            </button>

            <!-- Menu de Perfil do Usuário (Avatar + Nome + Cargo) -->
            <div ref="userMenuRef" class="relative">
              <button @click="isUserMenuOpen = !isUserMenuOpen"
                class="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-gray-800 transition-all cursor-pointer outline-none">
                <div
                  class="w-9 h-9 rounded-[.5rem] bg-blue-600 text-white flex items-center justify-center overflow-hidden font-black text-xs shadow-xs shrink-0">
                  <img v-if="(user as any)?.avatar || profile?.avatar" :src="(user as any)?.avatar || profile?.avatar"
                    class="w-full h-full object-cover" loading="lazy">
                  <span v-else>{{ (user as any)?.name?.charAt(0).toUpperCase() || profile?.name?.charAt(0).toUpperCase()
                  }}</span>
                </div>

                <div class="hidden sm:flex flex-col text-left">
                  <span class="text-xs font-normal text-slate-900 dark:text-white leading-tight truncate max-w-[140px]">
                    {{ (user as any)?.name || profile?.name || 'Usuário' }}
                  </span>
                  <span
                    class="text-[10px] font-normal text-slate-400 dark:text-gray-500 uppercase tracking-wider leading-none mt-0.5">
                    {{ user?.role === 'admin' ? 'Super Admin' : (profile?.subscriptionPlan || 'Membro') }}
                  </span>
                </div>
              </button>

              <!-- Dropdown do Perfil -->
              <div v-if="isUserMenuOpen"
                class="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div class="px-4 py-2 border-b border-slate-100 dark:border-gray-800 mb-1">
                  <p class="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {{ (user as any)?.name || profile?.name || 'Usuário' }}
                  </p>
                  <p class="text-[10px] text-slate-400 dark:text-gray-500 truncate">
                    {{ user?.email || (profile as any)?.email || '' }}
                  </p>
                </div>

                <NuxtLink to="/configuracoes" @click="isUserMenuOpen = false"
                  class="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors">
                  <Settings class="w-4 h-4 text-slate-400" /> Configurações
                </NuxtLink>

                <NuxtLink to="/planos" @click="isUserMenuOpen = false"
                  class="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors">
                  <Coins class="w-4 h-4 text-amber-500" /> Planos & Créditos
                </NuxtLink>

                <div class="my-1 border-t border-slate-100 dark:border-gray-800"></div>

                <button @click="logout"
                  class="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                  <LogOut class="w-4 h-4" /> Sair da Conta
                </button>
              </div>
            </div>
          </template>

          <template v-else>
            <NuxtLink to="/auth/login"
              class="px-4 py-2 text-xs font-bold text-slate-700 dark:text-gray-300 hover:text-blue-600 transition-colors">
              Entrar
            </NuxtLink>
            <NuxtLink to="/auth/register"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all">
              Criar Conta
            </NuxtLink>
          </template>
        </div>
      </header>

      <!-- Conteúdo da Página Solicitada -->
      <main class="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
        <slot />
      </main>

      <!-- Rodapé Simples -->
      <footer
        class="border-t border-slate-200/60 dark:border-gray-800/80 py-4 px-4 sm:px-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xs text-center text-xs text-slate-400 dark:text-gray-500">
        <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {{ new Date().getFullYear() }} Orcei Fácil. Todos os direitos reservados.</span>
          <div class="flex items-center gap-4">
            <NuxtLink to="/terms" class="hover:underline">Termos de Uso</NuxtLink>
            <NuxtLink to="/privacy" class="hover:underline">Política de Privacidade</NuxtLink>
          </div>
        </div>
      </footer>
    </div>

    <!-- ─── DRAWER MOBILE ─────────────────────────────────────────── -->
    <ClientOnly>
      <Teleport to="body">
        <Transition enter-active-class="transition-opacity duration-300 ease-out" enter-from-class="opacity-0"
          enter-to-class="opacity-100" leave-active-class="transition-opacity duration-200 ease-in"
          leave-from-class="opacity-100" leave-to-class="opacity-0">
          <div v-if="isMobileDrawerOpen" @click="isMobileDrawerOpen = false"
            class="fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-[200] md:hidden"></div>
        </Transition>

        <Transition enter-active-class="transition-transform duration-300 ease-out" enter-from-class="-translate-x-full"
          enter-to-class="translate-x-0" leave-active-class="transition-transform duration-200 ease-in"
          leave-from-class="translate-x-0" leave-to-class="-translate-x-full">
          <aside v-if="isMobileDrawerOpen"
            class="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 z-[201] shadow-2xl flex flex-col justify-between border-r border-slate-200 dark:border-gray-800 p-6 md:hidden overflow-y-auto custom-scrollbar">
            <div class="space-y-6">
              <div class="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-gray-800">
                <AppLogo size="sm" :light="isDark" />
                <button @click="isMobileDrawerOpen = false"
                  class="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl">
                  <X class="w-5 h-5" />
                </button>
              </div>

              <!-- Menu Mobile -->
              <div class="space-y-1">
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 px-3 mb-2">
                  Navegação</p>
                <div v-for="item in navigationItems" :key="item.to">
                  <!-- Item com Submenu Mobile -->
                  <template v-if="item.children">
                    <div class="space-y-1">
                      <div
                        @click="toggleMenu(item.to); if (!route.path.startsWith(item.to)) navigateTo(item.to)"
                        class="flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors cursor-pointer select-none"
                        :class="isNavActive(item) ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-black' : ''"
                      >
                        <div class="flex items-center gap-3.5">
                          <component :is="item.icon" class="w-5 h-5" />
                          <span>{{ item.label }}</span>
                        </div>
                        <component :is="openMenus[item.to] ? ChevronDown : ChevronRight" class="w-4 h-4 opacity-60" />
                      </div>

                      <div v-if="openMenus[item.to]" class="pl-8 pr-2 space-y-1">
                        <NuxtLink
                          v-for="sub in item.children"
                          :key="sub.id"
                          :to="sub.to"
                          @click="isMobileDrawerOpen = false"
                          class="flex items-center gap-2.5 py-2 px-3 text-xs font-medium rounded-xl transition-colors"
                          :class="isSubActive(sub) ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/40' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'"
                        >
                          <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="isSubActive(sub) ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-300 dark:bg-gray-600'" />
                          <span>{{ sub.label }}</span>
                        </NuxtLink>
                      </div>
                    </div>
                  </template>

                  <!-- Item Normal Mobile -->
                  <NuxtLink
                    v-else
                    :to="item.to"
                    @click="isMobileDrawerOpen = false"
                    class="flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                    :class="isNavActive(item) ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-black' : ''"
                  >
                    <div class="flex items-center gap-3.5">
                      <component :is="item.icon" class="w-5 h-5" />
                      <span>{{ item.label }}</span>
                    </div>
                    <ChevronRight class="w-4 h-4 opacity-40" />
                  </NuxtLink>
                </div>
              </div>
            </div>

            <div class="pt-6 border-t border-slate-200 dark:border-gray-800 mt-6">
              <BaseButton variant="danger" size="md" class="w-full" @click="logout">
                <LogOut class="w-4 h-4 mr-2" /> Sair da Conta
              </BaseButton>
            </div>
          </aside>
        </Transition>
      </Teleport>
    </ClientOnly>

    <NotificationCenterDrawer v-model:open="isDrawerOpen" />
  </div>
</template>
