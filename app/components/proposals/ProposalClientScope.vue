<script setup lang="ts">
import { FileText } from 'lucide-vue-next'
import type { ProposalDTO } from '../../../types'

const props = defineProps<{
  items: ProposalDTO['items']
  upsellItems?: ProposalDTO['upsellItems']
  totals: {
    subtotal: number
    additional?: number
    discount: number
    final: number
  }
  finalTotal: number
  isAccepted?: boolean
}>()

const selectedUpsells = defineModel<string[]>('selectedUpsells', { default: () => [] })

function toggleUpsell(itemId: string) {
  if (props.isAccepted) return
  const index = selectedUpsells.value.indexOf(itemId)
  if (index === -1) {
    selectedUpsells.value.push(itemId)
  } else {
    selectedUpsells.value.splice(index, 1)
  }
}
</script>

<template>
  <section class="bg-white rounded-[0.5rem] border border-gray-100 shadow-sm overflow-hidden">
    <!-- Section header -->
    <div class="px-8 py-6 border-b border-gray-100 flex items-center gap-3">
      <div class="w-8 h-8 bg-[#3147F6]/10 rounded-xl flex items-center justify-center">
        <FileText class="w-4 h-4 text-[#3147F6]" />
      </div>
      <h2 class="text-[10px] font-black text-gray-600 uppercase tracking-[0.25em]">Escopo do Projeto</h2>
    </div>

    <!-- Items list -->
    <div class="divide-y divide-gray-50">
      <div
        v-for="(item, idx) in items"
        :key="item._id"
        class="px-8 py-7 flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6"
      >
        <!-- Index bubble -->
        <div class="shrink-0 w-9 h-9 rounded-[0.5rem] bg-gray-50 border border-gray-100 flex items-center justify-center">
          <span class="text-xs font-black text-gray-600">{{ String(idx + 1).padStart(2, '0') }}</span>
        </div>

        <!-- Description -->
        <div class="flex-1 min-w-0">
          <h3 class="font-black text-gray-900 text-base tracking-tight leading-snug mb-1">{{ item.name }}</h3>
          <p v-if="item.description" class="text-sm text-gray-600 font-medium leading-relaxed">{{ item.description }}</p>
          <!-- Unit price × qty -->
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <span class="text-[10px] font-black text-gray-600 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              R$ {{ item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }} × {{ item.quantity }}
            </span>
          </div>
        </div>

        <!-- Subtotal -->
        <div class="shrink-0 text-right">
          <p class="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Subtotal</p>
          <p class="font-black text-gray-900 text-lg">
            R$ {{ (item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Upsell Items list (Serviços adicionais sugeridos) -->
    <div v-if="upsellItems && upsellItems.length > 0" class="bg-blue-50/10 border-t border-b border-blue-50/30">
      <div class="px-8 py-5 bg-blue-50/40 flex items-center justify-between border-b border-blue-50/20">
        <h3 class="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
          <span class="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          Serviços Opcionais (Sugestão de Upsell)
        </h3>
        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Opcional</span>
      </div>

      <div class="divide-y divide-blue-50/20">
        <div
          v-for="item in upsellItems"
          :key="item._id"
          @click="toggleUpsell(item._id!)"
          class="px-8 py-6 flex items-start gap-4 sm:gap-6 select-none transition-all duration-300 relative"
          :class="[
            isAccepted
              ? 'cursor-default'
              : 'cursor-pointer hover:bg-blue-50/30 active:scale-[0.995]',
            isAccepted && !selectedUpsells.includes(item._id!)
              ? 'opacity-40 grayscale'
              : ''
          ]"
        >
          <!-- Switch checkbox -->
          <div class="shrink-0 pt-1">
            <div
              class="w-10 h-6 rounded-full p-1 transition-colors duration-300 relative shadow-inner"
              :class="selectedUpsells.includes(item._id!) ? 'bg-blue-600' : 'bg-gray-200'"
            >
              <div
                class="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300"
                :class="selectedUpsells.includes(item._id!) ? 'translate-x-4' : 'translate-x-0'"
              ></div>
            </div>
          </div>

          <!-- Description -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <h4 class="font-black text-gray-900 text-sm tracking-tight leading-snug">{{ item.name }}</h4>
              <span
                v-if="selectedUpsells.includes(item._id!)"
                class="px-2 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-black uppercase tracking-widest rounded"
              >
                Adicionado
              </span>
            </div>
            <p v-if="item.description" class="text-xs text-gray-500 font-medium leading-relaxed">{{ item.description }}</p>
            <div class="mt-2 text-[10px] font-black text-blue-600 bg-blue-50/40 inline-block px-2.5 py-1 rounded-md border border-blue-100/30">
              R$ {{ item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }} × {{ item.quantity }}
            </div>
          </div>

          <!-- Subtotal -->
          <div class="shrink-0 text-right">
            <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Investimento</p>
            <p class="font-black text-gray-900 text-base">
              + R$ {{ (item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Totals summary -->
    <div class="px-8 py-6 bg-gray-50 border-t border-gray-100 space-y-3">
      <div class="flex justify-between items-center">
        <span class="text-sm font-bold text-gray-600">Subtotal</span>
        <span class="font-bold text-gray-700">R$ {{ totals.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
      </div>
      <div v-if="totals.discount" class="flex justify-between items-center">
        <span class="text-sm font-bold text-green-600">Desconto</span>
        <span class="font-bold text-green-600">− R$ {{ totals.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
      </div>
      <div v-if="totals.additional" class="flex justify-between items-center">
        <span class="text-sm font-bold text-orange-600">Acréscimo</span>
        <span class="font-bold text-orange-600">+ R$ {{ totals.additional.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
      </div>
      <div class="pt-3 border-t border-gray-200 flex justify-between items-baseline">
        <span class="text-sm font-black text-gray-900 uppercase tracking-widest">Total</span>
        <span class="text-2xl font-black text-[#3147F6]">
          R$ {{ finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
        </span>
      </div>
    </div>
  </section>
</template>
