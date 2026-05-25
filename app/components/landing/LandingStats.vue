<script setup lang="ts">
// Nenhuma dependência especial necessária
</script>

<template>
  <div class="border-y border-slate-800 bg-slate-950 py-10 relative overflow-hidden">
    <!-- Linha de luz horizontal sutil -->
    <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/25 to-transparent"></div>
    <div class="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-500/15 to-transparent"></div>

    <!-- Brilho radial central de ambientação -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[100px] bg-gradient-to-r from-blue-500/5 via-emerald-500/5 to-transparent blur-3xl pointer-events-none"></div>

    <div class="max-w-7xl mx-auto px-6 relative z-10">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 md:divide-x md:divide-slate-800/80 text-center">
        <!-- Estatística 1 -->
        <div class="px-4 md:px-8 group transition-all duration-300 hover:scale-[1.02]">
          <p class="text-4xl md:text-5xl font-black text-white bg-gradient-to-r from-white via-slate-100 to-blue-400 bg-clip-text text-transparent">2.400+</p>
          <p class="text-[11px] md:text-xs text-slate-500 font-extrabold uppercase tracking-widest mt-2 group-hover:text-blue-400/80 transition-colors">Orçamentos Criados</p>
        </div>

        <!-- Estatística 2 -->
        <div class="px-4 md:px-8 group transition-all duration-300 hover:scale-[1.02]">
          <p class="text-4xl md:text-5xl font-black text-white bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">&lt; 2 min</p>
          <p class="text-[11px] md:text-xs text-slate-500 font-extrabold uppercase tracking-widest mt-2 group-hover:text-emerald-400/80 transition-colors">Tempo Médio</p>
        </div>

        <!-- Estatística 3 -->
        <div class="px-4 md:px-8 group transition-all duration-300 hover:scale-[1.02]">
          <p class="text-4xl md:text-5xl font-black text-white bg-gradient-to-r from-white via-slate-100 to-indigo-400 bg-clip-text text-transparent">98%</p>
          <p class="text-[11px] md:text-xs text-slate-500 font-extrabold uppercase tracking-widest mt-2 group-hover:text-indigo-400/80 transition-colors">Satisfação Geral</p>
        </div>
      </div>
    </div>
  </div>
</template>
