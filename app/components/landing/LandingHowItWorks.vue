<script setup lang="ts">
import { FileEdit, Send, BadgeCheck } from 'lucide-vue-next'
</script>

<template>
  <section id="como-funciona" class="mb-24 py-16 scroll-mt-20 relative bg-slate-950">
    <!-- Ambient aura glow sutil -->
    <div class="absolute inset-0 pointer-events-none -z-10">
      <div class="absolute top-[30%] left-[20%] w-[500px] h-[150px] bg-gradient-to-r from-blue-500/5 via-emerald-500/5 to-transparent blur-3xl"></div>
    </div>

    <div class="max-w-7xl mx-auto px-4 text-center">
      <div class="mb-16">
        <p class="text-xs font-black text-emerald-400 uppercase tracking-widest mb-3">Fluxo Simplificado</p>
        <h2 class="text-3xl md:text-5xl font-black text-white tracking-tight">Três passos. Nada mais.</h2>
        <p class="text-slate-400 max-w-xl mx-auto mt-4 font-medium text-sm md:text-base">
          Desenhado para ser intuitivo tanto para você quanto para o seu cliente final. Veja como é simples:
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Passo 1 -->
        <div class="relative group p-8 bg-slate-900/40 border border-slate-800/80 hover:border-blue-500/30 rounded-3xl transition-all duration-300 text-center flex flex-col justify-between items-center shadow-xl">
          <!-- Conexão visual tracejada (escondida no mobile) -->
          <div class="hidden md:block absolute top-[22%] right-[-15%] w-[30%] h-px border-t-2 border-dashed border-slate-800 z-0 pointer-events-none"></div>

          <div class="relative z-10 flex flex-col items-center">
            <!-- Círculo indicador com número -->
            <div class="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center mb-6 text-2xl font-black shadow-[0_8px_20px_-5px_rgba(37,99,235,0.45)] group-hover:scale-105 transition-transform duration-300">
              1
            </div>
            
            <div class="text-blue-400 mb-3 flex items-center justify-center p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/10">
              <FileEdit class="w-5 h-5" />
            </div>
            <h3 class="font-black text-xl mb-3 text-white transition-colors group-hover:text-blue-300">Crie o orçamento</h3>
            <p class="text-slate-400 text-sm leading-relaxed font-medium">Adicione itens do catálogo ou deixe a IA descrever seus serviços e propor preços automaticamente.</p>
          </div>
        </div>

        <!-- Passo 2 -->
        <div class="relative group p-8 bg-slate-900/40 border border-slate-800/80 hover:border-emerald-500/30 rounded-3xl transition-all duration-300 text-center flex flex-col justify-between items-center shadow-xl">
          <!-- Conexão visual tracejada (escondida no mobile) -->
          <div class="hidden md:block absolute top-[22%] right-[-15%] w-[30%] h-px border-t-2 border-dashed border-slate-800 z-0 pointer-events-none"></div>

          <div class="relative z-10 flex flex-col items-center">
            <!-- Círculo indicador com número -->
            <div class="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-500 text-white rounded-2xl flex items-center justify-center mb-6 text-2xl font-black shadow-[0_8px_20px_-5px_rgba(16,185,129,0.55)] group-hover:scale-105 transition-transform duration-300">
              2
            </div>
            
            <div class="text-emerald-400 mb-3 flex items-center justify-center p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <Send class="w-5 h-5" />
            </div>
            <h3 class="font-black text-xl mb-3 text-white transition-colors group-hover:text-emerald-300">Envie para o cliente</h3>
            <p class="text-slate-400 text-sm leading-relaxed font-medium">Compartilhe o link de visualização personalizado via WhatsApp, e-mail ou onde preferir.</p>
          </div>
        </div>

        <!-- Passo 3 -->
        <div class="relative group p-8 bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/30 rounded-3xl transition-all duration-300 text-center flex flex-col justify-between items-center shadow-xl">
          <div class="relative z-10 flex flex-col items-center">
            <!-- Círculo indicador com número -->
            <div class="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-2xl flex items-center justify-center mb-6 text-2xl font-black shadow-[0_8px_20px_-5px_rgba(79,70,229,0.45)] group-hover:scale-105 transition-transform duration-300">
              3
            </div>
            
            <div class="text-indigo-400 mb-3 flex items-center justify-center p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
              <BadgeCheck class="w-5 h-5" />
            </div>
            <h3 class="font-black text-xl mb-3 text-white transition-colors group-hover:text-indigo-300">Receba a aprovação</h3>
            <p class="text-slate-400 text-sm leading-relaxed font-medium">O cliente aprova digitalmente e você é notificado de imediato pelo WhatsApp. Negócio fechado.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
