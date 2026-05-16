<script setup lang="ts">
const { loggedIn } = useUserSession()

watchEffect(() => {
  if (loggedIn.value) {
    navigateTo('/dashboard')
  }
})
</script>

<template>
  <!-- Hero Section -->
  <div class="relative overflow-hidden">
    <!-- Glow background -->
    <div class="absolute inset-0 -z-10 pointer-events-none">
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-b from-blue-50 to-transparent rounded-full blur-3xl opacity-70"></div>
    </div>

    <div class="text-center pt-16 pb-20 md:pt-24 md:pb-28 px-4">
      <!-- Badge -->
      <div class="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-wider">
        <span class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
        IA integrada para freelancers &amp; pequenas empresas
      </div>

      <!-- Headline -->
      <h1 class="text-5xl md:text-7xl font-black text-gray-900 mb-6 tracking-tight leading-none">
        Orçamentos que<br>
        <span class="text-blue-600">fecham negócios</span>.
      </h1>

      <!-- Subtitle -->
      <p class="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
        Crie orçamentos profissionais em segundos com IA, envie contratos automáticos e receba aprovações online. Simples assim.
      </p>

      <!-- CTAs -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
        <NuxtLink
          to="/auth/login"
          class="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-bold text-lg transition shadow-xl shadow-blue-100 hover:shadow-blue-200 hover:-translate-y-0.5"
        >
          Começar Agora — É Grátis
        </NuxtLink>
        <a
          href="#features"
          class="bg-white border-2 border-gray-100 hover:border-gray-200 text-gray-600 px-10 py-4 rounded-2xl font-bold text-lg transition hover:bg-gray-50"
        >
          Ver Funcionalidades ↓
        </a>
      </div>

      <!-- Social proof -->
      <div class="flex items-center justify-center gap-3">
        <div class="flex -space-x-2">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white shadow-sm"></div>
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-white shadow-sm"></div>
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-white shadow-sm"></div>
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-white shadow-sm"></div>
        </div>
        <p class="text-sm text-gray-500 font-medium">
          <span class="font-bold text-gray-900">+500 freelancers</span> já usam o Orcei
        </p>
      </div>
    </div>

    <!-- Product mockup screenshot -->
    <div class="relative px-4 pb-0 -mb-12 md:-mb-20 z-10">
      <div class="product-mockup mx-auto max-w-5xl rounded-2xl overflow-hidden border border-white/80 shadow-2xl shadow-blue-200/60 ring-1 ring-black/5">
        <img
          src="/images/landpage-banner.png"
          alt="Orcei — painel de orçamentos"
          class="w-full h-auto block"
        />
      </div>
      <!-- Fade bottom -->
      <div class="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
    </div>
  </div>

  <!-- Stats Bar -->
  <div class="border-y border-gray-100 bg-white py-8 mb-20 -mx-6">
    <div class="max-w-7xl mx-auto px-6">
      <div class="grid grid-cols-3 divide-x divide-gray-100 text-center">
        <div class="px-4 md:px-8">
          <p class="text-2xl md:text-4xl font-black text-gray-900">2.400+</p>
          <p class="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Orçamentos Criados</p>
        </div>
        <div class="px-4 md:px-8">
          <p class="text-2xl md:text-4xl font-black text-gray-900">&lt; 2 min</p>
          <p class="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Tempo Médio</p>
        </div>
        <div class="px-4 md:px-8">
          <p class="text-2xl md:text-4xl font-black text-gray-900">98%</p>
          <p class="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Satisfação</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Features Section -->
  <div id="features" class="mb-24 scroll-mt-20">
    <div class="text-center mb-12">
      <p class="text-xs font-black text-blue-600 uppercase tracking-widest mb-3">Funcionalidades</p>
      <h2 class="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
        Tudo que você precisa,<br class="hidden md:block"> em um só lugar.
      </h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="group p-8 bg-white rounded-3xl border border-gray-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-50 transition-all duration-300 text-left">
        <div class="w-14 h-14 bg-blue-50 group-hover:bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 class="font-black text-xl mb-3 text-gray-900">Rapidez Total</h3>
        <p class="text-gray-500 leading-relaxed">Gere descrições de serviços com IA e envie orçamentos profissionais em menos de 2 minutos.</p>
      </div>

      <div class="group p-8 bg-white rounded-3xl border border-gray-100 hover:border-green-100 hover:shadow-xl hover:shadow-green-50 transition-all duration-300 text-left">
        <div class="w-14 h-14 bg-green-50 group-hover:bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h3 class="font-black text-xl mb-3 text-gray-900">Contratos Seguros</h3>
        <p class="text-gray-500 leading-relaxed">Anexe termos e condições automaticamente e proteja seu trabalho juridicamente sem complicação.</p>
      </div>

      <div class="group p-8 bg-white rounded-3xl border border-gray-100 hover:border-purple-100 hover:shadow-xl hover:shadow-purple-50 transition-all duration-300 text-left">
        <div class="w-14 h-14 bg-purple-50 group-hover:bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <h3 class="font-black text-xl mb-3 text-gray-900">Acompanhamento</h3>
        <p class="text-gray-500 leading-relaxed">Saiba quando o cliente visualizou e receba aprovações em tempo real, direto no seu painel.</p>
      </div>

      <div class="group p-8 bg-white rounded-3xl border border-gray-100 hover:border-amber-100 hover:shadow-xl hover:shadow-amber-50 transition-all duration-300 text-left">
        <div class="w-14 h-14 bg-amber-50 group-hover:bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h3 class="font-black text-xl mb-3 text-gray-900">IA Integrada</h3>
        <p class="text-gray-500 leading-relaxed">Deixe a inteligência artificial escrever descrições, sugerir preços e otimizar seus orçamentos.</p>
      </div>

      <div class="group p-8 bg-white rounded-3xl border border-gray-100 hover:border-rose-100 hover:shadow-xl hover:shadow-rose-50 transition-all duration-300 text-left">
        <div class="w-14 h-14 bg-rose-50 group-hover:bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 class="font-black text-xl mb-3 text-gray-900">Catálogo de Serviços</h3>
        <p class="text-gray-500 leading-relaxed">Cadastre seus serviços uma vez e reutilize em todos os orçamentos com um clique.</p>
      </div>

      <div class="group p-8 bg-white rounded-3xl border border-gray-100 hover:border-teal-100 hover:shadow-xl hover:shadow-teal-50 transition-all duration-300 text-left">
        <div class="w-14 h-14 bg-teal-50 group-hover:bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mb-6 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 class="font-black text-xl mb-3 text-gray-900">PDF Profissional</h3>
        <p class="text-gray-500 leading-relaxed">Gere PDFs com sua marca, logo e dados da empresa prontos para enviar a qualquer cliente.</p>
      </div>
    </div>
  </div>

  <!-- How it works -->
  <div id="como-funciona" class="mb-24 scroll-mt-20">
    <div class="text-center mb-12">
      <p class="text-xs font-black text-blue-600 uppercase tracking-widest mb-3">Como Funciona</p>
      <h2 class="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Três passos. Nada mais.</h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="relative text-center p-8 bg-white rounded-3xl border border-gray-100">
        <div class="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-black shadow-xl shadow-blue-200">1</div>
        <h3 class="font-black text-lg mb-3 text-gray-900">Crie o orçamento</h3>
        <p class="text-gray-500 text-sm leading-relaxed">Adicione itens do catálogo ou deixe a IA descrever seus serviços automaticamente.</p>
      </div>

      <div class="relative text-center p-8 bg-white rounded-3xl border border-gray-100">
        <div class="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-black shadow-xl shadow-blue-200">2</div>
        <h3 class="font-black text-lg mb-3 text-gray-900">Envie para o cliente</h3>
        <p class="text-gray-500 text-sm leading-relaxed">Compartilhe o link personalizado por WhatsApp, e-mail ou onde preferir.</p>
      </div>

      <div class="relative text-center p-8 bg-white rounded-3xl border border-gray-100">
        <div class="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-black shadow-xl shadow-blue-200">3</div>
        <h3 class="font-black text-lg mb-3 text-gray-900">Receba a aprovação</h3>
        <p class="text-gray-500 text-sm leading-relaxed">O cliente aprova online e você recebe notificação instantânea. Negócio fechado.</p>
      </div>
    </div>
  </div>

  <!-- Bottom CTA -->
  <div class="bg-blue-600 rounded-3xl p-10 md:p-16 text-center mb-8 relative overflow-hidden">
    <div class="absolute top-0 right-0 w-72 h-72 bg-blue-500 rounded-full -translate-y-1/3 translate-x-1/3 opacity-50 pointer-events-none"></div>
    <div class="absolute bottom-0 left-0 w-56 h-56 bg-blue-700 rounded-full translate-y-1/3 -translate-x-1/3 opacity-50 pointer-events-none"></div>

    <div class="relative">
      <p class="text-blue-200 text-xs font-black uppercase tracking-widest mb-4">Comece hoje</p>
      <h2 class="text-3xl md:text-5xl font-black text-white tracking-tight mb-6">
        Seu próximo orçamento<br>em 2 minutos.
      </h2>
      <p class="text-blue-100 max-w-md mx-auto mb-10 leading-relaxed">
        Junte-se a centenas de freelancers que já fecham mais negócios com o Orcei. Grátis para começar.
      </p>
      <NuxtLink
        to="/auth/login"
        class="inline-flex items-center gap-2 bg-white text-blue-600 px-10 py-4 rounded-2xl font-black text-lg transition hover:bg-blue-50 shadow-2xl hover:-translate-y-0.5"
      >
        Criar Conta Grátis
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.product-mockup {
  transform: perspective(1400px) rotateX(6deg) rotateY(-1deg) scale(0.97);
  transform-origin: center top;
  transition: transform 0.4s ease;
  animation: float 7s ease-in-out infinite;
}

.product-mockup:hover {
  transform: perspective(1400px) rotateX(2deg) rotateY(0deg) scale(0.99);
}

@keyframes float {
  0%, 100% { transform: perspective(1400px) rotateX(6deg) rotateY(-1deg) scale(0.97) translateY(0px); }
  50%       { transform: perspective(1400px) rotateX(5deg) rotateY(-1deg) scale(0.97) translateY(-8px); }
}

@media (max-width: 768px) {
  .product-mockup {
    transform: none;
    animation: none;
  }
  .product-mockup:hover {
    transform: none;
  }
}
</style>
