<script setup lang="ts">
import type { ProfileDTO } from '~/types'

const { loggedIn, user } = useUserSession()
const { data: profile } = useFetch<ProfileDTO>('/api/profile')
const { data: stats } = useFetch<any>('/api/dashboard/stats')
...

const statusMap: any = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  accepted: { label: 'Aceita', color: 'bg-green-100 text-green-800' }
}

onMounted(() => {
  if (!loggedIn.value) navigateTo('/')
})
</script>

<template>
  <div v-if="loggedIn">
    <header class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 leading-tight">Olá, {{ user?.name?.split(' ')[0] }}! 👋</h1>
      <p class="text-gray-600 text-sm sm:text-base">Veja o que está acontecendo com seus orçamentos hoje.</p>
    </header>

    <!-- Cards de Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
      <div class="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Créditos</p>
        <p class="text-xl sm:text-2xl font-black text-blue-600">{{ profile?.creditsBalance ?? 0 }}</p>
      </div>
      <div class="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Propostas</p>
        <p class="text-xl sm:text-2xl font-black text-gray-900">{{ stats?.proposalsCount ?? 0 }}</p>
      </div>
      <div class="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Serviços</p>
        <p class="text-xl sm:text-2xl font-black text-gray-900">{{ stats?.servicesCount ?? 0 }}</p>
      </div>
      <div class="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm text-center flex flex-col justify-center">
        <NuxtLink to="/dashboard/proposals" class="bg-blue-600 text-white text-[10px] sm:text-xs font-bold py-2 px-3 sm:px-4 rounded-xl hover:bg-blue-700 transition">
          Ver Tudo
        </NuxtLink>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Ações Rápidas -->
      <div class="lg:col-span-1 space-y-4">
        <h2 class="font-bold text-gray-900 mb-2">Atalhos</h2>
        <NuxtLink to="/dashboard/proposals" class="flex items-center gap-4 p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-100 group">
          <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span class="font-bold">Nova Proposta</span>
        </NuxtLink>
        <NuxtLink to="/dashboard/services" class="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:border-blue-300 transition group">
          <div class="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <span class="font-bold text-gray-700">Meus Serviços</span>
        </NuxtLink>
        <NuxtLink to="/dashboard/settings" class="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:border-blue-300 transition group">
          <div class="w-10 h-10 bg-gray-50 text-gray-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
          </div>
          <span class="font-bold text-gray-700">Configurações</span>
        </NuxtLink>
      </div>

      <!-- Outro conteudo -->
      <div class="lg:col-span-2">
        <h2 class="font-bold text-gray-900 mb-4">Bem-vindo ao Novo Orcei</h2>
        <div class="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm leading-relaxed text-gray-600">
          <p class="mb-4 text-sm sm:text-base">Agora você pode gerenciar suas propostas de forma muito mais profissional:</p>
          <ul class="space-y-3 list-disc pl-5 font-medium text-sm sm:text-base">
            <li>Gere descrições de serviços usando <span class="text-blue-600">Inteligência Artificial</span>.</li>
            <li>Edite contratos e termos de uso com um <span class="text-blue-600">Editor Rich Text</span> completo.</li>
            <li>Use variáveis dinâmicas como <code class="bg-gray-100 px-1 rounded">nome_cliente</code> para personalizar automaticamente.</li>
            <li>Exporte orçamentos em <span class="text-blue-600">PDF profissional</span> direto do servidor.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
