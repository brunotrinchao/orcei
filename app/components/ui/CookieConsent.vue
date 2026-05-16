<script setup lang="ts">
const { hasDecided, accept, reject } = useCookieConsent()
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-4"
  >
    <div
      v-if="!hasDecided"
      class="fixed bottom-6 left-4 right-4 z-[500] flex justify-center pointer-events-none"
    >
      <div class="pointer-events-auto w-full max-w-2xl bg-white rounded-2xl shadow-2xl shadow-gray-300/40 border border-gray-100 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div class="flex-1 min-w-0">
          <p class="text-xs font-black text-gray-900 uppercase tracking-widest mb-1">Cookies & Privacidade</p>
          <p class="text-xs text-gray-500 font-medium leading-relaxed">
            Usamos cookies para analytics e melhoria da experiência. Veja nossa
            <NuxtLink to="/privacy" class="underline hover:text-gray-900 transition-colors">Política de Privacidade</NuxtLink>
            e
            <NuxtLink to="/terms" class="underline hover:text-gray-900 transition-colors">Termos de Uso</NuxtLink>.
          </p>
        </div>
        <div class="flex gap-2 shrink-0 w-full sm:w-auto">
          <button
            @click="reject"
            class="flex-1 sm:flex-none px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
          >
            Rejeitar
          </button>
          <button
            @click="accept"
            class="flex-1 sm:flex-none px-6 py-2.5 text-[10px] font-black uppercase tracking-widest bg-gray-900 text-white hover:bg-black rounded-xl transition-all shadow-lg shadow-gray-200"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
