<script setup lang="ts">
import { useProposalStepSummary } from './index'

const props = defineProps<{
  form: any
  finalTotal: number
  clients: any[]
}>()

const {
  selectedClient,
  getSendMethodLabel,
  scoreCriteria,
  score,
  scoreLabel,
  getScoreColor,
  SendMethod,
  User,
  Calendar,
  CreditCard,
  Mail,
  LinkIcon,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Circle
} = useProposalStepSummary(props)
</script>

<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 proposal-step-summary-container">
    <div class="space-y-2 px-3">
      <h3 class="text-lg font-black text-gray-900 dark:text-white tracking-tight">Resumo do Orçamento</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Revise todos os detalhes antes de salvar ou enviar para o cliente.</p>
    </div>

    <!-- AI CONVERSION PREDICTOR SCORE -->
    <div class="p-6 bg-gradient-to-br from-violet-500/[0.03] to-fuchsia-500/[0.03] border-2 border-violet-100/50 dark:border-violet-900/20 rounded-[.5rem] grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
      <div class="md:col-span-1 flex flex-col items-center justify-center text-center p-4 bg-white dark:bg-gray-900 rounded-[.5rem] border border-violet-100/30 dark:border-violet-900/30 shadow-sm relative overflow-hidden">
        <div class="absolute -top-10 -left-10 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <span class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-2">Score IA</span>
        
        <div class="relative w-20 h-20 rounded-full border-4 border-slate-50 dark:border-gray-800 flex items-center justify-center">
          <div class="w-16 h-16 rounded-full bg-slate-50/50 dark:bg-gray-950/60 flex flex-col items-center justify-center leading-none">
            <span class="text-3xl font-black tracking-tighter text-slate-900 dark:text-gray-50">{{ score }}</span>
            <span class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">/100</span>
          </div>
        </div>
        
        <span
          class="mt-3 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border text-center"
          :class="getScoreColor(score)"
        >
          {{ scoreLabel }}
        </span>
      </div>

      <div class="md:col-span-3 space-y-3">
        <div class="flex items-center gap-2 text-violet-700 dark:text-violet-400">
          <Sparkles class="w-4 h-4 shrink-0 text-violet-600 dark:text-violet-400" />
          <h4 class="section-title">Como esse score foi calculated</h4>
        </div>

        <ul class="space-y-2.5">
          <li v-for="c in scoreCriteria" :key="c.key" class="flex items-start gap-3">
            <div
              class="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              :class="c.met ? 'bg-emerald-100 dark:bg-emerald-950/50' : 'bg-gray-100 dark:bg-gray-800'"
            >
              <CheckCircle2 v-if="c.met" class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <Circle v-else class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            </div>
            <div class="text-xs leading-relaxed">
              <span class="font-black text-slate-700 dark:text-slate-200">{{ c.label }}:</span>
              <span class="text-slate-600 dark:text-slate-300 font-bold ml-1">{{ c.detail }}</span>
              <p v-if="c.tip" class="text-slate-500 dark:text-slate-400 font-medium mt-0.5">{{ c.tip }}</p>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Overview Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- Cliente -->
      <div class="bg-gray-50 dark:bg-gray-900 p-6 rounded-[.5rem] space-y-4 border border-gray-100 dark:border-gray-800">
        <div class="flex items-center gap-3 text-blue-600 dark:text-blue-400">
          <User class="w-5 h-5" />
          <h4 class="section-title">Cliente</h4>
        </div>
        <div v-if="selectedClient" class="space-y-1">
          <p class="font-bold text-gray-900 dark:text-gray-50 text-sm truncate">{{ selectedClient.name }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ selectedClient.email || 'Sem e-mail' }}</p>
        </div>
        <div class="flex items-center gap-2 text-red-500 text-xs font-bold" v-else>
          <AlertCircle class="w-4 h-4" /> Cliente não selecionado
        </div>
      </div>

      <!-- Execução -->
      <div class="bg-gray-50 dark:bg-gray-900 p-6 rounded-[.5rem] space-y-4 border border-gray-100 dark:border-gray-800">
        <div class="flex items-center gap-3 text-blue-600 dark:text-blue-400">
          <Calendar class="w-5 h-5" />
          <h4 class="section-title">Execução e Envio</h4>
        </div>
        <div class="space-y-1">
          <p class="font-bold text-gray-900 dark:text-gray-50 text-sm truncate">
            {{ form.executionDate ? new Date(form.executionDate).toLocaleDateString('pt-BR') : 'Data não definida' }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Mail v-if="form.sendMethod === SendMethod.AUTO" class="w-3 h-3" />
            <LinkIcon v-else class="w-3 h-3" />
            {{ getSendMethodLabel(form.sendMethod) }}
          </p>
        </div>
      </div>

      <!-- Financeiro -->
      <div class="bg-blue-600 p-6 rounded-[.5rem] space-y-4 border border-gray-100 dark:border-gray-800">
        <div class="relative z-10 flex items-center gap-3 text-blue-100">
          <CreditCard class="w-5 h-5" />
          <h4 class="section-title">Execução e Envio</h4>
        </div>
        <div class="relative z-10 space-y-0">
          <p class="font-black text-2xl tracking-tighter">R$ {{ finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
          <p class="text-[10px] font-black uppercase tracking-widest text-blue-200 opacity-80">
            Até {{ form.paymentConfig.installments }}x ou {{ form.paymentConfig.cashDiscount }}% à vista
          </p>
        </div>
      </div>

    </div>

    <!-- Escopo -->
    <div class="bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-[.5rem] overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50">
        <h4 class="section-title">Itens do Escopo ({{ form.items.length }})</h4>
      </div>
      <div class="divide-y divide-gray-100 dark:divide-gray-800">
        <div v-for="(item, idx) in form.items" :key="idx" class="px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
          <div class="space-y-1">
            <p class="font-bold text-sm text-gray-900 dark:text-gray-50">{{ item.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{{ item.description || 'Sem descrição' }}</p>
          </div>
          <div class="flex items-center justify-between sm:justify-end gap-6 shrink-0">
            <span class="text-xs font-black text-gray-400 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-[.5rem]">{{ item.quantity }}x</span>
            <span class="text-sm font-black text-gray-900 dark:text-gray-50">R$ {{ (item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
          </div>
        </div>
        <div v-if="form.items.length === 0" class="px-6 py-8 text-center text-sm font-bold text-red-500">
          Nenhum item adicionado ao escopo.
        </div>
      </div>
    </div>

    <!-- Opcionais -->
    <div v-if="form.upsellItems.length > 0" class="bg-white dark:bg-gray-900 border-2 border-blue-50 dark:border-blue-900/40 rounded-[.5rem] overflow-hidden">
      <div class="px-6 py-4 border-b border-blue-50 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/30">
        <h4 class="section-title">Opcionais Ofertados ({{ form.upsellItems.length }})</h4>
      </div>
      <div class="divide-y divide-blue-50 dark:divide-blue-900/40">
        <div v-for="(item, idx) in form.upsellItems" :key="idx" class="px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-colors">
          <div class="space-y-1">
            <p class="font-bold text-sm text-gray-900 dark:text-gray-50">{{ item.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{{ item.description || 'Sem descrição' }}</p>
          </div>
          <div class="flex items-center justify-between sm:justify-end gap-6 shrink-0">
            <span class="text-xs font-black text-blue-400 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-1 rounded-[.5rem]">{{ item.quantity }}x</span>
            <span class="text-sm font-black text-gray-900 dark:text-gray-50">+ R$ {{ (item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped src="./index.css"></style>
