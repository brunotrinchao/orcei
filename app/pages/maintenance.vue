<script setup lang="ts">
import { ShieldAlert, Mail } from 'lucide-vue-next'
definePageMeta({
  layout: 'blank'
})
const { data: systemInfo } = useFetch<any>('/api/system/status')
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center">
    <div class="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
      <div class="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl shadow-red-100/50">
        <ShieldAlert class="w-12 h-12 text-red-600" />
      </div>
      
      <div class="space-y-3">
        <h1 class="text-3xl font-black text-gray-900 tracking-tight uppercase">Em Manutenção</h1>
        <p class="text-sm text-gray-500 font-bold leading-relaxed">
          Estamos realizando melhorias programadas em nossa infraestrutura. Voltaremos em breve com novidades!
        </p>
      </div>

      <div class="p-8 bg-white rounded-[3rem] border border-gray-100 shadow-sm space-y-4">
        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Precisa de Ajuda?</p>
        <a href="mailto:contato@orcei.com.br" class="inline-flex items-center gap-2 text-sm font-black text-blue-600 hover:text-blue-700 transition-colors">
          <Mail class="w-4 h-4" />
          contato@orcei.com.br
        </a>
      </div>

      <p class="text-[8px] font-black text-gray-300 uppercase tracking-[0.3em]">Equipe {{ systemInfo?.landingPage?.appName || 'Orcei' }}</p>
    </div>
  </div>
</template>
