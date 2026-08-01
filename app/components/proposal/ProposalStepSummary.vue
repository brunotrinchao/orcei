<!-- app/components/proposal/ProposalStepSummary.vue -->
<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { SendMethod } from '../../../types/enums'
import { User, Calendar, CreditCard, Mail, Link as LinkIcon, AlertCircle, Sparkles, CheckCircle2, ShieldAlert, Circle } from 'lucide-vue-next'

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

// --- SCORE DE OTIMIZAÇÃO DA PROPOSTA (heurística transparente, não é predição estatística real) ---
// Cada critério abaixo é auditável: mostra exatamente o que foi avaliado, se
// foi atendido e, se não, o que ajustar — em vez de só um número solto.
const scopeHasDescriptions = computed(() => {
  const items = props.form.items || []
  return items.length > 0 && items.every((i: any) => i.description?.trim())
})

const priceInstallmentMismatch = computed(() =>
  props.finalTotal > 5000 && (props.form.paymentConfig?.installments || 1) < 4
)
const priceInstallmentGood = computed(() =>
  props.finalTotal > 2000 && (props.form.paymentConfig?.installments || 1) >= 4
)

const scoreCriteria = computed(() => {
  const upsellCount = props.form.upsellItems?.length || 0
  const cashDiscount = props.form.paymentConfig?.cashDiscount || 0

  return [
    {
      key: 'escopo',
      label: 'Escopo',
      met: scopeHasDescriptions.value,
      points: scopeHasDescriptions.value ? 5 : 0,
      detail: scopeHasDescriptions.value
        ? `${props.form.items.length} item(ns), todos com descrição preenchida`
        : 'Há item(ns) sem descrição preenchida',
      tip: scopeHasDescriptions.value ? null : 'Descrever cada item do escopo deixa claro pro cliente o que está incluso e reduz dúvidas.'
    },
    {
      key: 'prazo',
      label: 'Prazo',
      met: !!props.form.executionDate,
      points: props.form.executionDate ? 5 : 0,
      detail: props.form.executionDate ? 'Data de execução definida' : 'Sem data de execução prevista',
      tip: props.form.executionDate ? null : 'Definir uma data de previsão de entrega reduz a ansiedade do cliente e passa segurança.'
    },
    {
      key: 'opcoes',
      label: 'Opções',
      met: upsellCount > 0,
      points: upsellCount > 0 ? 6 : 0,
      detail: upsellCount > 0 ? `${upsellCount} opcional(is) ofertado(s)` : 'Nenhum opcional (upsell) ofertado',
      tip: upsellCount > 0 ? null : 'Oferecer 1 ou 2 serviços opcionais (upsells) eleva o faturamento médio e dá opções ao cliente.'
    },
    {
      key: 'preco',
      label: 'Preço x Parcelamento',
      met: !priceInstallmentMismatch.value,
      points: priceInstallmentMismatch.value ? -12 : (priceInstallmentGood.value ? 5 : 0),
      detail: priceInstallmentMismatch.value
        ? `Valor de R$ ${props.finalTotal.toLocaleString('pt-BR')} com poucas parcelas (${props.form.paymentConfig?.installments || 1}x)`
        : 'Parcelamento coerente com o valor total',
      tip: priceInstallmentMismatch.value ? 'Para projetos acima de R$ 5.000,00, oferecer parcelamento em até 6x facilita a decisão do cliente.' : null
    },
    {
      key: 'condicoes',
      label: 'Condições de Pagamento',
      met: cashDiscount >= 5,
      points: cashDiscount >= 5 ? 8 : 0,
      detail: cashDiscount >= 5 ? `${cashDiscount}% de desconto à vista` : 'Sem desconto à vista',
      tip: cashDiscount >= 5 ? null : 'Adicionar um desconto à vista de pelo menos 5% estimula o pagamento rápido.'
    },
    {
      key: 'dadosCliente',
      label: 'Dados do Cliente',
      met: !!props.form.client?.phone,
      points: props.form.client?.phone ? 4 : 0,
      detail: props.form.client?.phone ? 'Telefone/WhatsApp informado' : 'Sem telefone/WhatsApp informado',
      tip: props.form.client?.phone ? null : 'Adicionar o telefone/WhatsApp do cliente facilita o contato e o follow-up.'
    }
  ]
})

const score = computed(() => {
  const base = 75 + scoreCriteria.value.reduce((acc, c) => acc + c.points, 0)
  return Math.min(98, Math.max(45, base))
})

