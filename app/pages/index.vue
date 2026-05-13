<script setup lang="ts">
const { loggedIn } = useUserSession()

// Se já estiver logado, manda pro dashboard
watchEffect(() => {
  if (loggedIn.value) {
    navigateTo('/dashboard')
  }
})
</script>

<template>
  <div class="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center text-center px-4">
    <h1 class="text-5xl md:text-7xl font-black text-gray-900 mb-6 tracking-tight">
      Propostas que <span class="text-blue-600">fecham negócios</span>.
    </h1>
    <p class="text-xl text-gray-500 max-w-2xl mb-10 leading-relaxed">
      Crie orçamentos profissionais em segundos, automatize contratos com IA e receba aprovações online. Tudo em um só lugar.
    </p>
    
    <div class="flex flex-col sm:flex-row gap-4">
      <NuxtLink 
        to="/auth/login"
        class="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-bold text-lg transition shadow-xl shadow-blue-100"
      >
        Começar Agora — É Grátis
      </NuxtLink>
      <a 
        href="#features"
        class="bg-white border-2 border-gray-100 hover:border-gray-200 text-gray-600 px-10 py-4 rounded-2xl font-bold text-lg transition"
      >
        Ver Funcionalidades
      </a>
    </div>

    <div class="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
      <div class="p-6 bg-white rounded-2xl border border-gray-100 text-left">
        <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 class="font-bold text-lg mb-2">Rapidez Total</h3>
        <p class="text-gray-500 text-sm">Gere descrições de serviços com IA e envie propostas em menos de 2 minutos.</p>
      </div>
      <div class="p-6 bg-white rounded-2xl border border-gray-100 text-left">
        <div class="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h3 class="font-bold text-lg mb-2">Contratos Seguros</h3>
        <p class="text-gray-500 text-sm">Anexe termos e condições automaticamente e proteja seu trabalho juridicamente.</p>
      </div>
      <div class="p-6 bg-white rounded-2xl border border-gray-100 text-left">
        <div class="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <h3 class="font-bold text-lg mb-2">Acompanhamento</h3>
        <p class="text-gray-500 text-sm">Saiba quando o cliente visualizou sua proposta e receba a aprovação em tempo real.</p>
      </div>
    </div>
  </div>
</template>
