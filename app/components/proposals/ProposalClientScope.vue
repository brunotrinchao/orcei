<script setup lang="ts">
import { FileText } from 'lucide-vue-next'
import type { ProposalDTO } from '../../../types'

defineProps<{
  items: ProposalDTO['items']
  totals: ProposalDTO['totals']
  finalTotal: number
}>()
</script>

<template>
  <section class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
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
        <div class="shrink-0 w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
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
