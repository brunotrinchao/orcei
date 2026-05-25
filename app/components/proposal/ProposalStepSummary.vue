<script setup lang="ts">
import { computed } from 'vue'
import { SendMethod } from '../../../types/enums'
import { User, Calendar, CreditCard, Mail, Link as LinkIcon, AlertCircle } from 'lucide-vue-next'

const props = defineProps<{
  form: any
  finalTotal: number
  clients: any[]
}>()

const selectedClient = computed(() => {
  return props.clients.find(c => c._id === props.form.client) || props.form.clientData
})

const getSendMethodLabel = (method: SendMethod) => {
  if (method === SendMethod.AUTO) return 'E-mail Automático'
  if (method === SendMethod.MANUAL) return 'Link Manual (WhatsApp/Outros)'
  return 'Não definido'
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div class="space-y-2">
      <h3 class="text-lg font-black text-gray-900 tracking-tight">Resumo do Orçamento</h3>
      <p class="text-sm text-gray-500 font-medium">Revise todos os detalhes antes de salvar ou enviar para o cliente.</p>
    </div>

    <!-- Overview Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- Cliente -->
      <div class="bg-gray-50 p-6 rounded-[2rem] space-y-4">
        <div class="flex items-center gap-3 text-blue-600">
          <User class="w-5 h-5" />
          <h4 class="text-[10px] font-black uppercase tracking-widest">Cliente</h4>
        </div>
        <div v-if="selectedClient" class="space-y-1">
          <p class="font-bold text-gray-900 text-sm truncate">{{ selectedClient.name }}</p>
          <p class="text-xs text-gray-500 truncate">{{ selectedClient.email || 'Sem e-mail' }}</p>
        </div>
        <div v-else class="flex items-center gap-2 text-red-500 text-xs font-bold">
          <AlertCircle class="w-4 h-4" /> Cliente não selecionado
        </div>
      </div>

      <!-- Execução -->
      <div class="bg-gray-50 p-6 rounded-[2rem] space-y-4">
        <div class="flex items-center gap-3 text-blue-600">
          <Calendar class="w-5 h-5" />
          <h4 class="text-[10px] font-black uppercase tracking-widest">Execução e Envio</h4>
        </div>
        <div class="space-y-1">
          <p class="font-bold text-gray-900 text-sm truncate">
            {{ form.executionDate ? new Date(form.executionDate).toLocaleDateString('pt-BR') : 'Data não definida' }}
          </p>
          <p class="text-xs text-gray-500 flex items-center gap-1">
            <Mail v-if="form.sendMethod === SendMethod.AUTO" class="w-3 h-3" />
            <LinkIcon v-else class="w-3 h-3" />
            {{ getSendMethodLabel(form.sendMethod) }}
          </p>
        </div>
      </div>

      <!-- Financeiro -->
      <div class="bg-blue-600 p-6 rounded-[2rem] space-y-4 text-white relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
        <div class="relative z-10 flex items-center gap-3 text-blue-100">
          <CreditCard class="w-5 h-5" />
          <h4 class="text-[10px] font-black uppercase tracking-widest">Valor Final</h4>
        </div>
        <div class="relative z-10 space-y-1">
          <p class="font-black text-2xl tracking-tighter">R$ {{ finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
          <p class="text-[10px] font-black uppercase tracking-widest text-blue-200 opacity-80">
            Até {{ form.paymentConfig.installments }}x ou {{ form.paymentConfig.cashDiscount }}% à vista
          </p>
        </div>
      </div>

    </div>

    <!-- Escopo -->
    <div class="bg-white border-2 border-gray-100 rounded-[2rem] overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Itens do Escopo ({{ form.items.length }})</h4>
      </div>
      <div class="divide-y divide-gray-100">
        <div v-for="(item, idx) in form.items" :key="idx" class="px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-gray-50/50 transition-colors">
          <div class="space-y-1">
            <p class="font-bold text-sm text-gray-900">{{ item.name }}</p>
            <p class="text-xs text-gray-500 line-clamp-1">{{ item.description || 'Sem descrição' }}</p>
          </div>
          <div class="flex items-center justify-between sm:justify-end gap-6 shrink-0">
            <span class="text-xs font-black text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">{{ item.quantity }}x</span>
            <span class="text-sm font-black text-gray-900">R$ {{ (item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
          </div>
        </div>
        <div v-if="form.items.length === 0" class="px-6 py-8 text-center text-sm font-bold text-red-500">
          Nenhum item adicionado ao escopo.
        </div>
      </div>
    </div>

    <!-- Opcionais -->
    <div v-if="form.upsellItems.length > 0" class="bg-white border-2 border-blue-50 rounded-[2rem] overflow-hidden">
      <div class="px-6 py-4 border-b border-blue-50 bg-blue-50/30">
        <h4 class="text-[10px] font-black text-blue-400 uppercase tracking-widest">Opcionais Ofertados ({{ form.upsellItems.length }})</h4>
      </div>
      <div class="divide-y divide-blue-50">
        <div v-for="(item, idx) in form.upsellItems" :key="idx" class="px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-blue-50/30 transition-colors">
          <div class="space-y-1">
            <p class="font-bold text-sm text-gray-900">{{ item.name }}</p>
            <p class="text-xs text-gray-500 line-clamp-1">{{ item.description || 'Sem descrição' }}</p>
          </div>
          <div class="flex items-center justify-between sm:justify-end gap-6 shrink-0">
            <span class="text-xs font-black text-blue-400 bg-blue-50 px-2 py-1 rounded-lg">{{ item.quantity }}x</span>
            <span class="text-sm font-black text-gray-900">+ R$ {{ (item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
