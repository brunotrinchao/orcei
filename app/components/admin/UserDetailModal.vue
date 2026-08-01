<script setup lang="ts">
import { ref, watch } from 'vue'
import { User, Loader2 } from 'lucide-vue-next'
import { useVModel } from '@vueuse/core'

const props = defineProps<{
  open: boolean
  userId: string | null
}>()

const emits = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const open = useVModel(props, 'open', emits)
const { notify } = useAlerts()

const loading = ref(false)
const data = ref<any>(null)

async function load(id: string) {
  loading.value = true
  data.value = null
  try {
    data.value = await $fetch(`/api/admin/users/${id}/details`)
  } catch (e: any) {
    notify('Erro', e.data?.statusMessage || 'Erro ao carregar detalhes do usuário')
    open.value = false
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.open, props.userId] as const,
  ([isOpen, id]) => {
    if (isOpen && id) load(id)
    if (!isOpen) data.value = null
  }
)

const PROVIDER_LABELS: Record<string, string> = {
  gemini: 'Gemini',
  deepseek: 'DeepSeek',
  cloudflare: 'Cloudflare',
  openrouter: 'OpenRouter'
}

const ACTION_LABELS: Record<string, string> = {
  proposalSuggest: 'Sugestão de Orçamento',
  catalogSuggest: 'Sugestão de Catálogo',
  clientExtract: 'Extração de Lead',
  generate: 'Geração de Texto',
  analyzeReport: 'Relatório Estratégico'
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  pending: 'Pendente',
  accepted: 'Aceita',
  expired: 'Expirada',
  created: 'Criada',
  sent: 'Enviada',
  delivered: 'Entregue',
  opened: 'Aberta',
  clicked: 'Clicada',
  bounced: 'Devolvida',
  viewed: 'Visualizada',
  scheduled: 'Agendada',
  received: 'Recebida',
  delayed: 'Atrasada',
  failed: 'Falhou',
  suppressed: 'Suprimida'
}

function providerLabel(p: string) {
  return PROVIDER_LABELS[p] || p
}

function actionLabel(a: string | null) {
  if (!a) return '—'
  return ACTION_LABELS[a] || a
}

function statusLabel(s: string) {
  return STATUS_LABELS[s] || s
}

function statusVariant(s: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  if (s === 'accepted') return 'success'
  if (['expired', 'bounced', 'failed', 'suppressed'].includes(s)) return 'error'
  if (['pending', 'delayed', 'scheduled'].includes(s)) return 'warning'
  if (['sent', 'delivered', 'opened', 'clicked', 'viewed', 'received', 'created'].includes(s)) return 'info'
  return 'default'
}

function formatUsd(v: number) {
  return `$${(v || 0).toFixed(4)}`
}

function formatInt(v: number) {
  return new Intl.NumberFormat('pt-BR').format(v || 0)
}

function formatBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR')
}

function planVariant(plan: string): 'default' | 'success' | 'info' {
  if (plan === 'premium') return 'success'
  if (plan === 'starter') return 'info'
  return 'default'
}
</script>

