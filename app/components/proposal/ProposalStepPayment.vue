<script setup lang="ts">
import { SendMethod } from '../../../types/enums'

const props = defineProps<{
  form: any
  finalTotal: number
}>()
</script>

<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div class="space-y-2">
      <h3 class="text-lg font-black text-gray-900 dark:text-white tracking-tight">Condições e Finalização</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Configure como o cliente pagará e receba o resumo financeiro.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="space-y-8">
        <div class="bg-gray-50 dark:bg-gray-900 p-6 md:p-8 rounded-[3rem] space-y-6 border border-gray-100 dark:border-gray-800">
          <h3 class="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Execução & Pagamento</h3>
          
          <div class="space-y-3">
            <BaseDateTimePicker 
              v-model="form.executionDate" 
              label="Data de Execução (Opcional)"
              description="Sincroniza com Google Agenda se conectado."
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <BaseInput v-model.number="form.paymentConfig.installments" label="Max. Parcelas" type="number" />
            <BaseInput v-model.number="form.paymentConfig.cashDiscount" label="Desc. À Vista (%)" type="number" />
          </div>

          <div class="space-y-3">
            <label class="block text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest ml-1">Método de Envio</label>
            <div role="radiogroup" aria-label="Método de Envio" class="flex flex-col sm:flex-row gap-2 p-1 bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800">
              <button 
                type="button"
                role="radio"
                :aria-checked="form.sendMethod === SendMethod.AUTO"
                @click="form.sendMethod = SendMethod.AUTO"
                :class="form.sendMethod === SendMethod.AUTO ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 outline-none'"
                class="flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
              >
                Auto (E-mail)
              </button>
              <button 
                type="button"
                role="radio"
                :aria-checked="form.sendMethod === SendMethod.MANUAL"
                @click="form.sendMethod = SendMethod.MANUAL"
                :class="form.sendMethod === SendMethod.MANUAL ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 outline-none'"
                class="flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
              >
                Manual (Link)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-8">
        <div class="bg-blue-600 text-white p-8 md:p-10 rounded-[3.5rem] shadow-2xl shadow-blue-200 dark:shadow-blue-950/50 relative overflow-hidden h-full flex flex-col justify-center">
          <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          
          <div class="relative z-10 space-y-6">
            <div class="flex justify-between items-center text-blue-100">
              <span class="text-[10px] font-black uppercase tracking-widest">Resumo Financeiro</span>
              <span class="bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Investimento Final</span>
            </div>

            <div class="space-y-3">
              <div class="flex justify-between text-sm opacity-80 border-b border-white/10 pb-2">
                <span>Subtotal (Itens)</span>
                <span>R$ {{ form.items.reduce((acc: any, i: any) => acc + (i.price * i.quantity), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs font-bold">Acréscimo R$</span>
                <input v-model.number="form.totals.additional" type="number" class="w-24 bg-white/10 border-none rounded-xl text-right font-black py-1 focus:ring-2 focus:ring-white/30 outline-none">
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs font-bold">Desconto R$</span>
                <input v-model.number="form.totals.discount" type="number" class="w-24 bg-white/10 border-none rounded-xl text-right font-black py-1 focus:ring-2 focus:ring-white/30 outline-none">
              </div>
            </div>

            <div class="pt-6 border-t border-white/20">
              <p class="text-4xl md:text-5xl font-black tracking-tighter">R$ {{ finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
              <p class="text-[10px] font-black uppercase tracking-widest mt-4 text-blue-100">
                À vista com {{ form.paymentConfig.cashDiscount }}% desc. ou {{ form.paymentConfig.installments }}x sem juros
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
