<script setup lang="ts">
import { computed } from 'vue'
// import { Zap, Eye, Lightbulb, Briefcase, FileText, Link, HelpCircle } from 'lucide-vue-next'
import * as LucideIcons from 'lucide-vue-next'
import { Check, ChevronDown, Search, HelpCircle } from 'lucide-vue-next'

interface Feature {
  title: string
  description: string
  icon: string
  enabled?: boolean
}

const props = defineProps<{
  features?: Feature[]
}>()

function getIcon(name: string) {
  if (!name) return HelpCircle

  const formattedName = name
    .split(/[-_ ]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')

  const iconComponent = (LucideIcons as Record<string, any>)[formattedName] || (LucideIcons as Record<string, any>)[name]
  return iconComponent || HelpCircle
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
  <section id="features" class="mb-24 py-16 scroll-mt-20 relative bg-[#f4f7fb] border-y border-[#dfe6f0]">
    <div class="max-w-7xl mx-auto px-4">
      <div class="text-center mb-16">
        <p class="text-xs font-black text-[#0870f8] uppercase tracking-widest mb-3">
          Funcionalidades
        </p>
        <h2 class="text-3xl md:text-5xl font-black text-[#0c1424] tracking-tight leading-tight">
          Tudo que você precisa,<br class="hidden md:block" />
          em um só lugar.
        </h2>
        <p class="text-[#61708a] max-w-xl mx-auto mt-4 font-medium text-sm md:text-base">
          Desenhado para simplificar sua rotina e transformar propostas
          ineficientes em orçamentos profissionais de alto nível.
        </p>
      </div>

      <!-- Grid de Benefícios -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="(f, idx) in activeFeatures" :key="idx"
          class="group p-8 bg-white border border-[#dfe6f0] hover:border-[#0870f8] rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 text-left relative overflow-hidden">
          
          <!-- Ícone -->
          <div
            class="w-14 h-14 bg-[#e9f3ff] text-[#0870f8] rounded-2xl flex items-center justify-center mb-6 border border-[#0870f8]/20 transition-all duration-300">
            <component :is="getIcon(f.icon)" class="h-7 w-7 transition-transform duration-300 group-hover:scale-110" />
          </div>

          <!-- Títulos e Texto -->
          <h3 class="font-black text-xl mb-3 text-[#0c1424]">
            {{ f.title }}
          </h3>
          <p class="text-[#61708a] text-sm leading-relaxed font-medium">
            {{ f.description }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