<template>
  <BaseDialog v-model:open="open" title="Detalhes do Usuário" size="xl">
    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 class="w-8 h-8 text-blue-500 animate-spin" />
      <p class="text-xs font-black text-gray-400 uppercase tracking-widest">Carregando detalhes...</p>
    </div>

    <div v-else-if="data" class="space-y-6 py-2">
      <!-- 1. Cabeçalho -->
      <section class="flex items-center gap-4 p-5 rounded-[0.75rem] border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50">
        <div class="w-14 h-14 rounded-xl bg-white dark:bg-gray-900 flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm overflow-hidden flex-shrink-0">
          <img v-if="data.profile.avatar" :src="data.profile.avatar" class="w-full h-full object-cover" loading="lazy">
          <User v-else class="w-7 h-7 text-gray-300 dark:text-gray-600" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-black text-gray-900 dark:text-gray-100 leading-tight truncate">{{ data.profile.name }}</p>
          <p class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest truncate mt-0.5">{{ data.profile.email }}</p>
          <div class="flex items-center gap-2 mt-2">
            <BaseBadge :variant="planVariant(data.profile.subscriptionPlan)">
              {{ (data.profile.subscriptionPlan || 'free').toUpperCase() }}
            </BaseBadge>
            <BaseBadge :variant="data.profile.role === 'admin' ? 'error' : 'default'">
              {{ (data.profile.role || 'user').toUpperCase() }}
            </BaseBadge>
            <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500">Desde {{ formatDate(data.profile.createdAt) }}</span>
          </div>
        </div>
      </section>

      <!-- 2. Uso da aplicação -->
      <section class="space-y-3">
        <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Uso da Aplicação</h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div v-for="stat in [
            { label: 'Relatórios', value: data.profile.aiUsage?.reports },
            { label: 'Orçamentos', value: data.profile.aiUsage?.proposals },
            { label: 'Catálogo', value: data.profile.aiUsage?.catalog },
            { label: 'Leads', value: data.profile.aiUsage?.leads },
            { label: 'Saldo de Créditos', value: data.profile.creditsBalance },
            { label: 'Créditos Usados', value: data.profile.creditsUsed }
          ]" :key="stat.label" class="p-4 rounded-[0.75rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <p class="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">{{ stat.label }}</p>
            <p class="text-lg font-black text-gray-900 dark:text-white mt-1">{{ formatInt(stat.value || 0) }}</p>
          </div>
        </div>
      </section>

      <!-- 3. Gasto com IA -->
      <section class="space-y-3">
        <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Gasto com IA</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
          O custo exibido é <strong>estimado</strong> a partir de uma tabela de preços pública por token — pode variar da fatura real do provedor.
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-4 rounded-[0.75rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <p class="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">Chamadas</p>
            <p class="text-lg font-black text-gray-900 dark:text-white mt-1">{{ formatInt(data.aiSpend.totalCalls) }}</p>
            <p class="text-[10px] text-gray-500 dark:text-gray-400 font-bold">
              <span class="text-emerald-600 dark:text-emerald-400">{{ formatInt(data.aiSpend.successCalls) }} ok</span>
              <span class="mx-1">·</span>
              <span class="text-red-500 dark:text-red-400">{{ formatInt(data.aiSpend.failedCalls) }} falha</span>
            </p>
          </div>
          <div class="p-4 rounded-[0.75rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <p class="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">Custo estimado</p>
            <p class="text-lg font-black text-gray-900 dark:text-white mt-1">{{ formatUsd(data.aiSpend.estimatedCostUsd) }}</p>
            <p class="text-[10px] text-gray-400 dark:text-gray-500 font-bold">estimativa</p>
          </div>
          <div class="p-4 rounded-[0.75rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <p class="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">Tokens entrada</p>
            <p class="text-lg font-black text-gray-900 dark:text-white mt-1">{{ formatInt(data.aiSpend.totalTokensInput) }}</p>
          </div>
          <div class="p-4 rounded-[0.75rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <p class="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">Tokens saída</p>
            <p class="text-lg font-black text-gray-900 dark:text-white mt-1">{{ formatInt(data.aiSpend.totalTokensOutput) }}</p>
          </div>
        </div>

        <!-- Breakdown por provedor -->
        <div v-if="data.aiSpend.byProvider.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="p in data.aiSpend.byProvider"
            :key="p.provider"
            class="p-4 rounded-[0.75rem] border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="font-black text-gray-900 dark:text-gray-100 uppercase text-xs tracking-widest">{{ providerLabel(p.provider) }}</span>
              <span class="text-sm font-black text-gray-900 dark:text-white tabular-nums">{{ formatUsd(p.estimatedCostUsd) }}</span>
            </div>
            <p class="text-[10px] text-gray-500 dark:text-gray-400 font-bold">
              {{ formatInt(p.totalCalls) }} chamadas · {{ formatInt(p.totalTokensInput) }} / {{ formatInt(p.totalTokensOutput) }} tokens
            </p>
          </div>
        </div>
      </section>

      <!-- 4. Chamadas de IA recentes -->
      <section class="space-y-3">
        <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Chamadas de IA Recentes</h3>
        <div v-if="data.recentAiCalls.length === 0" class="text-xs text-gray-400 dark:text-gray-500 font-bold py-6 text-center">
          Nenhuma chamada de IA registrada.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                <th class="py-2 pr-4">Provedor</th>
                <th class="py-2 pr-4">Modelo</th>
                <th class="py-2 pr-4">Ação</th>
                <th class="py-2 pr-4">Tokens</th>
                <th class="py-2 pr-4">Custo</th>
                <th class="py-2 pr-4">Status</th>
                <th class="py-2 pr-4">Quando</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="c in data.recentAiCalls"
                :key="c.id"
                class="border-b border-gray-50 dark:border-gray-800/50 text-gray-700 dark:text-gray-300"
              >
                <td class="py-2.5 pr-4 font-black">{{ providerLabel(c.provider) }}</td>
                <td class="py-2.5 pr-4 font-medium text-gray-500 dark:text-gray-400">{{ c.model }}</td>
                <td class="py-2.5 pr-4 font-medium">{{ actionLabel(c.action) }}</td>
                <td class="py-2.5 pr-4 font-medium tabular-nums">{{ formatInt(c.tokensInput) }} / {{ formatInt(c.tokensOutput) }}</td>
                <td class="py-2.5 pr-4 font-medium tabular-nums">{{ formatUsd(c.estimatedCostUsd) }}</td>
                <td class="py-2.5 pr-4">
                  <span
                    :class="c.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'"
                    class="font-black uppercase text-[10px] tracking-widest"
                  >{{ c.success ? 'OK' : 'Falha' }}</span>
                </td>
                <td class="py-2.5 pr-4 font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ formatDateTime(c.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 5. Propostas -->
      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Propostas</h3>
          <span class="text-xs font-black text-gray-500 dark:text-gray-400">{{ formatInt(data.proposalsSummary.total) }} no total</span>
        </div>
        <div v-if="Object.keys(data.proposalsSummary.byStatus).length > 0" class="flex flex-wrap gap-2">
          <BaseBadge
            v-for="(count, status) in data.proposalsSummary.byStatus"
            :key="status"
            :variant="statusVariant(status as string)"
          >
            {{ statusLabel(status as string) }}: {{ count }}
          </BaseBadge>
        </div>
        <div v-if="data.proposalsSummary.recent.length === 0" class="text-xs text-gray-400 dark:text-gray-500 font-bold py-6 text-center">
          Nenhuma proposta registrada.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                <th class="py-2 pr-4">Título</th>
                <th class="py-2 pr-4">Status</th>
                <th class="py-2 pr-4">Valor</th>
                <th class="py-2 pr-4">Data</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(p, i) in data.proposalsSummary.recent"
                :key="i"
                class="border-b border-gray-50 dark:border-gray-800/50 text-gray-700 dark:text-gray-300"
              >
                <td class="py-2.5 pr-4 font-black text-gray-900 dark:text-gray-100 max-w-xs truncate">{{ p.title }}</td>
                <td class="py-2.5 pr-4">
                  <BaseBadge :variant="statusVariant(p.status)">{{ statusLabel(p.status) }}</BaseBadge>
                </td>
                <td class="py-2.5 pr-4 font-medium tabular-nums">{{ formatBRL(p.totalFinal) }}</td>
                <td class="py-2.5 pr-4 font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ formatDate(p.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </BaseDialog>
</template>
