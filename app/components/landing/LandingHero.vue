<script setup lang="ts">
import { Sparkles, ArrowRight, Briefcase, Eye } from 'lucide-vue-next'

defineProps<{
  title: string
  subtitle: string
  appName?: string
}>()
</script>

<template>
  <section class="relative pt-24 pb-20 md:pt-32 md:pb-28 px-4 overflow-hidden bg-slate-950">
    <!-- Ambient glowing backgrounds -->
    <div class="absolute inset-0 -z-10 pointer-events-none">
      <!-- Glow superior azul safira/índigo -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-blue-900/25 via-indigo-900/5 to-transparent rounded-full blur-3xl opacity-80"></div>
      <!-- Glow lateral esmeralda sutil -->
      <div class="absolute top-[40%] right-[-10%] w-[400px] h-[400px] bg-emerald-900/10 rounded-full blur-3xl opacity-50"></div>
    </div>

    <div class="max-w-7xl mx-auto text-center relative z-10">
      <!-- Badge de IA Premium -->
      <div class="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 uppercase tracking-widest animate-pulse">
        <Sparkles class="w-3.5 h-3.5" />
        IA integrada para freelancers &amp; autônomos
      </div>

      <!-- Headline de Alto Impacto -->
      <h1 class="text-4xl md:text-7xl font-black text-white mb-6 tracking-tight leading-tight max-w-4xl mx-auto" v-html="title.replace('\n', '<br>')">
      </h1>

      <!-- Subtitle Persuasiva -->
      <p class="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
        {{ subtitle }}
      </p>

      <!-- CTAs de Alta Conversão -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
        <NuxtLink
          to="/auth/login"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white px-10 py-4.5 rounded-2xl font-bold text-lg transition-all duration-300 shadow-[0_0_30px_-5px_rgba(37,99,235,0.4)] hover:shadow-[0_0_35px_rgba(79,70,229,0.5)] hover:-translate-y-0.5 group"
        >
          Criar meu primeiro orçamento grátis
          <ArrowRight class="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
        </NuxtLink>
        <a
          href="#features"
          class="w-full sm:w-auto inline-flex items-center justify-center bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-10 py-4.5 rounded-2xl font-bold text-lg transition-all duration-300 hover:bg-slate-800/80"
        >
          Ver Funcionalidades ↓
        </a>
      </div>

      <!-- Microcopy de Confiança & Social Proof -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
        <div class="flex -space-x-3">
          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-slate-950 shadow-lg"></div>
          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-fuchsia-400 to-fuchsia-600 border-2 border-slate-950 shadow-lg"></div>
          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-slate-950 shadow-lg"></div>
          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-slate-950 shadow-lg"></div>
        </div>
        <div class="text-sm text-slate-400 font-medium">
          <span class="font-bold text-white text-base">+500 freelancers</span> já aceleram seus negócios com o <span class="text-blue-400 font-bold">{{ appName || 'Orcei Fácil' }}</span>
        </div>
      </div>

      <!-- Hero Mockup 3D com Orbitais/Satélites e Hotspots -->
      <!-- Controlamos a largura máxima do container responsivamente para dar espaço livre para a flutuação lateral -->
      <div class="relative mx-auto max-w-lg md:max-w-2xl xl:max-w-3xl 2xl:max-w-5xl perspective-[1600px] px-4 pt-4 mb-12">
        <!-- Aura brilhante por trás do Mockup -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <!-- Container do Mockup com Rotação 3D -->
        <div class="product-mockup relative mx-auto rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-[0_0_50px_-12px_rgba(37,99,235,0.25)] transition-all duration-700 ease-out hover:rotate-x-[3deg] hover:rotate-y-[0deg] hover:scale-[1.01]">
          <img
            src="/images/landpage-banner.png"
            :alt="`${appName || 'Orcei Fácil'} — painel de orçamentos inteligência artificial`"
            width="1200"
            height="675"
            decoding="async"
            fetchpriority="high"
            loading="lazy"
            class="w-full h-auto rounded-2xl block border border-slate-800"
          />

          <!-- Hotspot 1: IA de Redação (Pulsante) -->
          <div class="group absolute top-[45%] left-[25%] z-20">
            <span class="absolute inline-flex h-4 w-4 rounded-full bg-blue-400 opacity-75 animate-ping"></span>
            <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-500 cursor-pointer shadow-lg"></span>
            <!-- Tooltip -->
            <div class="absolute bottom-6 left-1/2 -translate-x-1/2 w-64 p-3 bg-slate-950/95 border border-blue-500/30 backdrop-blur-md rounded-xl text-xs text-slate-300 shadow-2xl opacity-0 translate-y-2 pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 text-left">
              <div class="flex items-center gap-1.5 font-bold text-blue-400 mb-1">
                <Sparkles class="w-3.5 h-3.5" />
                Assistente Inteligente
              </div>
              <p class="leading-relaxed">Explique o serviço de forma simples e a nossa IA redige a descrição técnica completa com formatação executiva.</p>
            </div>
          </div>

          <!-- Hotspot 2: Acompanhamento de Proposta (Pulsante) -->
          <div class="group absolute top-[68%] left-[72%] z-20">
            <span class="absolute inline-flex h-4 w-4 rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
            <span class="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 cursor-pointer shadow-lg"></span>
            <!-- Tooltip -->
            <div class="absolute bottom-6 left-1/2 -translate-x-1/2 w-64 p-3 bg-slate-950/95 border border-emerald-500/30 backdrop-blur-md rounded-xl text-xs text-slate-300 shadow-2xl opacity-0 translate-y-2 pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 text-left">
              <div class="flex items-center gap-1.5 font-bold text-emerald-400 mb-1">
                <Eye class="w-3.5 h-3.5" />
                Notificação de Leitura
              </div>
              <p class="leading-relaxed">Saiba exatamente quando seu cliente abriu o orçamento para fazer o contato e fechar a venda na hora ideal.</p>
            </div>
          </div>
        </div>

        <!-- 🪐 ITENS FLUTUANTES (Orbitando lateralmente de forma limpa em telas desktop xl e gigantes 2xl, garantindo visibilidade livre de sobreposições) -->
        
        <!-- Satélite Esquerda: Catálogo (Esmeralda) - Posicionado perfeitamente na lateral esquerda -->
        <div class="absolute left-[-16%] xl:left-[-18%] 2xl:left-[-18%] top-[40%] hidden xl:flex items-center gap-3 p-4 bg-slate-900/90 border border-emerald-500/25 backdrop-blur-md rounded-2xl shadow-[0_20px_40px_-15px_rgba(16,185,129,0.2)] animate-float-slow z-20 w-60">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Briefcase class="w-5 h-5" />
          </div>
          <div class="text-left overflow-hidden">
            <p class="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Catálogo de Serviços</p>
            <p class="text-xs font-black text-white truncate">Desenvolvimento Nuxt 3</p>
            <p class="text-xs text-emerald-400 font-extrabold mt-0.5">R$ 4.500,00</p>
          </div>
        </div>

        <!-- Satélite Direita: Notificação (Olho/Blue) - Posicionado perfeitamente na lateral direita -->
        <div class="absolute right-[-16%] xl:right-[-18%] 2xl:right-[-18%] top-[35%] hidden xl:flex items-center gap-3.5 p-4 bg-slate-900/90 border border-blue-500/25 backdrop-blur-md rounded-2xl shadow-[0_20px_40px_-15px_rgba(37,99,235,0.15)] animate-float-medium z-20 w-60">
          <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0">
            <Eye class="w-5 h-5 animate-pulse" />
          </div>
          <div class="text-left">
            <p class="text-[9px] text-blue-400 font-black uppercase tracking-wider animate-pulse">Acompanhamento</p>
            <p class="text-xs font-black text-white">Cliente visualizou o link</p>
            <p class="text-[10px] text-slate-400 mt-0.5">Visualizado agora mesmo</p>
          </div>
        </div>
      </div>

      <!-- 📱 WIDGETS RESPONSIVOS (Exibidos apenas em telas menores de tablets e celulares md/sm, onde não há espaço lateral) -->
      <div class="relative z-20 max-w-2xl mx-auto px-4 mt-12 xl:hidden">
        <div class="flex flex-col md:flex-row justify-center items-stretch gap-6">
          <!-- Widget 1: Catálogo (Esmeralda) -->
          <div class="flex items-center gap-3.5 p-4.5 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl w-full md:w-64 backdrop-blur-md hover:border-emerald-500/20 transition-all duration-300">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Briefcase class="w-5 h-5" />
            </div>
            <div class="text-left overflow-hidden">
              <p class="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Catálogo Ativo</p>
              <p class="text-xs font-black text-white truncate">Desenvolvimento Nuxt 3</p>
              <p class="text-xs text-emerald-400 font-extrabold mt-0.5">R$ 4.500,00</p>
            </div>
          </div>

          <!-- Widget 2: Acompanhamento (Olho/Blue) -->
          <div class="flex items-center gap-3.5 p-4.5 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl w-full md:w-64 backdrop-blur-md hover:border-blue-500/20 transition-all duration-300">
            <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Eye class="w-5 h-5 animate-pulse" />
            </div>
            <div class="text-left overflow-hidden">
              <p class="text-[9px] text-blue-400 font-black uppercase tracking-wider animate-pulse">Acompanhamento</p>
              <p class="text-xs font-black text-white truncate">Cliente visualizou o link</p>
              <p class="text-[10px] text-slate-500 mt-0.5">Notificação em tempo real</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.product-mockup {
  transform: perspective(1600px) rotateX(6deg) rotateY(-1deg) scale(0.96);
  transform-origin: center top;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  animation: float-mockup 8s ease-in-out infinite;
}

.product-mockup:hover {
  transform: perspective(1600px) rotateX(2deg) rotateY(0deg) scale(0.99);
}

@keyframes float-mockup {
  0%, 100% { transform: perspective(1600px) rotateX(6deg) rotateY(-1deg) scale(0.96) translateY(0px); }
  50%       { transform: perspective(1600px) rotateX(5deg) rotateY(-1deg) scale(0.96) translateY(-10px); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(1deg); }
}

.animate-float-slow {
  animation: float 7s ease-in-out infinite;
}

.animate-float-medium {
  animation: float 5.5s ease-in-out infinite 1.5s;
}

@media (max-width: 1024px) {
  .product-mockup {
    transform: none;
    animation: none;
  }
  .product-mockup:hover {
    transform: none;
  }
}
</style>
