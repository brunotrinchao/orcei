<script setup lang="ts">
import type { ProfileDTO } from '~/types'

const { loggedIn, user } = useUserSession()
const { data: profile } = useFetch<ProfileDTO>('/api/profile')
const { data: stats } = useFetch<any>('/api/dashboard/stats')

onMounted(() => {
  if (!loggedIn.value) navigateTo('/')
})
</script>

<template>
  <div v-if="loggedIn" class="max-w-6xl mx-auto">
    <header class="mb-12">
      <h1 class="text-4xl font-black text-gray-900 tracking-tight uppercase">Olá, {{ user?.name?.split(' ')[0] }}</h1>
      <p class="text-gray-600 mt-2 text-lg font-medium">Bem-vindo de volta ao seu painel estratégico.</p>
    </header>

    <!-- Cards de Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
      <div class="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm group hover:border-blue-500 transition-all">
        <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 group-hover:text-blue-600 transition-colors">Créditos</p>
        <p class="text-3xl font-black text-gray-900 tracking-tight">{{ profile?.creditsBalance ?? 0 }}</p>
      </div>
      <div class="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
        <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Propostas</p>
        <p class="text-3xl font-black text-gray-900 tracking-tight">{{ stats?.proposalsCount ?? 0 }}</p>
      </div>
      <div class="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
        <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Serviços</p>
        <p class="text-3xl font-black text-gray-900 tracking-tight">{{ stats?.servicesCount ?? 0 }}</p>
      </div>
      <NuxtLink to="/dashboard/proposals" class="bg-gray-900 text-white p-8 rounded-[2.5rem] flex flex-col justify-center items-center hover:bg-black transition active:scale-95 shadow-2xl shadow-gray-200">
        <span class="text-xs font-black uppercase tracking-[0.2em] text-center">Nova Proposta</span>
      </NuxtLink>
    </div>

    <div class="bg-white p-12 rounded-[3.5rem] border border-gray-200 shadow-sm max-w-4xl">
      <h2 class="text-2xl font-black text-gray-900 tracking-tight uppercase mb-6">Bem-vindo ao Novo Orcei</h2>
      <p class="text-gray-600 text-lg font-medium leading-relaxed mb-10">Sua plataforma definitiva para propostas de alto impacto. Gere documentos profissionais e feche mais contratos em minutos.</p>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
        <div class="flex items-start gap-5">
          <div class="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
            <div class="i-heroicons-sparkles w-6 h-6 text-blue-600"></div>
          </div>
          <div>
            <h3 class="text-sm font-black text-gray-900 mb-1 uppercase tracking-tight">Inteligência Artificial</h3>
            <p class="text-sm text-gray-500 font-medium leading-relaxed">Gere descrições comerciais persuasivas em segundos.</p>
          </div>
        </div>
        
        <div class="flex items-start gap-5">
          <div class="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
            <div class="i-heroicons-document-arrow-down w-6 h-6 text-emerald-600"></div>
          </div>
          <div>
            <h3 class="text-sm font-black text-gray-900 mb-1 uppercase tracking-tight">Exportação PDF</h3>
            <p class="text-sm text-gray-500 font-medium leading-relaxed">Documentos prontos para envio com design premium.</p>
          </div>
        </div>

        <div class="flex items-start gap-5">
          <div class="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
            <div class="i-heroicons-adjustments-horizontal w-6 h-6 text-purple-600"></div>
          </div>
          <div>
            <h3 class="text-sm font-black text-gray-900 mb-1 uppercase tracking-tight">Editor Flexível</h3>
            <p class="text-sm text-gray-500 font-medium leading-relaxed">Controle total sobre o conteúdo e termos legais.</p>
          </div>
        </div>

        <div class="flex items-start gap-5">
          <div class="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
            <div class="i-heroicons-link w-6 h-6 text-orange-600"></div>
          </div>
          <div>
            <h3 class="text-sm font-black text-gray-900 mb-1 uppercase tracking-tight">Link Público</h3>
            <p class="text-sm text-gray-500 font-medium leading-relaxed">Aprovação online rápida e integrada pelo cliente.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
