<script setup lang="ts">
import type { ProfileDTO } from '../../types'
const { loggedIn, user, clear } = useUserSession()
const { data: profile } = useFetch<ProfileDTO>('/api/profile')

const isMenuOpen = ref(false)
const container = ref(null)

onClickOutside(container, () => {
  isMenuOpen.value = false
})
const { notify, confirm: confirmAlert } = useAlerts()

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
</script>

<template>
  <div class="min-h-screen bg-gray-50/50 pb-32 md:pb-0 font-sans text-gray-900 antialiased">
    <!-- Desktop/Mobile Header -->
    <header class="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
      <nav class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-12">
          <NuxtLink to="/" class="text-xl font-bold tracking-tight text-gray-900">orcei</NuxtLink>
          <div v-if="loggedIn" class="hidden md:flex gap-8">
            <NuxtLink to="/dashboard" class="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors" active-class="text-gray-900">Dashboard</NuxtLink>
            <NuxtLink to="/dashboard/clients" class="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors" active-class="text-gray-900">Clientes</NuxtLink>
            <NuxtLink to="/dashboard/catalog" class="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors" active-class="text-gray-900">Catálogo</NuxtLink>
            <NuxtLink to="/dashboard/proposals" class="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors" active-class="text-gray-900">Orçamentos</NuxtLink>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <template v-if="loggedIn">
            <!-- Credits Display (Refined) -->
            <div class="hidden sm:flex flex-col items-end mr-4">
              <span class="text-[8px] uppercase font-bold text-gray-400 tracking-widest">Créditos</span>
              <span class="text-xs font-semibold text-gray-700">{{ profile?.creditsBalance ?? 0 }}</span>
            </div>

            <!-- User Avatar -->
            <div class="relative" ref="container">
              <button @click="isMenuOpen = !isMenuOpen" class="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden hover:ring-4 ring-gray-100 transition-all border-2 border-white shadow-sm">
                <img v-if="(user as any)?.avatar" :src="(user as any).avatar" class="w-full h-full object-cover">
                <span v-else class="text-sm font-black text-gray-900">{{ (user as any)?.name?.charAt(0).toUpperCase() }}</span>
              </button>

              <!-- Dropdown (Minimalist) -->
              <Transition
                enter-active-class="transition duration-100 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-75 ease-in"
                leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0"
              >
                <div v-if="isMenuOpen" class="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 overflow-hidden ring-1 ring-black/5">
                  <div class="px-4 py-2 border-b border-gray-50">
                    <p class="text-xs font-bold text-gray-900 truncate">{{ (user as any)?.name }}</p>
                  </div>
                  <NuxtLink to="/dashboard/settings" @click="isMenuOpen = false" class="block px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 transition">Configurações</NuxtLink>
                  <NuxtLink to="/dashboard/billing" @click="isMenuOpen = false" class="block px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 transition">Plano</NuxtLink>
                  <button @click="logout" class="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition border-t border-gray-50 mt-1">Sair</button>
                </div>
              </Transition>
            </div>
          </template>
        </div>
      </nav>
    </header>


    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-6 py-8">
      <slot />
    </main>

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
