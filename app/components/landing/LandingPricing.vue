<script setup lang="ts">
import { Check, Sparkles } from 'lucide-vue-next'
</script>

<template>
  <section id="pricing" class="mb-24 py-16 scroll-mt-20 relative bg-slate-950">
    <!-- Auras de ambientação -->
    <div class="absolute inset-0 pointer-events-none -z-10">
      <div class="absolute top-[20%] right-[-10%] w-[500px] h-[300px] bg-gradient-to-r from-purple-500/5 via-fuchsia-500/5 to-transparent blur-3xl"></div>
    </div>

    <div class="max-w-7xl mx-auto px-4">
      <div class="text-center mb-16">
        <p class="text-xs font-black text-purple-400 uppercase tracking-widest mb-3">Planos &amp; Preços</p>
        <h2 class="text-3xl md:text-5xl font-black text-white tracking-tight">O investimento que se paga no primeiro cliente</h2>
        <p class="text-slate-400 max-w-xl mx-auto mt-4 font-medium text-sm md:text-base">
          Escolha a opção perfeita para a sua demanda. Crie orçamentos ilimitados e compre créditos de IA de forma flexível ou recorrente.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        <!-- Plano 1: Avulso (Créditos) -->
        <div class="group relative p-8 bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/80 rounded-3xl transition-all duration-300 flex flex-col justify-between shadow-xl">
          <div>
            <div class="mb-6">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Sob Demanda</span>
              <h3 class="text-2xl font-black text-white mt-1">Avulso</h3>
              <p class="text-slate-400 text-xs mt-2">Perfeito para quem faz orçamentos esporádicos.</p>
            </div>

            <div class="mb-6">
              <p class="text-sm font-medium text-slate-500">A partir de</p>
              <div class="flex items-baseline gap-1 mt-1">
                <span class="text-4xl font-black text-white">R$ 15</span>
                <span class="text-xs text-slate-400 font-bold">/ 10 créditos de IA</span>
              </div>
              <p class="text-[10px] text-slate-500 mt-2 font-medium">Use quando quiser, os créditos nunca expiram.</p>
            </div>

            <ul class="space-y-4 mb-8">
              <li class="flex items-start gap-3">
                <Check class="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span class="text-xs text-slate-300 font-medium">1 crédito por orçamento inteligente</span>
              </li>
              <li class="flex items-start gap-3">
                <Check class="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span class="text-xs text-slate-300 font-medium">Envio ilimitado de orçamentos manuais</span>
              </li>
              <li class="flex items-start gap-3">
                <Check class="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span class="text-xs text-slate-300 font-medium">Geração de PDF profissional com sua marca</span>
              </li>
              <li class="flex items-start gap-3">
                <Check class="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span class="text-xs text-slate-300 font-medium">Contratos digitais e aceite online</span>
              </li>
            </ul>
          </div>

          <NuxtLink
            to="/auth/login"
            class="w-full text-center py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-2xl transition duration-300"
          >
            Começar Grátis
          </NuxtLink>
        </div>

        <!-- Plano 2: Mensal (Mais Popular) -->
        <div class="relative p-8 bg-slate-900/60 border-2 border-purple-500/80 rounded-3xl transition-all duration-300 flex flex-col justify-between shadow-2xl scale-100 md:scale-[1.03] z-10">
          <!-- Tag de Destaque -->
          <div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
            <Sparkles class="w-3 h-3 animate-pulse" />
            Mais Escolhido
          </div>

          <!-- Brilho de fundo -->
          <div class="absolute inset-0 bg-purple-500/5 rounded-3xl pointer-events-none -z-10 blur-xl"></div>

          <div>
            <div class="mb-6">
              <span class="text-xs font-bold text-purple-400 uppercase tracking-widest">Profissional Mensal</span>
              <h3 class="text-2xl font-black text-white mt-1">Mensal</h3>
              <p class="text-slate-300 text-xs mt-2">Para profissionais ativos em busca de alta performance.</p>
            </div>

            <div class="mb-6">
              <div class="flex items-baseline gap-1 mt-1">
                <span class="text-4xl font-black text-white">R$ 29,90</span>
                <span class="text-xs text-slate-400 font-bold">/ mês</span>
              </div>
              <p class="text-[10px] text-purple-400/80 mt-2 font-bold uppercase tracking-wider">Inclui 40 créditos de IA todo mês</p>
            </div>

            <ul class="space-y-4 mb-8">
              <li class="flex items-start gap-3">
                <Check class="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <span class="text-xs text-white font-semibold">40 créditos de IA inclusos/mês</span>
              </li>
              <li class="flex items-start gap-3">
                <Check class="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <span class="text-xs text-slate-300 font-medium">Contratos jurídicos e assinatura digital ilimitados</span>
              </li>
              <li class="flex items-start gap-3">
                <Check class="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <span class="text-xs text-slate-300 font-medium">Notificações e avisos de leitura em tempo real</span>
              </li>
              <li class="flex items-start gap-3">
                <Check class="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <span class="text-xs text-slate-300 font-medium">Personalização completa de cores e layout</span>
              </li>
              <li class="flex items-start gap-3">
                <Check class="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <span class="text-xs text-slate-300 font-medium">Suporte prioritário via WhatsApp</span>
              </li>
            </ul>
          </div>

          <NuxtLink
            to="/auth/login"
            class="w-full text-center py-4 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold text-sm rounded-2xl transition duration-300 shadow-[0_4px_20px_rgba(168,85,247,0.4)]"
          >
            Quero Fechar Mais Negócios
          </NuxtLink>
        </div>

        <!-- Plano 3: Anual (Melhor Desconto) -->
        <div class="group relative p-8 bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/80 rounded-3xl transition-all duration-300 flex flex-col justify-between shadow-xl">
          <!-- Tag de Desconto -->
          <div class="absolute -top-3.5 right-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">
            Economize 33%
          </div>

          <div>
            <div class="mb-6">
              <span class="text-xs font-bold text-emerald-400 uppercase tracking-widest">Faturamento Anual</span>
              <h3 class="text-2xl font-black text-white mt-1">Anual</h3>
              <p class="text-slate-400 text-xs mt-2">O melhor custo-benefício para sua blindagem de negócios.</p>
            </div>

            <div class="mb-6">
              <div class="flex items-baseline gap-1 mt-1">
                <span class="text-4xl font-black text-white">R$ 19,90</span>
                <span class="text-xs text-slate-400 font-bold">/ mês</span>
              </div>
              <p class="text-[10px] text-slate-500 mt-2 font-medium">Cobrado anualmente (R$ 238,80/ano)</p>
            </div>

            <ul class="space-y-4 mb-8">
              <li class="flex items-start gap-3">
                <Check class="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span class="text-xs text-slate-300 font-medium">Todos os recursos do plano Mensal</span>
              </li>
              <li class="flex items-start gap-3">
                <Check class="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span class="text-xs text-slate-300 font-medium">50 créditos de IA inclusos/mês (Bônus)</span>
              </li>
              <li class="flex items-start gap-3">
                <Check class="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span class="text-xs text-slate-300 font-medium">Acesso antecipado a novas ferramentas de IA</span>
              </li>
              <li class="flex items-start gap-3">
                <Check class="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span class="text-xs text-slate-300 font-medium">Selo de Membro Fundador no painel</span>
              </li>
            </ul>
          </div>

          <NuxtLink
            to="/auth/login"
            class="w-full text-center py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-2xl transition duration-300"
          >
            Garantir Desconto Anual
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>
