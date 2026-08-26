<script setup lang="ts">
import { Sparkles, ArrowRight } from 'lucide-vue-next'

defineProps<{
  appName?: string
}>()

const { getAppUrl, isExternalUrl } = useAppUrl()
</script>

<template>
  <div class="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 border border-slate-800/80 rounded-3xl p-10 md:p-20 text-center mb-12 relative overflow-hidden shadow-2xl">
    <!-- Auras brilhantes de Neon nos cantos -->
    <div class="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

    <div class="relative z-10">
      <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[10px] font-black rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest mb-6">
        <Sparkles class="w-3.5 h-3.5 animate-pulse" />
        Comece hoje mesmo
      </span>
      <h2 class="text-3xl md:text-5xl font-black text-white tracking-tight mb-6 leading-tight max-w-2xl mx-auto">
        Seu próximo orçamento pronto em 2 minutos.
      </h2>
      <p class="text-slate-400 max-w-lg mx-auto mb-10 leading-relaxed font-medium text-sm md:text-base">
        Junte-se a centenas de profissionais autônomos que já pararam de perder clientes pela demora. Grátis para começar.
      </p>

      <!-- Botão CTA Principal -->
      <div class="inline-flex flex-col items-center gap-3">
        <NuxtLink
          :href="getAppUrl('/auth/login')"
          :external="isExternalUrl()"
          target="_self"
          class="inline-flex items-center gap-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white px-10 py-4.5 rounded-2xl font-black text-lg transition duration-300 shadow-[0_4px_25px_-5px_rgba(37,99,235,0.4)] hover:shadow-[0_4px_30px_rgba(79,70,229,0.5)] hover:-translate-y-0.5 group"
        >
          Criar meu orçamento grátis agora
          <ArrowRight class="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
        </NuxtLink>
        
        <!-- Microcopy de Conversão sem risco -->
        <span class="text-xs text-slate-500 font-semibold tracking-wide">
          Sem compromisso. Não pedimos cartão de crédito.
        </span>
      </div>
    </div>
  </div>
</template>
