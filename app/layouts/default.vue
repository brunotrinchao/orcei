<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession()
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-8">
          <NuxtLink to="/" class="text-xl font-bold text-blue-600">Orcei</NuxtLink>
          <div v-if="loggedIn" class="hidden md:flex gap-4">
            <NuxtLink to="/dashboard" class="text-gray-600 hover:text-blue-600">Dashboard</NuxtLink>
            <NuxtLink to="/dashboard/services" class="text-gray-600 hover:text-blue-600">Serviços</NuxtLink>
            <NuxtLink to="/dashboard/proposals" class="text-gray-600 hover:text-blue-600">Propostas</NuxtLink>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <template v-if="loggedIn">
            <span class="text-sm text-gray-500">{{ user?.name }}</span>
            <button 
              @click="clear()"
              class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
            >
              Sair
            </button>
          </template>
          <template v-else>
            <a 
              href="/api/auth/google"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Entrar
            </a>
          </template>
        </div>
      </nav>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>
  </div>
</template>
