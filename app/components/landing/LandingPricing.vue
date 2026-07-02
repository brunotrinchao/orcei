<script setup lang="ts">
import { Check, Sparkles } from 'lucide-vue-next'

// Mesma fonte de dados usada em /planos (SaaS) - só o layout muda aqui
const { packages } = useCreditPackages()
</script>

<template>
  <section id="pricing" class="mb-24 py-16 scroll-mt-20 relative bg-slate-950">
    <!-- Auras de ambientação -->
    <div class="absolute inset-0 pointer-events-none -z-10">
      <div class="absolute top-[20%] right-[-10%] w-[500px] h-[300px] bg-gradient-to-r from-purple-500/5 via-fuchsia-500/5 to-transparent blur-3xl"></div>
    </div>

    <div class="max-w-7xl mx-auto px-4">
      <div class="text-center mb-16">
        <p class="text-xs font-black text-purple-400 uppercase tracking-widest mb-3">Planos &amp; Preços</p>
        <h2 class="text-3xl md:text-5xl font-black text-white tracking-tight">O investimento que se paga no primeiro cliente</h2>
        <p class="text-slate-400 max-w-xl mx-auto mt-4 font-medium text-sm md:text-base">
          Escolha o pacote de créditos ideal para sua demanda. Créditos vitalícios, sem mensalidade.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        <div
          v-for="pack in packages"
          :key="pack.id"
          :class="[
            'group relative p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between shadow-xl',
            pack.highlight
              ? 'bg-slate-900/60 border-2 border-purple-500/80 shadow-2xl scale-100 lg:scale-[1.03] z-10'
              : 'bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/80'
          ]"
        >
          <!-- Tag de Destaque -->
          <div
            v-if="pack.highlight"
            class="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1"
          >
            <Sparkles class="w-3 h-3 animate-pulse" />
            {{ pack.badge }}
          </div>

          <div>
            <div class="mb-6">
              <span
                v-if="!pack.highlight"
                class="text-xs font-bold text-slate-400 uppercase tracking-widest"
              >{{ pack.badge }}</span>
              <h3 class="text-2xl font-black text-white mt-1">{{ pack.name }}</h3>
              <p class="text-slate-400 text-xs mt-2">{{ pack.description }}</p>
            </div>

            <div class="mb-6">
              <div class="flex items-baseline gap-1 mt-1">
                <span class="text-4xl font-black text-white">{{ pack.price }}</span>
                <span class="text-xs text-slate-400 font-bold">/ único</span>
              </div>
              <p class="text-[10px] text-purple-400/80 mt-2 font-bold uppercase tracking-wider">{{ pack.unitPrice }}</p>
            </div>

            <ul class="space-y-4 mb-8">
              <li v-for="feature in pack.features" :key="feature" class="flex items-start gap-3">
                <Check class="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span class="text-xs text-slate-300 font-medium">{{ feature }}</span>
              </li>
            </ul>
          </div>

          <NuxtLink
            to="/auth/login"
            :class="[
              'w-full text-center py-4 font-bold text-sm rounded-2xl transition duration-300',
              pack.highlight
                ? 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-[0_4px_20px_rgba(168,85,247,0.4)]'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            ]"
          >
            Comprar {{ pack.credits }} {{ pack.credits === 1 ? 'Crédito' : 'Créditos' }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>
