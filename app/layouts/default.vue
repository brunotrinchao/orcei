<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import type { ProfileDTO } from '../../types'
const { loggedIn, user, clear } = useUserSession()
const { data: profile, refresh: refreshLayoutProfile } = useFetch<ProfileDTO>('/api/profile')

const isMenuOpen = ref(false)

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}
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

onMounted(() => {
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) refreshLayoutProfile()
  })
})
</script>

<template>
  <div class="min-h-screen bg-gray-50/50 pb-32 md:pb-0 font-sans text-gray-900 antialiased">
    <!-- Desktop/Mobile Header -->
    <header class="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
      <nav class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-12">
          <NuxtLink to="/"><AppLogo size="sm" /></NuxtLink>
          <div v-if="loggedIn" class="hidden md:flex gap-8">
            <NuxtLink to="/dashboard" class="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors" active-class="text-gray-900">Dashboard</NuxtLink>
            <NuxtLink to="/dashboard/clients" class="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors" active-class="text-gray-900">Clientes</NuxtLink>
            <NuxtLink to="/dashboard/catalog" class="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors" active-class="text-gray-900">Catálogo</NuxtLink>
            <NuxtLink to="/dashboard/proposals" class="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors" active-class="text-gray-900">Orçamentos</NuxtLink>
          </div>
          <div v-else class="hidden md:flex gap-8">
            <a href="#features" class="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Funcionalidades</a>
            <a href="#como-funciona" class="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Como Funciona</a>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <template v-if="loggedIn">
            <!-- Credits & Plan Display -->
            <div class="flex items-center gap-3 bg-gray-50/50 px-3 py-1.5 rounded-2xl border border-gray-100 mr-1">
              <div class="flex flex-col items-end">
                <span class="text-[8px] uppercase font-bold text-gray-400 tracking-widest">Créditos</span>
                <span class="text-xs font-semibold text-gray-700">{{ profile?.creditsBalance ?? 0 }}</span>
              </div>
              <div v-if="profile?.subscriptionPlan && profile.subscriptionPlan !== 'free'" class="h-6 w-px bg-gray-200"></div>
              <div v-if="profile?.subscriptionPlan && profile.subscriptionPlan !== 'free'" class="flex flex-col items-start">
                <span :class="[
                  'text-[8px] uppercase font-bold tracking-widest',
                  profile.cancelAtPeriodEnd ? 'text-amber-400' : 'text-blue-400'
                ]">{{ profile.cancelAtPeriodEnd ? 'Cancela em breve' : 'Plano' }}</span>
                <span :class="[
                  'text-[10px] font-black uppercase',
                  profile.cancelAtPeriodEnd ? 'text-amber-600' : 'text-blue-600'
                ]">{{ profile.subscriptionPlan }}</span>
              </div>
            </div>

            <!-- User Avatar -->
            <div class="relative">
              <button @click.stop="toggleMenu" class="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden hover:ring-4 ring-gray-100 transition-all border-2 border-white shadow-sm relative z-[60]">
                <img v-if="(user as any)?.avatar || profile?.avatar" :src="(user as any)?.avatar || profile?.avatar" class="w-full h-full object-cover">
                <span v-else class="text-sm font-black text-gray-900">{{ (user as any)?.name?.charAt(0).toUpperCase() || profile?.name?.charAt(0).toUpperCase() }}</span>
              </button>

              <!-- Dropdown (Minimalist) -->
              <div v-if="isMenuOpen" class="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 overflow-hidden ring-1 ring-black/5 z-[70]">
                <div class="px-4 py-2 border-b border-gray-50 flex items-center gap-3">
                  <div class="w-6 h-6 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    <img v-if="(user as any)?.avatar || profile?.avatar" :src="(user as any)?.avatar || profile?.avatar" class="w-full h-full object-cover">
                  </div>
                  <p class="text-xs font-bold text-gray-900 truncate">{{ (user as any)?.name || profile?.name }}</p>
                </div>
                <NuxtLink to="/dashboard/settings" @click="isMenuOpen = false" class="block px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 transition">Configurações</NuxtLink>
                <NuxtLink to="/dashboard/billing" @click="isMenuOpen = false" class="block px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 transition">Plano</NuxtLink>
                <button @click="logout" class="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition border-t border-gray-50 mt-1">Sair</button>
              </div>

              <!-- Click Overlay to close -->
              <div v-if="isMenuOpen" @click="isMenuOpen = false" class="fixed inset-0 z-[55]"></div>
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


    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-6 py-8 min-h-[calc(100vh-250px)]">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-100 pt-16 pb-32 md:pb-16 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div class="md:col-span-2 space-y-6">
            <AppLogo size="md" />
            <p class="text-sm text-gray-500 font-medium max-w-sm leading-relaxed">
              Transformando a gestão comercial de freelancers e pequenas empresas através de inteligência artificial e processos automatizados.
            </p>
            <div v-if="profile?.company" class="space-y-1">
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">{{ profile.company.legalName }}</p>
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">CNPJ: {{ profile.company.taxId }}</p>
            </div>
          </div>
          
          <div class="space-y-4">
            <h3 class="text-[10px] font-black text-gray-900 uppercase tracking-widest">Navegação</h3>
            <nav class="flex flex-col gap-3">
              <NuxtLink to="/dashboard" class="text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors">Dashboard</NuxtLink>
              <NuxtLink to="/dashboard/proposals" class="text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors">Orçamentos</NuxtLink>
              <NuxtLink to="/dashboard/clients" class="text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors">Clientes</NuxtLink>
            </nav>
          </div>

          <div class="space-y-4">
            <h3 class="text-[10px] font-black text-gray-900 uppercase tracking-widest">Suporte & Legal</h3>
            <nav class="flex flex-col gap-3">
              <NuxtLink to="/terms" class="text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors">Termos de Uso</NuxtLink>
              <NuxtLink to="/privacy" class="text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors">Privacidade</NuxtLink>
              <button @click="resetConsent" class="text-left text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors">Gerenciar Cookies</button>
              <a href="mailto:contato@orcei.com.br" class="text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors">contato@orcei.com.br</a>
            </nav>
          </div>
        </div>
        
        <div class="pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p class="text-[10px] font-black text-gray-300 uppercase tracking-widest">
            © {{ new Date().getFullYear() }} ORCEI. Todos os direitos reservados.
          </p>
          <div class="flex items-center gap-6">
            <a v-if="profile?.contact?.social?.instagram" :href="`https://instagram.com/${profile.contact.social.instagram.replace('@', '')}`" target="_blank" class="text-gray-400 hover:text-pink-600 transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.074 4.771 4.85.058 1.266.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.164 4.771-4.771 4.85-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.075-4.771-4.85-.058-1.265-.069-1.644-.069-4.849 0-3.204.013-3.583.069-4.849.149-3.227 1.157-4.771 4.771-4.85 1.266-.058 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <div class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
              <div class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-[8px] font-black text-gray-500 uppercase tracking-widest">Sistema Online</span>
            </div>
          </div>
        </div>
      </div>
    </footer>

    <!-- Mobile Tab Bar (Refined) -->
    <nav v-if="loggedIn" class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 px-4 z-50 pb-[env(safe-area-inset-bottom,0px)]">
      <NuxtLink to="/dashboard" class="flex flex-col items-center gap-1 text-gray-400 py-2" active-class="text-gray-900">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        <span class="text-[9px] font-bold">Início</span>
      </NuxtLink>
      <NuxtLink to="/dashboard/proposals" class="flex flex-col items-center gap-1 text-gray-400 py-2" active-class="text-gray-900">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <span class="text-[9px] font-bold">Propostas</span>
      </NuxtLink>
      <NuxtLink to="/dashboard/clients" class="flex flex-col items-center gap-1 text-gray-400 py-2" active-class="text-gray-900">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
        <span class="text-[9px] font-bold">Clientes</span>
      </NuxtLink>
      <NuxtLink to="/dashboard/catalog" class="flex flex-col items-center gap-1 text-gray-400 py-2" active-class="text-gray-900">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
        <span class="text-[9px] font-bold">Catálogo</span>
      </NuxtLink>
      <NuxtLink to="/dashboard/settings" class="flex flex-col items-center gap-1 text-gray-400 py-2" active-class="text-gray-900">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        <span class="text-[9px] font-bold">Ajustes</span>
      </NuxtLink>
    </nav>
  </div>
</template>
