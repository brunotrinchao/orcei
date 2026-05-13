<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession()
const { data: profile } = useFetch('/api/profile')

const isMenuOpen = ref(false)
const container = ref(null)

// Fechar menu ao clicar fora
onClickOutside(container, () => {
  isMenuOpen.value = false
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-20 md:pb-0">
    <header class="bg-white shadow-sm sticky top-0 z-50">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-8">
          <NuxtLink to="/" class="text-xl font-bold text-blue-600">Orcei</NuxtLink>
          <div v-if="loggedIn" class="hidden md:flex gap-4">
            <NuxtLink to="/dashboard" class="text-gray-600 hover:text-blue-600 font-medium">Dashboard</NuxtLink>
            <NuxtLink to="/dashboard/services" class="text-gray-600 hover:text-blue-600 font-medium">Serviços</NuxtLink>
            <NuxtLink to="/dashboard/proposals" class="text-gray-600 hover:text-blue-600 font-medium">Propostas</NuxtLink>
          </div>
        </div>

        <div class="flex items-center gap-4 sm:gap-6">
          <template v-if="loggedIn">
            <!-- Créditos -->
            <div class="flex flex-col items-end">
              <span class="text-[8px] sm:text-[10px] uppercase font-bold text-gray-400 tracking-wider">Créditos</span>
              <span class="text-xs sm:text-sm font-bold text-gray-700">
                {{ profile?.creditsUsed ?? 0 }} / {{ profile?.creditsBalance ?? 0 }}
              </span>
            </div>

            <!-- User Menu -->
            <div class="relative" ref="container">
              <button 
                @click="isMenuOpen = !isMenuOpen"
                class="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition"
              >
                <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                  {{ user?.name?.charAt(0).toUpperCase() }}
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 transition-transform" :class="{ 'rotate-180': isMenuOpen }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- Dropdown -->
              <div v-if="isMenuOpen" class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div class="px-4 py-2 border-b border-gray-50">
                  <p class="text-sm font-bold text-gray-900 truncate">{{ user?.name }}</p>
                  <p class="text-xs text-gray-500 truncate">{{ user?.email }}</p>
                </div>

                <!-- Mobile Nav Links -->
                <div class="md:hidden border-b border-gray-50 py-2">
                  <NuxtLink to="/dashboard" @click="isMenuOpen = false" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition font-medium">
                    Dashboard
                  </NuxtLink>
                  <NuxtLink to="/dashboard/services" @click="isMenuOpen = false" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition font-medium">
                    Serviços
                  </NuxtLink>
                  <NuxtLink to="/dashboard/proposals" @click="isMenuOpen = false" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition font-medium">
                    Propostas
                  </NuxtLink>
                </div>
                
                <NuxtLink to="/dashboard/settings" @click="isMenuOpen = false" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Configurações
                </NuxtLink>

                <NuxtLink to="/dashboard/billing" @click="isMenuOpen = false" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Plano
                </NuxtLink>

                <div class="border-t border-gray-50 mt-2 pt-2">
                  <button 
                    @click="clear(); isMenuOpen = false"
                    class="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sair
                  </button>
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <a 
              href="/api/auth/google"
              class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-bold transition shadow-lg shadow-blue-100"
            >
              Entrar
            </a>
          </template>
        </div>
      </nav>
    </header>

    <!-- Mobile Bottom Tab Bar (Optional but good for Mobile First) -->
    <nav v-if="loggedIn" class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-16 z-50">
      <NuxtLink to="/dashboard" class="flex flex-col items-center gap-1 text-gray-400" active-class="text-blue-600">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span class="text-[10px] font-bold">Início</span>
      </NuxtLink>
      <NuxtLink to="/dashboard/services" class="flex flex-col items-center gap-1 text-gray-400" active-class="text-blue-600">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span class="text-[10px] font-bold">Serviços</span>
      </NuxtLink>
      <NuxtLink to="/dashboard/proposals" class="flex flex-col items-center gap-1 text-gray-400" active-class="text-blue-600">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span class="text-[10px] font-bold">Propostas</span>
      </NuxtLink>
      <NuxtLink to="/dashboard/settings" class="flex flex-col items-center gap-1 text-gray-400" active-class="text-blue-600">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span class="text-[10px] font-bold">Perfil</span>
      </NuxtLink>
    </nav>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>
  </div>
</template>
