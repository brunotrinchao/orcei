<script setup lang="ts">
import { computed } from 'vue'
import { Zap, Eye, Lightbulb, Briefcase, FileText, Link, HelpCircle } from 'lucide-vue-next'

interface Feature {
  title: string
  description: string
  icon: string
  enabled?: boolean
}

const props = defineProps<{
  features?: Feature[]
}>()

// Mapeamento estático estrito de ícones Lucide para Tree-shaking ótimo
const iconMap = {
  Zap,
  Eye,
  Lightbulb,
  Briefcase,
  FileText,
  Link
} as const

function getIcon(name: string) {
  return iconMap[name as keyof typeof iconMap] || HelpCircle
}

const fallbackFeatures = [
  { title: 'Rapidez Total', description: 'Gere descrições de serviços com IA e envie orçamentos profissionais em menos de 2 minutos.', icon: 'Zap' },
  { title: 'Envio por Link', description: 'Compartilhe sua proposta comercial por WhatsApp ou e-mail com um link exclusivo e prático para o cliente.', icon: 'Link' },
  { title: 'Acompanhamento', description: 'Saiba quando o cliente visualizou e receba aprovações em tempo real, direto no seu painel.', icon: 'Eye' },
  { title: 'IA Integrada', description: 'Deixe a inteligência artificial escrever descrições, sugerir preços e otimizar seus orçamentos.', icon: 'Lightbulb' },
  { title: 'Catálogo de Serviços', description: 'Cadastre seus serviços uma vez e reutilize em todos os orçamentos com um clique.', icon: 'Briefcase' },
  { title: 'PDF Profissional', description: 'Gere PDFs com sua marca, logo e dados da empresa prontos para enviar a qualquer cliente.', icon: 'FileText' }
]

const activeFeatures = computed(() => {
  if (props.features && props.features.length > 0) {
    return props.features.filter((f) => f.enabled !== false)
  }
  return fallbackFeatures
})
</script>

<template>
  <section id="features" class="mb-24 py-16 scroll-mt-20 relative bg-slate-950">
    <!-- Ambient Blur Glow em verde esmeralda e violeta sutil nos lados -->
    <div class="absolute inset-0 pointer-events-none -z-10">
      <div class="absolute top-[20%] left-[-15%] w-[450px] h-[450px] bg-emerald-500/5 rounded-full blur-3xl opacity-50"></div>
      <div class="absolute bottom-[20%] right-[-15%] w-[450px] h-[450px] bg-blue-500/5 rounded-full blur-3xl opacity-50"></div>
    </div>

    <div class="max-w-7xl mx-auto px-4">
      <div class="text-center mb-16">
        <p class="text-xs font-black text-blue-400 uppercase tracking-widest mb-3">Funcionalidades</p>
        <h2 class="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
          Tudo que você precisa,<br class="hidden md:block"> em um só lugar.
        </h2>
        <p class="text-slate-400 max-w-xl mx-auto mt-4 font-medium text-sm md:text-base">
          Desenhado para simplificar sua rotina e transformar propostas ineficientes em orçamentos profissionais de alto nível.
        </p>
      </div>

      <!-- Grid de Benefícios -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="(f, idx) in activeFeatures" 
          :key="idx" 
          class="group p-8 bg-slate-900/40 border border-slate-800/80 hover:border-blue-500/35 rounded-3xl hover:shadow-[0_20px_40px_-20px_rgba(37,99,235,0.15)] transition-all duration-300 text-left relative overflow-hidden"
        >
          <!-- Brilho interno do card ao hover -->
          <div class="absolute -right-16 -top-16 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

          <!-- Ícone com importação e cor otimizada (Mapeamento Rígido) -->
          <div class="w-14 h-14 bg-slate-800/60 group-hover:bg-blue-500/10 text-slate-400 group-hover:text-blue-400 rounded-2xl flex items-center justify-center mb-6 border border-slate-800 group-hover:border-blue-500/20 transition-all duration-300">
            <component :is="getIcon(f.icon)" class="h-7 w-7 transition-transform duration-300 group-hover:scale-110" />
          </div>

          <!-- Títulos e Texto com excelente contraste (Acessibilidade WCAG 2.2 AA) -->
          <h3 class="font-black text-xl mb-3 text-white transition-colors duration-300 group-hover:text-blue-300">{{ f.title }}</h3>
          <p class="text-slate-400 text-sm leading-relaxed font-medium">{{ f.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
