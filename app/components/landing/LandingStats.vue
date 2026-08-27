<script setup lang="ts">
// Nenhuma dependência especial necessária
</script>

<template>
  <div class="border-y border-[#dfe6f0] bg-[#f4f7fb] py-5 relative overflow-hidden">
    <div class="max-w-7xl mx-auto px-6 relative z-10">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 md:divide-x md:divide-[#dfe6f0] text-center">
        <!-- Estatística 1 -->
        <div class="px-4 md:px-8 group transition-all duration-300 hover:scale-[1.02]">
          <p class="text-4xl md:text-5xl font-black text-[#0870f8]">2.400+</p>
          <p class="text-[11px] md:text-xs text-[#61708a] font-extrabold uppercase tracking-widest mt-2">Orçamentos Criados</p>
        </div>

        <!-- Estatística 2 -->
        <div class="px-4 md:px-8 group transition-all duration-300 hover:scale-[1.02]">
          <p class="text-4xl md:text-5xl font-black text-[#0c1424]">&lt; 2 min</p>
          <p class="text-[11px] md:text-xs text-[#61708a] font-extrabold uppercase tracking-widest mt-2">Tempo Médio</p>
        </div>

        <!-- Estatística 3 -->
        <div class="px-4 md:px-8 group transition-all duration-300 hover:scale-[1.02]">
          <p class="text-4xl md:text-5xl font-black text-[#0870f8]">98%</p>
          <p class="text-[11px] md:text-xs text-[#61708a] font-extrabold uppercase tracking-widest mt-2">Satisfação Geral</p>
        </div>
      </div>
    </div>
  </div>
</template>
