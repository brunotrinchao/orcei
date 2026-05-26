<script setup lang="ts">
import { ref, computed } from 'vue'
import { Sparkles, Zap, ShieldCheck, CheckCircle2, Loader2, CreditCard, Banknote, ArrowRight } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  reason?: string
}>()

const emits = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val) => emits('update:open', val)
})

const isLoading = ref<string | null>(null)
const selectedPack = ref('pro_pack')

const { notify } = useAlerts()

const packages = [
  {
    id: 'starter_pack',
    name: 'Starter',
    credits: 10,
    price: 'R$ 29,90',
    unitPrice: 'R$ 2,99',
    discount: '49%',
    highlight: false,
    badge: 'Iniciantes'
  },
  {
    id: 'pro_pack',
    name: 'Profissional',
    credits: 30,
    price: 'R$ 69,90',
    unitPrice: 'R$ 2,33',
    discount: '60%',
    highlight: true,
    badge: 'Melhor Valor'
  },
  {
    id: 'agency_pack',
    name: 'Agência',
    credits: 100,
    price: 'R$ 149,90',
    unitPrice: 'R$ 1,50',
    discount: '74%',
    highlight: false,
    badge: 'Uso Comercial'
  }
]

const activePack = computed(() => packages.find(p => p.id === selectedPack.value) || packages[1])

async function handleCheckout() {
  isLoading.value = selectedPack.value
  try {
    const { url } = await $fetch<any>('/api/stripe/checkout', {
      method: 'POST',
      body: { tier: selectedPack.value, type: 'credits' }
    })
    if (url) window.location.href = url
  } catch (e: any) {
    notify('Erro', e.data?.statusMessage || 'Erro ao iniciar checkout')
  } finally {
    isLoading.value = null
  }
}
</script>

<template>
  <BaseDialog 
    v-model:open="isOpen" 
    title="⚡ Recarga Expressa de Créditos" 
    size="lg"
  >
    <div class="space-y-6">
      
      <!-- Cabeçalho Persuasivo Premium (Midnight Sapphire Theme) -->
      <div class="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 rounded-3xl border border-indigo-500/20 text-center space-y-3">
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
        <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
        
        <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 backdrop-blur-md rounded-full text-indigo-200 text-[9px] font-black uppercase tracking-widest border border-indigo-500/30">
          <Sparkles class="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Orcei Fácil Premium
        </div>
        
        <h3 class="text-xl font-black text-white uppercase tracking-tight leading-tight max-w-lg mx-auto">
          Você está a um passo de {{ props.reason || 'continuar gerando valor' }}!
        </h3>
        
        <p class="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
          Clientes preferem propostas interativas de alta legibilidade. Abasteça sua carteira em segundos com créditos vitalícios e feche mais negócios.
        </p>
      </div>

      <!-- Grade Horizontal de Seleção de Pacotes -->
      <div class="space-y-3">
        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Escolha a sua Recarga:</p>
        
        <div class="grid grid-cols-3 gap-3">
          <button 
            v-for="pack in packages" 
            :key="pack.id"
            @click="selectedPack = pack.id"
            :class="[
              'p-4 rounded-2xl border text-left transition-all flex flex-col justify-between h-36 relative overflow-hidden',
              selectedPack === pack.id
                ? 'border-indigo-600 ring-2 ring-indigo-500/10 bg-indigo-50/10 shadow-md scale-[1.02]'
                : 'border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50/20'
            ]"
          >
            <!-- Badge de Economia / Destaque -->
            <span 
              :class="[
                'text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded w-fit block',
                pack.highlight 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              ]"
            >
              {{ pack.highlight ? 'Recomendado' : `Economize ${pack.discount}` }}
            </span>

            <div class="mt-2">
              <h4 class="text-sm font-black text-gray-900 uppercase tracking-tight leading-none">{{ pack.name }}</h4>
              <p class="text-[9px] text-gray-400 font-bold mt-1">{{ pack.credits }} Créditos</p>
            </div>

            <div class="flex items-baseline gap-0.5 mt-2">
              <span class="text-lg font-black text-gray-900 tracking-tight">{{ pack.price }}</span>
              <span class="text-[8px] font-bold text-gray-400 uppercase">/ único</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Detalhes da Opção Selecionada -->
      <div class="bg-gray-50 rounded-2xl p-5 border border-gray-100/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-xs font-black text-gray-900 uppercase tracking-wide">Recarga de {{ activePack.credits }} Créditos</span>
            <span class="text-[8px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
              {{ activePack.unitPrice }} por crédito
            </span>
          </div>
          <p class="text-[10px] text-gray-400 font-medium">
            Permite gerar {{ activePack.credits }} orçamentos de alta conversão ou relatórios inteligentes com inteligência artificial.
          </p>
        </div>

        <div class="text-right shrink-0 bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm w-full sm:w-auto">
          <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest">Valor Único</p>
          <p class="text-lg font-black text-indigo-600">{{ activePack.price }}</p>
        </div>
      </div>

      <!-- CTA de Compra Rápida Pix/Cartão -->
      <div class="space-y-4">
        <BaseButton 
          @click="handleCheckout"
          :disabled="!!isLoading"
          class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl py-4.5 text-xs font-black tracking-widest uppercase shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
        >
          <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin mr-2" />
          <template v-else>
            Abastecer Carteira de Créditos <ArrowRight class="w-4 h-4" />
          </template>
        </BaseButton>

        <!-- Selo de Créditos Vitalícios -->
        <div class="flex justify-center items-center gap-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">
          <div class="flex items-center gap-1.5">
            <ShieldCheck class="w-4 h-4 text-indigo-500" />
            <span>Créditos Vitalícios (Nunca expiram)</span>
          </div>
          <div class="h-4 w-px bg-gray-200"></div>
          <div class="flex items-center gap-1.5">
            <Banknote class="w-4 h-4 text-emerald-500" />
            <span>Pix ou Cartão</span>
          </div>
        </div>
      </div>

    </div>
  </BaseDialog>
</template>
