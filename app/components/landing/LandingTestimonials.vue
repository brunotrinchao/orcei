<script setup lang="ts">
const testimonials = [
  {
    initials: 'LF',
    name: 'Lucas Ferreira',
    role: 'Desenvolvedor Web',
    highlight: 'Catálogo de serviços + IA de descrição',
    quote: 'Cadastrei meus serviços uma vez no catálogo e agora monto orçamento em minutos. A IA escreve a descrição técnica, eu só confiro e mando o link.'
  },
  {
    initials: 'MC',
    name: 'Mariana Costa',
    role: 'Designer Freelancer',
    highlight: 'Notificação de leitura em tempo real',
    quote: 'Saber na hora que o cliente abriu o orçamento mudou meu jogo. Faço o follow-up no momento certo em vez de ficar mandando mensagem no escuro.'
  },
  {
    initials: 'RA',
    name: 'Rafael Almeida',
    role: 'Fotógrafo & Videomaker',
    highlight: 'Contratos e PDF integrados',
    quote: 'Gero o orçamento, o contrato e o PDF profissional no mesmo lugar. Antes eu usava três ferramentas diferentes pra fechar um projeto só.'
  }
]
</script>

<template>
  <section id="depoimentos" class="mb-24 py-16 scroll-mt-20 relative bg-slate-950">
    <div class="absolute inset-0 pointer-events-none -z-10">
      <div class="absolute top-[20%] left-[15%] w-[450px] h-[300px] bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-transparent blur-3xl"></div>
    </div>

    <div class="max-w-7xl mx-auto px-4">
      <div class="text-center mb-16">
        <p class="text-xs font-black text-emerald-400 uppercase tracking-widest mb-3">Quem usa, recomenda</p>
        <h2 class="text-3xl md:text-5xl font-black text-white tracking-tight">
          Profissionais que fecham mais<br class="hidden md:block"> com o Orcei Fácil
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          v-for="t in testimonials"
          :key="t.name"
          class="p-8 bg-slate-900/40 border border-slate-800/80 hover:border-emerald-500/30 rounded-3xl transition-all duration-300 flex flex-col justify-between shadow-xl"
        >
          <div>
            <span class="inline-block text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-5">
              {{ t.highlight }}
            </span>
            <p class="text-slate-300 text-sm leading-relaxed font-medium">
              &ldquo;{{ t.quote }}&rdquo;
            </p>
          </div>

          <div class="flex items-center gap-3 mt-8 pt-6 border-t border-slate-800/80">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white font-black text-xs flex-shrink-0">
              {{ t.initials }}
            </div>
            <div>
              <p class="text-sm font-black text-white">{{ t.name }}</p>
              <p class="text-xs text-slate-500 font-medium">{{ t.role }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
