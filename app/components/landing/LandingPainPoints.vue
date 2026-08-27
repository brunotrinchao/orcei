<script setup lang="ts">
import { Clock, EyeOff, Coins } from 'lucide-vue-next'

const painPoints = [
  {
    icon: Clock,
    color: 'amber',
    title: 'Processo lento e manual',
    description: 'Abrir o Word ou Excel, formatar tabela, exportar PDF, mandar pelo WhatsApp… e torcer para o cliente responder. Todo mês a mesma novela.'
  },
  {
    icon: EyeOff,
    color: 'rose',
    title: 'Zero visibilidade',
    description: 'O cliente recebeu? Abriu o PDF? Leu até o final? Sem saber, você perde o timing certo de fazer o follow-up e o negócio esfria.'
  },
  {
    icon: Coins,
    color: 'blue',
    title: 'Insegurança no preço',
    description: 'Cobrar demais e perder o job, ou cobrar de menos e sair no prejuízo? Sem apoio de IA para calibrar a proposta, é sempre um chute.'
  }
]

const colorClasses: Record<string, { bg: string; text: string; border: string; hoverBorder: string }> = {
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/10', hoverBorder: 'hover:border-amber-500/30' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/10', hoverBorder: 'hover:border-rose-500/30' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/10', hoverBorder: 'hover:border-blue-500/30' }
}
</script>

<template>
  <section class="py-16 scroll-mt-20 relative bg-white">
    <div class="max-w-7xl mx-auto px-4">
      <div class="text-center mb-16">
        <p class="text-xs font-black text-[#0870f8] uppercase tracking-widest mb-3">O Problema</p>
        <h2 class="text-3xl md:text-6xl font-bold text-[#0c1424] tracking-tight leading-[1.02]">
          Você perde horas montando orçamento<br class="hidden md:block" /> <span class="text-[#0870f8]">que o cliente nem abre</span>
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          v-for="point in painPoints"
          :key="point.title"
          class="p-8 bg-[#f4f7fb] border border-[#dfe6f0] hover:border-[#61708a]/40 rounded-3xl transition-all duration-300 text-left shadow-sm hover:shadow-md"
        >
          <div :class="['w-12 h-12 rounded-2xl flex items-center justify-center mb-6', colorClasses[point.color].bg, colorClasses[point.color].text]">
            <component :is="point.icon" class="w-6 h-6" />
          </div>
          <h3 class="font-black text-lg mb-3 text-[#0c1424]">{{ point.title }}</h3>
          <p class="text-[#61708a] text-sm leading-relaxed font-medium">{{ point.description }}</p>
        </div>
      </div>

      <p class="text-center text-[#61708a] text-sm font-medium mt-12 max-w-2xl mx-auto">
        E enquanto você formata PDF, seu concorrente já mandou um link profissional pelo <span class="text-[#0870f8] font-bold">Orcei Fácil</span> e fechou o projeto.
      </p>
    </div>
  </section>
</template>
