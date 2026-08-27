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
      <span class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-[#e9f3ff] text-[#0870f8] border border-[#0870f8]/20 uppercase tracking-widest mb-4">
        <Sparkles class="w-3.5 h-3.5 animate-pulse" />
        Experiência Interativa
      </span>
      <h2 class="text-3xl md:text-5xl font-black text-[#0c1424] leading-tight tracking-tight">
        A transformação mágica da IA
      </h2>
      <p class="text-[#61708a] max-w-2xl mx-auto mt-3 font-medium">
        Arraste a barra central para ver como a nossa Inteligência Artificial transforma uma conversa informal e vaga do WhatsApp em uma proposta técnica executiva de alto nível.
      </p>
    </div>

    <!-- Container do Painel Interativo -->
    <div 
      ref="containerRef"
      class="relative min-h-[400px] h-[52vw] max-h-[600px] md:h-[480px] md:max-h-[540px] w-full rounded-3xl border border-[#dfe6f0] bg-white overflow-hidden cursor-ew-resize shadow-xl"
      @mousemove="handleMouseMove"
      @touchmove.passive="handleTouchMove"
      @mousedown="startDrag"
      @touchstart.passive="startDrag"
    >
      <!-- Lado Esquerdo: O "Antes" (Caos) -->
      <div class="absolute inset-0 w-full h-full bg-[#f4f7fb] px-6 py-8 flex flex-col justify-between">
        <div class="max-w-[420px]">
          <div class="flex items-center gap-2.5 mb-6">
            <span class="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <AlertCircle class="w-5 h-5" />
            </span>
            <div>
              <p class="text-[10px] text-[#61708a] font-bold uppercase tracking-wider">O Caos Tradicional</p>
              <h3 class="text-sm font-black text-[#0c1424]">Mensagem vaga do cliente no WhatsApp</h3>
            </div>
          </div>

          <!-- WhatsApp Chat Mockup -->
          <div class="space-y-4">
            <div class="bg-white border border-[#dfe6f0] rounded-2xl p-4 text-sm text-[#0c1424] relative rounded-tl-none shadow-sm">
              <p class="leading-relaxed font-medium">
                "Oi Bruno! Tudo bom? Consegue criar um site institucional pra mim? Preciso da Home, Sobre e Contato. A gente comentou de uns R$ 3.000, né? Consegue fechar em 15 dias? Faz o orçamento aí, manda em PDF ou me explica por aqui mesmo..."
              </p>
              <span class="text-[10px] text-[#61708a] block text-right mt-2 font-bold">14:32</span>
            </div>
            
            <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed">
              <p class="font-bold flex items-center gap-1.5 mb-2 text-amber-700">
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

        <div class="text-[11px] text-[#61708a] font-semibold flex items-center gap-1.5">
          <img :src="'/images/icons/whatsapp-svg.svg'" class="w-4 h-4" alt="WhatsApp" loading="lazy"/> Conversa informal de WhatsApp (Sem força de fechamento)
        </div>
      </div>

      <!-- Lado Direito: O "Depois" (Orçamento Convertido e Profissional) -->
      <div 
        class="absolute inset-0 w-full h-full bg-gradient-to-br from-[#e9f3ff] via-white to-[#f4f7fb] border-l border-[#0870f8]/30 px-6 py-8 flex flex-col justify-between transition-all"
        :style="{ clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` }"
      >
        <div class="ml-auto w-full max-w-[85%] sm:max-w-[48%] md:max-w-[45%] flex flex-col h-full justify-between">
          <div>
            <div class="flex items-center gap-2.5 mb-6">
              <span class="p-2 rounded-xl bg-[#e9f3ff] text-[#0870f8] border border-[#0870f8]/20">
                <Sparkles class="w-5 h-5 animate-pulse" />
              </span>
              <div>
                <p class="text-[10px] text-[#0870f8] font-bold uppercase tracking-wider">A Mágica da IA do Orcei Fácil</p>
                <h3 class="text-sm font-black text-[#0c1424]">Orçamento gerado e formatado em segundos</h3>
              </div>
            </div>

            <!-- Tabela Premium do Orçamento -->
            <div class="bg-white border border-[#dfe6f0] backdrop-blur-md rounded-2xl p-4 space-y-4 shadow-xl">
              <div class="flex justify-between items-center pb-3 border-b border-[#dfe6f0]">
                <div>
                  <h5 class="text-xs font-bold text-[#0c1424]">Criação de Site Institucional</h5>
                  <p class="text-[9px] text-[#61708a] mt-0.5">Home, Sobre, Serviços, Contato + Design Responsivo</p>
                </div>
                <span class="text-xs font-black text-emerald-600">R$ 3.000,00</span>
              </div>

              <!-- Opcional de Upsell sugerido pela IA -->
              <div class="flex justify-between items-center p-2.5 rounded-xl bg-[#e9f3ff] border border-[#0870f8]/20">
                <div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-[8px] bg-[#0870f8] text-white font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">IA Recomenda</span>
                    <h6 class="text-[10px] font-bold text-[#0c1424]">Suporte Premium Anual</h6>
                  </div>
                  <p class="text-[9px] text-[#61708a] mt-0.5">12 meses de atualizações e segurança</p>
                </div>
                <span class="text-xs font-black text-[#0870f8]">+ R$ 600,00</span>
              </div>

              <!-- Termos e Condições simplificados -->
              <div class="text-[9px] text-[#61708a] border-t border-[#dfe6f0] pt-3 leading-relaxed">
                <span class="font-bold text-[#0c1424] block mb-0.5">Prazo de entrega:</span>
                Entregue em 15 dias corridos após o aceite e pagamento do sinal de 50%.
              </div>
            </div>
          </div>

          <!-- Ação Direta para o Cliente -->
          <div class="pt-4">
            <button class="w-full flex items-center justify-center gap-2 bg-[#0870f8] hover:bg-[#0055c8] text-white font-bold text-sm py-3 px-4 rounded-xl shadow-lg shadow-[#0870f8]/20 transition duration-300">
              <CheckCircle2 class="w-4 h-4" />
              Aprovar Orçamento Online
            </button>
            <span class="text-[9px] text-[#61708a] block text-center mt-2 font-semibold">O cliente aprova sem precisar criar conta</span>
          </div>
        </div>
      </div>

      <!-- Barra de Controle do Slider -->
      <div 
        class="absolute top-0 bottom-0 w-1 bg-[#0870f8] pointer-events-none shadow-[0_0_10px_rgba(8,112,248,0.6)]"
        :style="{ left: `${sliderPos}%` }"
      >
        <!-- Botão de Arrastar -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#07111f] border-2 border-[#0870f8] flex items-center justify-center text-white shadow-2xl pointer-events-auto cursor-ew-resize transition-colors">
          <div class="flex gap-0.5 text-white font-black text-xs select-none">
            <span>&lt;</span>
            <span>&gt;</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
