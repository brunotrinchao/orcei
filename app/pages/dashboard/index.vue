<script setup lang="ts">
const { loggedIn, user } = useUserSession()
const { data: profile, pending } = useFetch('/api/profile')

// Proteção manual simples
onMounted(() => {
  if (!loggedIn.value) navigateTo('/')
})
</script>

<template>
  <div v-if="loggedIn">
    <header class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Bem-vindo, {{ user?.name }}!</h1>
      <p class="text-gray-600">Aqui está o resumo do seu negócio.</p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 class="text-sm font-medium text-gray-500">Créditos Disponíveis</h3>
        <p v-if="pending" class="mt-2 text-3xl font-bold text-blue-600">...</p>
        <p v-else class="mt-2 text-3xl font-bold text-blue-600">{{ profile?.creditsBalance ?? 0 }}</p>
      </div>
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 class="text-sm font-medium text-gray-500">Propostas Enviadas</h3>
        <p class="mt-2 text-3xl font-bold text-gray-900">0</p>
      </div>
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 class="text-sm font-medium text-gray-500">Serviços no Catálogo</h3>
        <p class="mt-2 text-3xl font-bold text-gray-900">0</p>
      </div>
    </div>
  </div>
</template>
