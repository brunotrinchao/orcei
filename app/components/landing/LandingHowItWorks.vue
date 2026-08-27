<script setup lang="ts">
import { FileEdit, Send, BadgeCheck } from 'lucide-vue-next'
</script>

<template>
  <section id="como-funciona" class="mb-24 py-16 scroll-mt-20 relative bg-white">
    <div class="max-w-7xl mx-auto px-4 text-center">
      <div class="mb-16">
        <p class="text-xs font-black text-[#0870f8] uppercase tracking-widest mb-3">Fluxo Simplificado</p>
        <h2 class="text-3xl md:text-5xl font-black text-[#0c1424] tracking-tight">Três passos. <span class="text-[#0870f8]">Nada mais.</span></h2>
        <p class="text-[#61708a] max-w-xl mx-auto mt-4 font-medium text-sm md:text-base">
          Desenhado para ser intuitivo tanto para você quanto para o seu cliente final. Veja como é simples:
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Passo 1 -->
        <div class="relative group p-8 bg-[#f4f7fb] border border-[#dfe6f0] hover:border-[#0870f8]/40 rounded-3xl transition-all duration-300 text-center flex flex-col justify-between items-center shadow-sm hover:shadow-md">
          <div class="hidden md:block absolute top-[22%] right-[-15%] w-[30%] h-px border-t-2 border-dashed border-[#dfe6f0] z-0 pointer-events-none"></div>

          <div class="relative z-10 flex flex-col items-center">
            <div class="w-16 h-16 bg-[#0870f8] text-white rounded-2xl flex items-center justify-center mb-6 text-2xl font-black shadow-lg shadow-[#0870f8]/20 group-hover:scale-105 transition-transform duration-300">
              1
            </div>
            
            <div class="text-[#0870f8] mb-3 flex items-center justify-center p-2.5 rounded-xl bg-[#e9f3ff] border border-[#0870f8]/20">
              <FileEdit class="w-5 h-5" />
            </div>
            <h3 class="font-black text-xl mb-3 text-[#0c1424]">Crie o orçamento</h3>
            <p class="text-[#61708a] text-sm leading-relaxed font-medium">Adicione itens do catálogo ou deixe a IA descrever seus serviços e propor preços automaticamente.</p>
          </div>
        </div>

        <!-- Passo 2 -->
        <div class="relative group p-8 bg-[#f4f7fb] border border-[#dfe6f0] hover:border-[#0870f8]/40 rounded-3xl transition-all duration-300 text-center flex flex-col justify-between items-center shadow-sm hover:shadow-md">
          <div class="hidden md:block absolute top-[22%] right-[-15%] w-[30%] h-px border-t-2 border-dashed border-[#dfe6f0] z-0 pointer-events-none"></div>

          <div class="relative z-10 flex flex-col items-center">
            <div class="w-16 h-16 bg-[#0870f8] text-white rounded-2xl flex items-center justify-center mb-6 text-2xl font-black shadow-lg shadow-[#0870f8]/20 group-hover:scale-105 transition-transform duration-300">
              2
            </div>
            
            <div class="text-[#0870f8] mb-3 flex items-center justify-center p-2.5 rounded-xl bg-[#e9f3ff] border border-[#0870f8]/20">
              <Send class="w-5 h-5" />
            </div>
            <h3 class="font-black text-xl mb-3 text-[#0c1424]">Envie para o cliente</h3>
            <p class="text-[#61708a] text-sm leading-relaxed font-medium">Compartilhe o link de visualização personalizado via WhatsApp, e-mail ou onde preferir.</p>
          </div>
        </div>

        <!-- Passo 3 -->
        <div class="relative group p-8 bg-[#f4f7fb] border border-[#dfe6f0] hover:border-[#0870f8]/40 rounded-3xl transition-all duration-300 text-center flex flex-col justify-between items-center shadow-sm hover:shadow-md">
          <div class="relative z-10 flex flex-col items-center">
            <div class="w-16 h-16 bg-[#0870f8] text-white rounded-2xl flex items-center justify-center mb-6 text-2xl font-black shadow-lg shadow-[#0870f8]/20 group-hover:scale-105 transition-transform duration-300">
              3
            </div>
            
            <div class="text-[#0870f8] mb-3 flex items-center justify-center p-2.5 rounded-xl bg-[#e9f3ff] border border-[#0870f8]/20">
              <BadgeCheck class="w-5 h-5" />
            </div>
            <h3 class="font-black text-xl mb-3 text-[#0c1424]">Receba a aprovação</h3>
            <p class="text-[#61708a] text-sm leading-relaxed font-medium">O cliente aprova e assina digitalmente e você é notificado de imediato. Negócio fechado.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
