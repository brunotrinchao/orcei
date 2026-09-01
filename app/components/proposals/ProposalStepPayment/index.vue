<script setup lang="ts">
import { useProposalStepPayment } from './index'

defineProps<{
  form: any
  finalTotal: number
}>()

const { SendMethod, CreditCard } = useProposalStepPayment()
</script>

<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 proposal-step-payment-container">

    <div class="grid grid-cols-1 gap-4">
      <div class="space-y-8">
        <div>
          <div class="space-y-6">
            <div class="space-y-3">
              <BaseDateTimePicker 
                v-model="form.executionDate" 
                label="Data de Execução (Opcional)"
                description="Sincroniza com Google Agenda se conectado."
              />
            </div>

            <!-- Opção de Cartão de Crédito -->
            <div class="p-3.5 rounded-[.5rem] border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 space-y-3">
              <div 
                class="flex items-center justify-between cursor-pointer select-none"
                @click="form.paymentConfig.acceptCreditCard = !form.paymentConfig.acceptCreditCard"
              >
                <div>
                  <label class="text-xs font-bold text-gray-900 dark:text-white block cursor-pointer">Aceitar Cartão de Crédito</label>
                  <p class="text-[11px] text-gray-500">Permite pagamento parcelado no cartão de crédito</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer pointer-events-none">
                  <input type="checkbox" :checked="Boolean(form.paymentConfig.acceptCreditCard)" class="sr-only peer">
                  <div class="w-10 h-5.5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div v-if="form.paymentConfig.acceptCreditCard" class="pt-2 border-t border-gray-200 dark:border-gray-800">
                <BaseInput v-model.number="form.paymentConfig.installments" label="Max. Parcelas (Cartão)" type="number" />
              </div>
            </div>

            <div class="space-y-3">
              <BaseInput v-model.number="form.paymentConfig.cashDiscount" label="Desc. À Vista (%)" type="number" />
            </div>

            <div class="space-y-3">
              <label class="form-label block mb-1.5 ml-1">Método de Envio</label>
              <div role="radiogroup" aria-label="Método de Envio" class="flex flex-col sm:flex-row gap-2 p-1 bg-white dark:bg-gray-950 rounded-[.5rem] border border-gray-200 dark:border-gray-800">
                <BaseButton 
                  type="button"
                  role="radio"
                  :aria-checked="form.sendMethod === SendMethod.AUTO"
                  @click="form.sendMethod = SendMethod.AUTO"
                  :variant="form.sendMethod === SendMethod.AUTO ? 'primary' : 'ghost'"
                  size="sm"
                  class="flex-1 py-3"
                >
                  Auto (E-mail)
                </BaseButton>
                <BaseButton 
                  type="button"
                  role="radio"
                  :aria-checked="form.sendMethod === SendMethod.MANUAL"
                  @click="form.sendMethod = SendMethod.MANUAL"
                  :variant="form.sendMethod === SendMethod.MANUAL ? 'primary' : 'ghost'"
                  size="sm"
                  class="flex-1 py-3"
                >
                  Manual (Link)
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-8">
        <BaseCard compact class="!bg-blue-600 !text-white">
        <div class="relative z-10 space-y-6">
            <div class="flex justify-between items-center !text-white">
              <span class="section-title !text-white">Resumo Financeiro</span>
              <span class="bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Investimento Final</span>
            </div>

            <div class="space-y-3">
              <div class="flex justify-between text-sm opacity-80 border-b border-white/10 pb-2">
                <span>Subtotal (Itens)</span>
                <span>R$ {{ form.items.reduce((acc: any, i: any) => acc + (i.price * i.quantity), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs font-bold">Acréscimo R$</span>
                <input v-model.number="form.totals.additional" type="number" class="w-24 bg-white/10 border-none rounded-[.5rem] text-right font-black py-1 focus:ring-2 focus:ring-white/30 outline-none">
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs font-bold">Desconto R$</span>
                <input v-model.number="form.totals.discount" type="number" class="w-24 bg-white/10 border-none rounded-[.5rem] text-right font-black py-1 focus:ring-2 focus:ring-white/30 outline-none">
              </div>
            </div>

            <div class="pt-6 border-t border-white/20">
              <p class="text-4xl md:text-5xl font-black tracking-tighter">R$ {{ finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
              <p class="text-[10px] font-black uppercase tracking-widest mt-4 text-blue-100">
                À vista com {{ form.paymentConfig.cashDiscount }}% desc. ou {{ form.paymentConfig.installments }}x sem juros
              </p>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>

<style scoped src="./index.css"></style>
