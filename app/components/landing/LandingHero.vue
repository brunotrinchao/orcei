<script setup lang="ts">
import { Sparkles, ArrowRight, Briefcase, Eye } from 'lucide-vue-next'

defineProps<{
  title: string
  subtitle: string
  appName?: string
  videoUrl?: string
}>()

const { getAppUrl, isExternalUrl } = useAppUrl()
</script>

<template>
  <section class="relative pt-18 pb-20 md:pt-24 md:pb-24 px-4 overflow-hidden bg-white">
    <div class="max-w-7xl mx-auto text-center relative z-10">
      <div class="relative">
        <!-- GLOW -->
        <div
          class="absolute top-0 left-1/2 -translate-x-1/2 w-[860px] h-full rounded-full bg-[#0870f8]/[0.14] blur-[100px] -z-10">
        </div>

        <!-- Badge de IA Premium -->
        <div
          class="inline-flex items-center gap-2 bg-white border border-[#0870f8]/20 text-[#0870f8] text-xs px-4 py-3 rounded-full mb-8 uppercase tracking-[.12em] font-[760]">
          <Sparkles class="w-3.5 h-3.5" />
          IA integrada para freelancers &amp; autônomos
        </div>

        <!-- Headline de Alto Impacto -->
        <h1 class="text-4xl md:text-8xl font-black text-[#0c1424] mb-6 tracking-tight leading-tight mx-auto"
          v-html="title.replace('\n', '<br>')">
        </h1>

        <!-- Subtitle Persuasiva -->
        <p class="text-lg md:text-2xl text-[#61708a] max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
          {{ subtitle }}
        </p>

        <!-- CTAs de Alta Conversão -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <NuxtLink :href="getAppUrl('/auth/login')" :external="isExternalUrl()" target="_self"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#0870f8] hover:bg-[#0055c8] text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-[0_10px_25px_-5px_rgba(8,112,248,0.35)] hover:shadow-[0_12px_30px_rgba(8,112,248,0.45)] hover:-translate-y-0.5 group">
            Criar meu primeiro orçamento grátis
            <ArrowRight class="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </NuxtLink>
          <a href="#features"
            class="w-full sm:w-auto inline-flex items-center justify-center bg-[#f4f7fb] border border-[#dfe6f0] hover:border-[#61708a] text-[#0c1424] hover:bg-[#dfe6f0]/40 px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300">
            Ver Funcionalidades ↓
          </a>
        </div>
        <!-- Microcopy de Confiança & Social Proof -->
        <p class="text-xs text-[#7a879b] font-medium">
          Elimine as fricções que fazem você perder propostas e passe uma imagem de autoridade indiscutível desde o primeiro contato.
        </p>
      </div>

      <!-- Mockup -->
      <div class="w-full max-w-5xl mx-auto text-center relative mt-16 px-4">
        <!-- Moldura de Navegador com Vídeo de Demonstração -->
        <div class="relative mx-auto rounded-2xl md:rounded-3xl border border-[#cfd9e8] bg-white shadow-[0_25px_70px_-15px_rgba(8,112,248,0.2)] overflow-hidden">
          <!-- Barra Superior do Navegador (Browser Header) -->
          <div class="h-11 md:h-12 bg-white border-b border-[#cfd9e8] px-4 md:px-6 flex items-center justify-between rounded-t-2xl md:rounded-t-3xl">
            <!-- Botões de Controle Mac (Vermelho, Amarelo, Verde) -->
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-[#ff5f56] inline-block shadow-sm"></span>
              <span class="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block shadow-sm"></span>
              <span class="w-3 h-3 rounded-full bg-[#27c93f] inline-block shadow-sm"></span>
            </div>

            <!-- Barra de URL Centralizada do Sistema -->
            <div class="flex items-center gap-2 bg-white border border--[#cfd9e8] rounded-xl px-4 py-1.5 text-[11px] md:text-xs font-mono font-medium text-slate-400 max-w-xs md:max-w-md w-full justify-center shadow-inner">
              <span class="w-2 h-2 rounded-full bg-[#0870f8] animate-pulse"></span>
              <span class="truncate">app.orceifacil.com.br</span>
            </div>

            <!-- Badge de Demonstração Real -->
            <div class="hidden sm:flex items-center gap-2 bg-[#07111f] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Demonstração Real</span>
            </div>
          </div>

          <!-- ÁREA DE VÍDEO -->
          <div class="relative bg-white overflow-hidden">
            <video
              v-if="videoUrl"
              :src="videoUrl"
              autoplay
              loop
              muted
              playsinline
              poster="/images/landpage-banner.jpg"
              class="w-full h-auto block rounded-b-2xl md:rounded-b-3xl object-cover"
            ></video>
            <picture v-else>
              <source media="(max-width: 1023px)" srcset="/images/landpage-banner-mobile.jpg">
              <img
                src="/images/landpage-banner.jpg"
                :alt="`${appName || 'Orcei Fácil'} — demonstração em vídeo do painel`"
                width="1200"
                height="675"
                decoding="async"
                fetchpriority="high"
                loading="lazy"
                class="w-full h-auto rounded-b-2xl md:rounded-b-3xl block"
              />
            </picture>
            <slot name="video" />
          </div>
        </div>
      </div>

      <!-- Hero Mockup 3D com Orbitais/Satélites e Hotspots -->
      <div
        class="relative mx-auto max-w-lg md:max-w-2xl xl:max-w-3xl 2xl:max-w-5xl perspective-[1600px] px-4 pt-4 mb-12 mt-20">
        <!-- Aura brilhante por trás do Mockup -->
        <div
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#0870f8]/10 rounded-full blur-3xl pointer-events-none -z-10">
        </div>

        <!-- Container do Mockup com Rotação 3D -->
        <div
          class="product-mockup relative mx-auto rounded-2xl border border-[#dfe6f0] bg-white shadow-[0_20px_60px_-15px_rgba(8,112,248,0.15)] transition-all duration-700 ease-out hover:rotate-x-[3deg] hover:rotate-y-[0deg] hover:scale-[1.01]">
          <picture>
            <source media="(max-width: 1023px)" srcset="/images/landpage-banner-mobile.jpg">
            <img src="/images/landpage-banner.jpg"
              :alt="`${appName || 'Orcei Fácil'} — painel de orçamentos inteligência artificial`" width="1200"
              height="675" decoding="async" fetchpriority="high" loading="lazy"
              class="w-full h-auto rounded-2xl block border border-[#dfe6f0]" />
          </picture>
          <!-- Hotspot 1: IA de Redação (Pulsante) -->
          <div class="group absolute top-[45%] left-[25%] z-20">
            <span class="absolute inline-flex h-4 w-4 rounded-full bg-[#0870f8] opacity-75 animate-ping"></span>
            <span class="relative inline-flex rounded-full h-4 w-4 bg-[#0870f8] cursor-pointer shadow-lg"></span>
            <!-- Tooltip -->
            <div
              class="absolute bottom-6 left-1/2 -translate-x-1/2 w-64 p-3 bg-[#07111f] border border-[#0870f8]/30 backdrop-blur-md rounded-xl text-xs text-slate-200 shadow-2xl opacity-0 translate-y-2 pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 text-left">
              <div class="flex items-center gap-1.5 font-bold text-[#0870f8] mb-1">
                <Sparkles class="w-3.5 h-3.5" />
                Assistente Inteligente
              </div>
              <p class="leading-relaxed">Explique o serviço de forma simples e a nossa IA redige a descrição técnica
                completa com formatação executiva.</p>
            </div>
          </div>

          <!-- Hotspot 2: Acompanhamento de Proposta (Pulsante) -->
          <div class="group absolute top-[68%] left-[72%] z-20">
            <span class="absolute inline-flex h-4 w-4 rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
            <span class="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 cursor-pointer shadow-lg"></span>
            <!-- Tooltip -->
            <div
              class="absolute bottom-6 left-1/2 -translate-x-1/2 w-64 p-3 bg-[#07111f] border border-emerald-500/30 backdrop-blur-md rounded-xl text-xs text-slate-200 shadow-2xl opacity-0 translate-y-2 pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 text-left">
              <div class="flex items-center gap-1.5 font-bold text-emerald-400 mb-1">
                <Eye class="w-3.5 h-3.5" />
                Notificação de Leitura
              </div>
              <p class="leading-relaxed">Saiba exatamente quando seu cliente abriu o orçamento para fazer o contato e
                fechar a venda na hora ideal.</p>
            </div>
          </div>
        </div>

        <!-- 🪐 ITENS FLUTUANTES (Orbitando lateralmente em telas desktop) -->

        <!-- Satélite Esquerda: Catálogo (Esmeralda) -->
        <div
          class="absolute left-[-16%] xl:left-[-18%] 2xl:left-[-18%] top-[40%] hidden xl:flex items-center gap-3 p-4 bg-white/95 border border-[#dfe6f0] backdrop-blur-md rounded-2xl shadow-xl animate-float-slow z-20 w-60">
          <div
            class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <Briefcase class="w-5 h-5" />
          </div>
          <div class="text-left overflow-hidden">
            <p class="text-[9px] text-[#61708a] font-bold uppercase tracking-wider">Catálogo de Serviços</p>
            <p class="text-xs font-black text-[#0c1424] truncate">Desenvolvimento Nuxt 3</p>
            <p class="text-xs text-emerald-600 font-extrabold mt-0.5">R$ 4.500,00</p>
          </div>
        </div>

        <!-- Satélite Direita: Notificação (Blue) -->
        <div
          class="absolute right-[-16%] xl:right-[-18%] 2xl:right-[-18%] top-[35%] hidden xl:flex items-center gap-3.5 p-4 bg-white/95 border border-[#dfe6f0] backdrop-blur-md rounded-2xl shadow-xl animate-float-medium z-20 w-60">
          <div class="w-10 h-10 rounded-xl bg-[#e9f3ff] flex items-center justify-center text-[#0870f8] flex-shrink-0">
            <Eye class="w-5 h-5 animate-pulse" />
          </div>
          <div class="text-left">
            <p class="text-[9px] text-[#0870f8] font-black uppercase tracking-wider animate-pulse">Acompanhamento</p>
            <p class="text-xs font-black text-[#0c1424]">Cliente visualizou o link</p>
            <p class="text-[10px] text-[#61708a] mt-0.5">Visualizado agora mesmo</p>
          </div>
        </div>
      </div>

      <!-- 📱 WIDGETS RESPONSIVOS (Telas menores) -->
      <div class="relative z-20 max-w-2xl mx-auto px-4 mt-12 xl:hidden">
        <div class="flex flex-col md:flex-row justify-center items-stretch gap-6">
          <div
            class="flex items-center gap-3.5 p-4.5 bg-white border border-[#dfe6f0] rounded-2xl shadow-lg w-full md:w-64 backdrop-blur-md">
            <div
              class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <Briefcase class="w-5 h-5" />
            </div>
            <div class="text-left overflow-hidden">
              <p class="text-[9px] text-[#61708a] font-bold uppercase tracking-wider">Catálogo Ativo</p>
              <p class="text-xs font-black text-[#0c1424] truncate">Desenvolvimento Nuxt 3</p>
              <p class="text-xs text-emerald-600 font-extrabold mt-0.5">R$ 4.500,00</p>
            </div>
          </div>

          <div
            class="flex items-center gap-3.5 p-4.5 bg-white border border-[#dfe6f0] rounded-2xl shadow-lg w-full md:w-64 backdrop-blur-md">
            <div
              class="w-10 h-10 rounded-xl bg-[#e9f3ff] flex items-center justify-center text-[#0870f8] flex-shrink-0">
              <Eye class="w-5 h-5 animate-pulse" />
            </div>
            <div class="text-left overflow-hidden">
              <p class="text-[9px] text-[#0870f8] font-black uppercase tracking-wider animate-pulse">Acompanhamento</p>
              <p class="text-xs font-black text-[#0c1424] truncate">Cliente visualizou o link</p>
              <p class="text-[10px] text-[#61708a] mt-0.5">Notificação em tempo real</p>
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

  0%,
  100% {
    transform: perspective(1600px) rotateX(6deg) rotateY(-1deg) scale(0.96) translateY(0px);
  }

  50% {
    transform: perspective(1600px) rotateX(5deg) rotateY(-1deg) scale(0.96) translateY(-10px);
  }
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }

  50% {
    transform: translateY(-8px) rotate(1deg);
  }
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
