<!-- app/components/proposal/ProposalStepSummary.vue -->
<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { SendMethod } from '../../../types/enums'
import { User, Calendar, CreditCard, Mail, Link as LinkIcon, AlertCircle, Sparkles, TrendingUp, CheckCircle2, ShieldAlert } from 'lucide-vue-next'

const props = defineProps<{
  form: any
  finalTotal: number
  clients: any[]
}>()

const selectedClient = computed(() => {
  return props.form.client?.name ? props.form.client : null
})

const getSendMethodLabel = (method: SendMethod) => {
  if (method === SendMethod.AUTO) return 'E-mail Automático'
  if (method === SendMethod.MANUAL) return 'Link Manual (WhatsApp/Outros)'
  return 'Não definido'
}

// --- CONVERSION PREDICTOR SCORE POR IA (HEURÍSTICA INTELIGENTE DINÂMICA) ---
const score = computed(() => {
  let baseScore = 75
  
  // Influência do Valor vs Parcelamento
  if (props.finalTotal > 5000 && (props.form.paymentConfig?.installments || 1) < 4) {
    baseScore -= 12
  } else if (props.finalTotal > 2000 && (props.form.paymentConfig?.installments || 1) >= 4) {
    baseScore += 5
  }
  
  // Influência de Descontos
  if ((props.form.paymentConfig?.cashDiscount || 0) >= 5) {
    baseScore += 8
  }
  
  // Influência de Opcionais (Upsells)
  if (props.form.upsellItems?.length > 0) {
    baseScore += 6
  }
  
  // Enriquecimento de Informações de Contato
  if (props.form.client?.phone) {
    baseScore += 4
  }
  
  // Data de Execução
  if (props.form.executionDate) {
    baseScore += 5
  }
  
  return Math.min(98, Math.max(45, baseScore))
})

const scoreTips = computed(() => {
  const tips = []
  
  if (props.finalTotal > 5000 && (props.form.paymentConfig?.installments || 1) < 4) {
    tips.push('Para projetos acima de R$ 5.000,00, oferecer parcelamento em até 6x aumenta a conversão em 42%.')
  }
  
  if ((props.form.paymentConfig?.cashDiscount || 0) < 5) {
    tips.push('Adicionar um desconto à vista de pelo menos 5% estimula o pagamento rápido.')
  }
  
  if (!props.form.upsellItems || props.form.upsellItems.length === 0) {
    tips.push('Oferecer 1 ou 2 serviços opcionais (upsells) eleva o faturamento médio e dá opções ao cliente.')
  }
  
  if (!props.form.executionDate) {
    tips.push('Definir uma data de previsão de entrega reduz a ansiedade do cliente e passa segurança.')
  }
  
  if (tips.length === 0) {
    tips.push('Sua proposta está perfeita! Adicione "7 dias de garantia pós-entrega" para zerar as objeções do cliente.')
  }
  
  return tips.slice(0, 2) // Retorna no máximo as 2 dicas mais relevantes
})

const getScoreColor = (val: number) => {
  if (val >= 85) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30'
  if (val >= 70) return 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'
  return 'text-red-500 bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30'
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
    <div class="space-y-2">
      <h3 class="text-lg font-black text-gray-900 dark:text-white tracking-tight">Resumo do Orçamento</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Revise todos os detalhes antes de salvar ou enviar para o cliente.</p>
    </div>

    <!-- AI CONVERSION PREDICTOR SCORE (Premium AI Widget) -->
    <div class="p-6 bg-gradient-to-br from-violet-500/[0.03] to-fuchsia-500/[0.03] border-2 border-violet-100/50 dark:border-violet-900/20 rounded-[2rem] grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
      <div class="md:col-span-1 flex flex-col items-center justify-center text-center p-4 bg-white dark:bg-slate-950 rounded-3xl border border-violet-100/30 shadow-sm relative overflow-hidden">
        <!-- Glowing aura atrás da nota -->
        <div class="absolute -top-10 -left-10 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <span class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-2">Score IA</span>
        
        <div class="relative w-20 h-20 rounded-full border-4 border-slate-50 flex items-center justify-center">
          <!-- Círculo semi-transparente interno -->
          <div class="w-16 h-16 rounded-full bg-slate-50/50 flex flex-col items-center justify-center leading-none">
            <span class="text-3xl font-black tracking-tighter text-slate-900">{{ score }}</span>
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">/100</span>
          </div>
        </div>
        
        <span 
          class="mt-3 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border"
          :class="getScoreColor(score)"
        >
          {{ score >= 85 ? 'Conversão Alta' : score >= 70 ? 'Conversão Média' : 'Conversão Baixa' }}
        </span>
      </div>

      <div class="md:col-span-3 space-y-4">
        <div class="flex items-center gap-2 text-violet-700">
          <Sparkles class="w-4 h-4 shrink-0 text-violet-600 animate-pulse" />
          <h4 class="text-xs font-black uppercase tracking-widest">Dicas de Negociação da IA</h4>
        </div>
        
        <ul class="space-y-3">
          <li v-for="(tip, idx) in scoreTips" :key="idx" class="flex items-start gap-3">
            <div class="w-5 h-5 rounded-lg bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
              <TrendingUp class="w-3.5 h-3.5 text-violet-600" />
            </div>
            <p class="text-xs text-slate-600 dark:text-slate-400 font-bold leading-relaxed">
              {{ tip }}
            </p>
          </li>
        </ul>
      </div>
    </div>

    <!-- Overview Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- Cliente -->
      <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-[2rem] space-y-4">
        <div class="flex items-center gap-3 text-blue-600">
          <User class="w-5 h-5" />
          <h4 class="text-[10px] font-black uppercase tracking-widest">Cliente</h4>
        </div>
        <div v-if="selectedClient" class="space-y-1">
          <p class="font-bold text-gray-900 text-sm truncate">{{ selectedClient.name }}</p>
          <p class="text-xs text-gray-500 truncate">{{ selectedClient.email || 'Sem e-mail' }}</p>
        </div>
        <div class="flex items-center gap-2 text-red-500 text-xs font-bold" v-else>
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
