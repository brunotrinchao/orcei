<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Sparkles, ArrowRight, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-vue-next'

const sliderPos = ref(50) // Porcentagem do slider (0 a 100)
const isDragging = ref(false)
const containerRef = ref<HTMLElement | null>(null)

function updatePos(clientX: number) {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const x = clientX - rect.left
  let percentage = (x / rect.width) * 100
  if (percentage < 0) percentage = 0
  if (percentage > 100) percentage = 100
  sliderPos.value = percentage
}

function handleTouchMove(e: TouchEvent) {
  if (!isDragging.value) return
  updatePos(e.touches[0].clientX)
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value) return
  updatePos(e.clientX)
}

function startDrag() {
  isDragging.value = true
}

function stopDrag() {
  isDragging.value = false
}

onMounted(() => {
  window.addEventListener('mouseup', stopDrag)
  window.addEventListener('touchend', stopDrag, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('mouseup', stopDrag)
  window.removeEventListener('touchend', stopDrag)
})
</script>

<template>
  <div class="w-full max-w-5xl mx-auto py-16 px-4 select-none">
    <div class="text-center mb-12">
      <!-- Badge interativo -->
      <span class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest mb-4">
        <Sparkles class="w-3.5 h-3.5 animate-pulse" />
        Experiência Interativa
      </span>
      <h2 class="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
        A transformação mágica da IA
      </h2>
      <p class="text-slate-400 max-w-2xl mx-auto mt-3 font-medium">
        Arraste a barra central para ver como a nossa Inteligência Artificial transforma uma conversa informal e vaga do WhatsApp em uma proposta técnica executiva de alto nível.
      </p>
    </div>

    <!-- Container do Painel Interativo -->
    <div 
      ref="containerRef"
      class="relative min-h-[400px] h-[52vw] max-h-[600px] md:h-[480px] md:max-h-[540px] w-full rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden cursor-ew-resize shadow-2xl"
      @mousemove="handleMouseMove"
      @touchmove.passive="handleTouchMove"
      @mousedown="startDrag"
      @touchstart.passive="startDrag"
    >
      <!-- Lado Esquerdo: O "Antes" (Caos) -->
      <div class="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 to-slate-950 px-6 py-8 flex flex-col justify-between">
        <div class="max-w-[420px]">
          <div class="flex items-center gap-2.5 mb-6">
            <span class="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertCircle class="w-5 h-5" />
            </span>
            <div>
              <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">O Caos Tradicional</p>
              <h3 class="text-sm font-black text-slate-200">Mensagem vaga do cliente no WhatsApp</h3>
            </div>
          </div>

          <!-- WhatsApp Chat Mockup -->
          <div class="space-y-4">
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm text-slate-300 relative rounded-tl-none shadow-lg">
              <p class="leading-relaxed font-medium">
                "Oi Bruno! Tudo bom? Consegue criar um site institucional pra mim? Preciso da Home, Sobre e Contato. A gente comentou de uns R$ 3.000, né? Consegue fechar em 15 dias? Faz o orçamento aí, manda em PDF ou me explica por aqui mesmo..."
              </p>
              <span class="text-[10px] text-slate-500 block text-right mt-2 font-bold">14:32</span>
            </div>
            
            <div class="bg-amber-950/20 border border-amber-500/10 rounded-2xl p-4 text-xs text-amber-300/90 leading-relaxed">
              <p class="font-bold flex items-center gap-1.5 mb-2 text-amber-400">
                ⚠️ O que o profissional perde aqui:
              </p>
              <ul class="list-inside list-disc space-y-1.5 font-medium">
                <li>Sem detalhamento claro ou escopo definido</li>
                <li>Sem opções de Upsell ou itens adicionais</li>
                <li>Sem facilidade de aceite ou pagamento</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
          <img :src="'/images/icons/whatsapp-svg.svg'" class="w-4 h-4" alt="WhatsApp" loading="lazy"/> Conversa informal de WhatsApp (Sem força de fechamento)
        </div>
      </div>

      <!-- Lado Direito: O "Depois" (Orçamento Convertido e Profissional) -->
      <!-- O clip-path faz o efeito de revelação baseado na posição do slider -->
      <div 
        class="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-950/35 via-slate-950 to-slate-950 border-l border-blue-500/20 px-6 py-8 flex flex-col justify-between transition-all"
        :style="{ clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` }"
      >
        <!-- Forçamos o alinhamento à direita para aparecer depois do slider -->
        <div class="ml-auto w-full max-w-[85%] sm:max-w-[48%] md:max-w-[45%] flex flex-col h-full justify-between">
          <div>
            <div class="flex items-center gap-2.5 mb-6">
              <span class="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Sparkles class="w-5 h-5 animate-pulse" />
              </span>
              <div>
                <p class="text-[10px] text-blue-400 font-bold uppercase tracking-wider">A Mágica da IA do Orcei Fácil</p>
                <h3 class="text-sm font-black text-white">Orçamento gerado e formatado em segundos</h3>
              </div>
            </div>

            <!-- Tabela Premium do Orçamento -->
            <div class="bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-2xl p-4 space-y-4 shadow-2xl">
              <div class="flex justify-between items-center pb-3 border-b border-white/5">
                <div>
                  <h5 class="text-xs font-bold text-white">Criação de Site Institucional</h5>
                  <p class="text-[9px] text-slate-400 mt-0.5">Home, Sobre, Serviços, Contato + Design Responsivo</p>
                </div>
                <span class="text-xs font-black text-emerald-400">R$ 3.000,00</span>
              </div>

              <!-- Opcional de Upsell sugerido pela IA -->
              <div class="flex justify-between items-center p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-[8px] bg-blue-500/20 text-blue-400 font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">IA Recomenda</span>
                    <h6 class="text-[10px] font-bold text-slate-200">Suporte Premium Anual</h6>
                  </div>
                  <p class="text-[9px] text-slate-400 mt-0.5">12 meses de atualizações e segurança</p>
                </div>
                <span class="text-xs font-black text-blue-300">+ R$ 600,00</span>
              </div>

              <!-- Termos e Condições simplificados -->
              <div class="text-[9px] text-slate-400 border-t border-white/5 pt-3 leading-relaxed">
                <span class="font-bold text-slate-300 block mb-0.5">Prazo de entrega:</span>
                Entregue em 15 dias corridos após o aceite e pagamento do sinal de 50%.
              </div>
            </div>
          </div>

          <!-- Ação Direta para o Cliente -->
          <div class="pt-4">
            <button class="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-lg shadow-emerald-950/20 hover:opacity-90 transition duration-300">
              <CheckCircle2 class="w-4 h-4" />
              Aprovar Orçamento Online
            </button>
            <span class="text-[9px] text-slate-500 block text-center mt-2 font-semibold">O cliente aprova sem precisar criar conta</span>
          </div>
        </div>
      </div>

      <!-- Barra de Controle do Slider -->
      <div 
        class="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-emerald-500 to-indigo-500 pointer-events-none shadow-[0_0_10px_rgba(59,130,246,0.6)]"
        :style="{ left: `${sliderPos}%` }"
      >
        <!-- Botão de Arrastar com Setas Indicativas -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900 border-2 border-blue-500/80 hover:border-blue-400 flex items-center justify-center text-white shadow-2xl pointer-events-auto cursor-ew-resize transition-colors">
          <div class="flex gap-0.5 text-blue-400 font-black text-xs select-none">
            <span>&lt;</span>
            <span>&gt;</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
