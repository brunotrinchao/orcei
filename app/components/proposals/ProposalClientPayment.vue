<script setup lang="ts">
import { CreditCard, Banknote, CheckCircle2 } from 'lucide-vue-next'
import type { ProposalDTO } from '../../../types'

const props = defineProps<{
  modelValue: 'cash' | 'credit_card'
  paymentConfig: ProposalDTO['paymentConfig']
  totals: ProposalDTO['totals']
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: 'cash' | 'credit_card'): void
}>()

function selectMethod(method: 'cash' | 'credit_card') {
  emit('update:modelValue', method)
}
</script>

<template>
  <section>
    <div class="flex items-center gap-3 mb-6">
      <div class="w-8 h-8 bg-[#3147F6]/10 rounded-xl flex items-center justify-center">
        <CreditCard class="w-4 h-4 text-[#3147F6]" />
      </div>
      <h2 class="text-[10px] font-black text-gray-600 uppercase tracking-[0.25em]">Forma de Pagamento</h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-5" role="radiogroup" aria-label="Opções de forma de pagamento">
      <!-- Cash option -->
      <button
        type="button"
        role="radio"
        :aria-checked="modelValue === 'cash'"
        @click="selectMethod('cash')"
        :class="[
          'relative text-left rounded-3xl border-2 p-7 transition-all duration-200 group outline-none focus-visible:ring-2 focus-visible:ring-[#3147F6] focus-visible:ring-offset-2',
          modelValue === 'cash'
            ? 'border-[#3147F6] bg-[#3147F6]/5 shadow-lg shadow-[#3147F6]/10'
            : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-md'
        ]"
      >
        <!-- Selected indicator -->
        <div class="absolute top-5 right-5">
          <div v-if="modelValue === 'cash'" class="w-6 h-6 bg-[#3147F6] rounded-full flex items-center justify-center shadow-md">
            <CheckCircle2 class="w-3.5 h-3.5 text-white" />
          </div>
          <div v-else class="w-6 h-6 border-2 border-gray-200 rounded-full group-hover:border-blue-300 transition-colors"></div>
        </div>

        <div class="mb-5">
          <div class="w-11 h-11 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
            <Banknote class="w-5 h-5 text-green-600" />
          </div>
          <h3 class="font-black text-gray-900 text-lg tracking-tight leading-snug">À Vista</h3>
          <p class="text-xs font-bold text-gray-600 mt-0.5">Pix / Transferência</p>
        </div>

        <p class="text-sm text-gray-600 font-medium leading-relaxed mb-6">
          Pagamento integral na aprovação com
          <strong class="text-green-600">{{ paymentConfig.cashDiscount }}% de desconto</strong>
          sobre o valor total.
        </p>

        <div class="pt-5 border-t border-gray-100">
          <p class="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Total com desconto</p>
          <p class="text-2xl font-black text-green-600">
            R$ {{ (totals.subtotal * (1 - paymentConfig.cashDiscount / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
          </p>
          <p class="text-[10px] font-bold text-green-500 mt-1 uppercase tracking-widest">
            Economize R$ {{ (totals.subtotal * paymentConfig.cashDiscount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
          </p>
        </div>
      </button>

      <!-- Credit card option -->
      <button
        type="button"
        role="radio"
        :aria-checked="modelValue === 'credit_card'"
        @click="selectMethod('credit_card')"
        :class="[
          'relative text-left rounded-3xl border-2 p-7 transition-all duration-200 group outline-none focus-visible:ring-2 focus-visible:ring-[#3147F6] focus-visible:ring-offset-2',
          modelValue === 'credit_card'
            ? 'border-[#3147F6] bg-[#3147F6]/5 shadow-lg shadow-[#3147F6]/10'
            : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-md'
        ]"
      >
        <!-- Selected indicator -->
        <div class="absolute top-5 right-5">
          <div v-if="modelValue === 'credit_card'" class="w-6 h-6 bg-[#3147F6] rounded-full flex items-center justify-center shadow-md">
            <CheckCircle2 class="w-3.5 h-3.5 text-white" />
          </div>
          <div v-else class="w-6 h-6 border-2 border-gray-200 rounded-full group-hover:border-blue-300 transition-colors"></div>
        </div>

        <div class="mb-5">
          <div class="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <CreditCard class="w-5 h-5 text-[#3147F6]" />
          </div>
          <h3 class="font-black text-gray-900 text-lg tracking-tight leading-snug">Cartão de Crédito</h3>
          <p class="text-xs font-bold text-gray-600 mt-0.5">Parcelado sem juros</p>
        </div>

        <p class="text-sm text-gray-600 font-medium leading-relaxed mb-6">
          Parcele em até
          <strong class="text-[#3147F6]">{{ paymentConfig.installments }}x</strong>
          de
          <strong class="text-[#3147F6]">R$ {{ (totals.subtotal / paymentConfig.installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</strong>
          sem juros.
        </p>

        <div class="pt-5 border-t border-gray-100">
          <p class="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Total</p>
          <p class="text-2xl font-black text-[#3147F6]">
            R$ {{ totals.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
          </p>
          <p class="text-[10px] font-bold text-gray-600 mt-1 uppercase tracking-widest">
            {{ paymentConfig.installments }}x de R$ {{ (totals.subtotal / paymentConfig.installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
          </p>
        </div>
      </button>
    </div>
  </section>
</template>