const metCriteriaCount = computed(() => scoreCriteria.value.filter(c => c.met).length)
const totalCriteriaCount = computed(() => scoreCriteria.value.length)

const scoreLabel = computed(() => `${metCriteriaCount.value} de ${totalCriteriaCount.value} critérios otimizados`)

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
    <div class="p-6 bg-gradient-to-br from-violet-500/[0.03] to-fuchsia-500/[0.03] border-2 border-violet-100/50 dark:border-violet-900/20 rounded-[0.75rem] grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
      <div class="md:col-span-1 flex flex-col items-center justify-center text-center p-4 bg-white dark:bg-gray-900 rounded-[0.75rem] border border-violet-100/30 dark:border-violet-900/30 shadow-sm relative overflow-hidden">
        <!-- Glowing aura atrás da nota -->
        <div class="absolute -top-10 -left-10 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <span class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-2">Score IA</span>
        
        <div class="relative w-20 h-20 rounded-full border-4 border-slate-50 dark:border-gray-800 flex items-center justify-center">
          <!-- Círculo semi-transparente interno -->
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
          <h4 class="text-xs font-black uppercase tracking-widest">Como esse score foi calculado</h4>
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
      <div class="bg-gray-50 dark:bg-gray-900 p-6 rounded-[0.75rem] space-y-4 border border-gray-100 dark:border-gray-800">
        <div class="flex items-center gap-3 text-blue-600 dark:text-blue-400">
          <User class="w-5 h-5" />
          <h4 class="text-[10px] font-black uppercase tracking-widest">Cliente</h4>
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
      <div class="bg-gray-50 dark:bg-gray-900 p-6 rounded-[0.75rem] space-y-4 border border-gray-100 dark:border-gray-800">
        <div class="flex items-center gap-3 text-blue-600 dark:text-blue-400">
          <Calendar class="w-5 h-5" />
          <h4 class="text-[10px] font-black uppercase tracking-widest">Execução e Envio</h4>
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
      <div class="bg-blue-600 p-6 rounded-[0.75rem] space-y-4 border border-gray-100 dark:border-gray-800">
        <div class="relative z-10 flex items-center gap-3 text-blue-100">
          <CreditCard class="w-5 h-5" />
          <h4 class="text-[10px] font-black uppercase tracking-widest">Execução e Envio</h4>
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
    <div class="bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-[0.75rem] overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50">
        <h4 class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Itens do Escopo ({{ form.items.length }})</h4>
      </div>
      <div class="divide-y divide-gray-100 dark:divide-gray-800">
        <div v-for="(item, idx) in form.items" :key="idx" class="px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
          <div class="space-y-1">
            <p class="font-bold text-sm text-gray-900 dark:text-gray-50">{{ item.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{{ item.description || 'Sem descrição' }}</p>
          </div>
          <div class="flex items-center justify-between sm:justify-end gap-6 shrink-0">
            <span class="text-xs font-black text-gray-400 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-[0.3rem]">{{ item.quantity }}x</span>
            <span class="text-sm font-black text-gray-900 dark:text-gray-50">R$ {{ (item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
          </div>
        </div>
        <div v-if="form.items.length === 0" class="px-6 py-8 text-center text-sm font-bold text-red-500">
          Nenhum item adicionado ao escopo.
        </div>
      </div>
    </div>

    <!-- Opcionais -->
    <div v-if="form.upsellItems.length > 0" class="bg-white dark:bg-gray-900 border-2 border-blue-50 dark:border-blue-900/40 rounded-[0.75rem] overflow-hidden">
      <div class="px-6 py-4 border-b border-blue-50 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/30">
        <h4 class="text-[10px] font-black text-blue-400 dark:text-blue-400 uppercase tracking-widest">Opcionais Ofertados ({{ form.upsellItems.length }})</h4>
      </div>
      <div class="divide-y divide-blue-50 dark:divide-blue-900/40">
        <div v-for="(item, idx) in form.upsellItems" :key="idx" class="px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-colors">
          <div class="space-y-1">
            <p class="font-bold text-sm text-gray-900 dark:text-gray-50">{{ item.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{{ item.description || 'Sem descrição' }}</p>
          </div>
          <div class="flex items-center justify-between sm:justify-end gap-6 shrink-0">
            <span class="text-xs font-black text-blue-400 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-1 rounded-[0.3rem]">{{ item.quantity }}x</span>
            <span class="text-sm font-black text-gray-900 dark:text-gray-50">+ R$ {{ (item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
