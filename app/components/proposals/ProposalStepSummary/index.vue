<script setup lang="ts">
import { computed } from 'vue'
import { useProposalStepSummary } from './index'

const props = withDefaults(defineProps<{
  form: any
  finalTotal: number
  clients: any[]
  initialExpiresAt?: string | null
  validityDays?: number
}>(), {
  initialExpiresAt: null,
  validityDays: 7
})

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
  Circle,
  Clock
} = useProposalStepSummary(props)

/**
 * Data de expiração exibida no resumo.
 * Rascunho ainda não enviado → mostra a previsão (envio hoje + validade).
 * Já enviado/em edição → usa expiresAt original (server recalcula ao enviar).
 */
const isDraft = computed(() => props.form.status === 'draft')
const expirationDate = computed(() => {
  const base = props.initialExpiresAt && !isDraft.value
    ? new Date(props.initialExpiresAt)
    : new Date(Date.now() + (props.validityDays || 7) * 24 * 60 * 60 * 1000)
  return base.toLocaleDateString('pt-BR')
})
</script>

<template>
  <div class="space-y-6 pb-20 proposal-step-summary-container">
    <!-- Cabeçalho -->
    <div class="space-y-1 px-3">
      <h3 class="text-lg font-bold text-gray-900 dark:text-gray-50 tracking-tight">Resumo do Orçamento</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400">Revise todos os detalhes antes de salvar ou enviar para o cliente.</p>
    </div>

    <!-- Score IA -->
    <div class="rounded-[.5rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-8 h-8 rounded-[.5rem] bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 flex items-center justify-center shrink-0">
          <Sparkles class="w-4 h-4" />
        </div>
        <div>
          <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Score de Conversão IA</h4>
          <p class="text-xs text-gray-500 dark:text-gray-400">Previsão de aceite baseada nos dados da proposta</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-5 items-center">
        <div class="md:col-span-1 flex flex-col items-center justify-center text-center">
          <div class="relative w-20 h-20 rounded-full border-4 border-gray-100 dark:border-gray-800 flex items-center justify-center">
            <div class="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center leading-none">
              <span class="text-2xl font-bold tracking-tighter text-gray-900 dark:text-gray-50">{{ score }}</span>
              <span class="text-[9px] font-medium text-gray-400 uppercase tracking-widest mt-0.5">/100</span>
            </div>
          </div>
          <span
            class="mt-2.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-center"
            :class="getScoreColor(score)"
          >
            {{ scoreLabel }}
          </span>
        </div>

        <div class="md:col-span-3 space-y-2.5">
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400">Como o score é calculado:</p>
          <ul class="space-y-2">
            <li v-for="c in scoreCriteria" :key="c.key" class="flex items-start gap-2.5">
              <div
                class="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                :class="c.met ? 'bg-emerald-100 dark:bg-emerald-950/50' : 'bg-gray-100 dark:bg-gray-800'"
              >
                <CheckCircle2 v-if="c.met" class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <Circle v-else class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
              </div>
              <div class="text-xs leading-relaxed">
                <span class="font-semibold text-gray-700 dark:text-gray-200">{{ c.label }}:</span>
                <span class="text-gray-500 dark:text-gray-400 font-medium ml-1">{{ c.detail }}</span>
                <p v-if="c.tip" class="text-gray-400 dark:text-gray-500 mt-0.5">{{ c.tip }}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Overview -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div class="rounded-[.5rem] border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 p-4">
        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
          <User class="w-3.5 h-3.5" /> Cliente
        </span>
        <template v-if="selectedClient">
          <p class="mt-1.5 font-semibold text-gray-900 dark:text-gray-50 text-sm truncate">{{ selectedClient.name }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ selectedClient.email || 'Sem e-mail' }}</p>
        </template>
        <div v-else class="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <AlertCircle class="w-3.5 h-3.5" /> Cliente não selecionado
        </div>
      </div>

      <div class="rounded-[.5rem] border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 p-4">
        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
          <Calendar class="w-3.5 h-3.5" /> Execução e Envio
        </span>
        <p class="mt-1.5 font-semibold text-gray-900 dark:text-gray-50 text-sm truncate">
          {{ form.executionDate ? new Date(form.executionDate).toLocaleDateString('pt-BR') : 'Data não definida' }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Mail v-if="form.sendMethod === SendMethod.AUTO" class="w-3 h-3" />
          <LinkIcon v-else class="w-3 h-3" />
          {{ getSendMethodLabel(form.sendMethod) }}
        </p>
        <p class="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <Clock class="w-3.5 h-3.5" />
          {{ isDraft ? 'Válido até' : 'Expira em' }} {{ expirationDate }}
        </p>
      </div>

      <div class="rounded-[.5rem] bg-indigo-600 p-4">
        <span class="text-[10px] font-black text-indigo-200 uppercase tracking-widest flex items-center gap-1.5">
          <CreditCard class="w-3.5 h-3.5" /> Financeiro
        </span>
        <p class="mt-1.5 font-black text-white text-2xl tracking-tight">R$ {{ finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
        <p class="text-[10px] font-bold uppercase tracking-widest text-indigo-200 mt-1">
          Até {{ form.paymentConfig.installments }}x ou {{ form.paymentConfig.cashDiscount }}% à vista
        </p>
      </div>
    </div>

    <!-- Itens do Escopo -->
    <div class="rounded-[.5rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div class="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
        <h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-[0.18em]">Itens do Escopo</h4>
        <span class="text-[10px] font-black text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{{ form.items.length }}</span>
      </div>
      <div class="divide-y divide-gray-100 dark:divide-gray-800">
        <div v-for="(item, idx) in form.items" :key="idx" class="px-5 py-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
          <div class="space-y-0.5 min-w-0">
            <p class="font-semibold text-sm text-gray-900 dark:text-gray-50 truncate">{{ item.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{{ item.description || 'Sem descrição' }}</p>
          </div>
          <div class="flex items-center justify-between sm:justify-end gap-5 shrink-0">
            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-[.5rem]">{{ item.quantity }}x</span>
            <span class="text-sm font-bold text-gray-900 dark:text-gray-50">R$ {{ (item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
          </div>
        </div>
        <div v-if="form.items.length === 0" class="px-5 py-6 text-center text-xs font-semibold text-red-500">
          Nenhum item adicionado ao escopo.
        </div>
      </div>
    </div>

    <!-- Opcionais -->
    <div v-if="form.upsellItems.length > 0" class="rounded-[.5rem] border border-blue-100 dark:border-blue-900/40 bg-white dark:bg-gray-900 overflow-hidden">
      <div class="px-5 py-3.5 border-b border-blue-100 dark:border-blue-900/40 flex items-center justify-between gap-3">
        <h4 class="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-[0.18em]">Opcionais Ofertados</h4>
        <span class="text-[10px] font-black text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full">{{ form.upsellItems.length }}</span>
      </div>
      <div class="divide-y divide-blue-50 dark:divide-blue-900/40">
        <div v-for="(item, idx) in form.upsellItems" :key="idx" class="px-5 py-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-colors">
          <div class="space-y-0.5 min-w-0">
            <p class="font-semibold text-sm text-gray-900 dark:text-gray-50 truncate">{{ item.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{{ item.description || 'Sem descrição' }}</p>
          </div>
          <div class="flex items-center justify-between sm:justify-end gap-5 shrink-0">
            <span class="text-xs font-semibold text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-[.5rem]">{{ item.quantity }}x</span>
            <span class="text-sm font-bold text-gray-900 dark:text-gray-50">+ R$ {{ (item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./index.css"></style>