<script setup lang="ts">
import { Sparkles, ArrowRight } from 'lucide-vue-next'

defineProps<{
  appName?: string
}>()

const { getAppUrl, isExternalUrl } = useAppUrl()
</script>

<template>
  <div class="bg-[#07111f] p-10 md:p-20 text-center relative overflow-hidden shadow-2xl relative before:absolute before:inset-0 before:bg-[linear-gradient(#ffffff0a_1px,_#0000_1px),_linear-gradient(90deg,_#ffffff0a_1px,_#0000_1px)] before:bg-[size:48px_48px] before:[mask-image:linear-gradient(#000,_#0000_90%)] before:[-webkit-mask-image:linear-gradient(#000,_#0000_90%)]">
    <!-- Ambient glows -->
    <div class="absolute -top-24 -right-24 w-80 h-80 bg-[#0870f8]/15 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-24 -left-24 w-72 h-72 bg-[#0055c8]/20 rounded-full blur-3xl pointer-events-none"></div>

    <div class="relative z-10">
      <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[10px] font-black rounded-full bg-[#0870f8]/20 text-[#e9f3ff] border border-[#0870f8]/30 uppercase tracking-widest mb-6">
        <Sparkles class="w-3.5 h-3.5 animate-pulse" />
        Comece hoje mesmo
      </span>
      <h2 class="text-3xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight max-w-4xl mx-auto">
        Seu próximo orçamento pronto em 2 minutos.
      </h2>
      <p class="text-slate-300 max-w-lg mx-auto mb-10 leading-relaxed font-medium text-sm md:text-base">
        Junte-se a centenas de profissionais autônomos que já pararam de perder clientes pela demora. Grátis para começar.
      </p>

      <!-- Botão CTA Principal -->
      <div class="inline-flex flex-col items-center gap-3">
        <NuxtLink
          :href="getAppUrl('/auth/login')"
          :external="isExternalUrl()"
          target="_self"
          class="inline-flex items-center gap-2.5 bg-[#0870f8] hover:bg-[#0055c8] text-white px-10 py-4.5 rounded-2xl font-black text-lg transition duration-300 shadow-[0_8px_30px_rgba(8,112,248,0.4)] hover:-translate-y-0.5 group"
        >
          Criar meu orçamento grátis agora
          <ArrowRight class="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
        </NuxtLink>
        
        <!-- Microcopy de Conversão sem risco -->
        <span class="text-xs text-slate-400 font-semibold tracking-wide">
          Sem compromisso. Não pedimos cartão de crédito.
        </span>
      </div>
    </div>
  </div>
</template>
