<script setup lang="ts">
import { Check, Sparkles } from 'lucide-vue-next'

// Mesma fonte de dados usada em /planos (SaaS) - só o layout muda aqui
const { packages } = useCreditPackages()
const { getAppUrl, isExternalUrl } = useAppUrl()
</script>

<template>
  <section id="pricing" class="mb-24 py-16 scroll-mt-20 relative bg-[#f4f7fb] border-y border-[#dfe6f0]">
    <div class="max-w-7xl mx-auto px-4">
      <div class="text-center mb-16">
        <p class="text-xs font-black text-[#0870f8] uppercase tracking-widest mb-3">Planos &amp; Preços</p>
        <h2 class="text-3xl md:text-5xl font-black text-[#0c1424] tracking-tight">O investimento que se paga no primeiro cliente</h2>
        <p class="text-[#61708a] max-w-xl mx-auto mt-4 font-medium text-sm md:text-base">
          Escolha o pacote de créditos ideal para sua demanda. Créditos vitalícios, sem mensalidade.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        <div
          v-for="pack in packages"
          :key="pack.id"
          :class="[
            'group relative p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between shadow-sm',
            pack.highlight
              ? 'bg-white border-2 border-[#0870f8] shadow-xl scale-100 lg:scale-[1.03] z-10'
              : 'bg-white border border-[#dfe6f0] hover:border-[#61708a]/40'
          ]"
        >
          <!-- Tag de Destaque -->
          <div
            v-if="pack.highlight"
            class="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0870f8] text-white font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md flex items-center gap-1"
          >
            <Sparkles class="w-3 h-3 animate-pulse" />
            {{ pack.badge }}
          </div>

          <div>
            <div class="mb-6">
              <span
                v-if="!pack.highlight"
                class="text-xs font-bold text-[#61708a] uppercase tracking-widest"
              >{{ pack.badge }}</span>
              <h3 class="text-2xl font-black text-[#0c1424] mt-1">{{ pack.name }}</h3>
              <p class="text-[#61708a] text-xs mt-2">{{ pack.description }}</p>
            </div>

            <div class="mb-6">
              <div class="flex items-baseline gap-1 mt-1">
                <span class="text-4xl font-black text-[#0c1424]">{{ pack.price }}</span>
              </div>
              <p class="text-[10px] text-[#0870f8] mt-2 font-bold uppercase tracking-wider">{{ pack.unitPrice }}</p>
            </div>

            <ul class="space-y-4 mb-8">
              <li v-for="feature in pack.features" :key="feature" class="flex items-start gap-3">
                <Check class="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span class="text-xs text-[#0c1424] font-medium">{{ feature }}</span>
              </li>
            </ul>
          </div>

          <NuxtLink
            :href="getAppUrl('/auth/login')"
            :external="isExternalUrl()"
            target="_self"
            :class="[
              'w-full text-center py-4 font-bold text-sm rounded-2xl transition duration-300',
              pack.highlight
                ? 'bg-[#0870f8] hover:bg-[#0055c8] text-white shadow-md shadow-[#0870f8]/20'
                : 'bg-[#e9f3ff] hover:bg-[#0870f8] text-[#0870f8] hover:text-white'
            ]"
          >
            Comprar {{ pack.credits }} {{ pack.credits === 1 ? 'Crédito' : 'Créditos' }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>
