<script setup lang="ts">
import { usePlanosPage } from '~/composables/pages/usePlanosPage'

const {
  profile,
  refreshProfile,
  pendingProfile,
  getCost,
  costText,
  isLoading,
  isCostTableModalOpen,
  packages,
  refreshPackages,
  pendingPackages,
  couponCode,
  couponLoading,
  couponError,
  redeemCoupon,
  handleAction,
  success,
  canceled,
  history,
  refreshInvoices,
  pendingHistory,
  actionCostsList,
  Zap,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Download,
  ShieldAlert,
  ShieldCheck,
  Award,
  MessageSquare,
  AlertCircle,
  ShoppingBag,
  Coins,
  Sparkles,
  FileText,
  UserPlus,
  Wand2,
  BookOpen,
  ReceiptText,
  ChevronRight,
  Info,
} = usePlanosPage()
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-12 pb-16">
    
    <!-- Cabeçalho de Créditos -->
     <PageHeader title="Recargas" subtitle="Adquira pacotes de créditos cumulativos vitalícios para criar orçamentos e relatórios.">
      <!-- Saldo de Créditos (layout IA Orcei Fácil) -->
      <div data-tour="planos-saldo" class="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white px-5 py-4 rounded-[.5rem] border border-white/10 flex items-center gap-4 shrink-0">
        <div
          class="w-11 h-11 rounded-[.5rem] bg-indigo-500/15 border border-indigo-400/20 flex items-center justify-center text-indigo-300 shrink-0">
          <Coins class="w-5 h-5" />
        </div>
        <div>
          <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-400/20 text-indigo-200 text-[11px] font-medium mb-1">
            <Coins class="w-3 h-3 text-indigo-300" /> Saldo de créditos
          </div>
          <p class="text-2xl font-semibold text-white leading-tight">
            {{ profile?.creditsBalance || 0 }} <span class="text-sm font-medium text-slate-400">créditos</span>
          </p>
        </div>
      </div>
     </PageHeader>

    <!-- Banners de Notificação Stripe -->
    <div v-if="success" class="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 p-4 rounded-[.5rem] flex items-center gap-3 text-emerald-700 dark:text-emerald-300">
      <CheckCircle2 class="w-5 h-5 shrink-0" />
      <p class="text-sm font-medium">Recarga efetuada com sucesso! Seus créditos vitalícios foram adicionados ao saldo.</p>
    </div>

    <div v-if="canceled" class="bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 p-4 rounded-[.5rem] flex items-center gap-3 text-orange-700 dark:text-orange-300">
      <AlertCircle class="w-5 h-5 shrink-0 text-orange-500" />
      <p class="text-sm font-medium">A compra de créditos foi cancelada ou não pôde ser processada.</p>
    </div>

    <!-- Banner: Créditos Vitalícios (layout IA Orcei Fácil) -->
    <section data-tour="planos-banner" class="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[.5rem] border border-white/10">
      <div class="absolute -top-20 -left-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl opacity-60"></div>
      <div class="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl opacity-60"></div>

      <div class="relative z-10 flex flex-col lg:flex-row justify-between items-stretch gap-5 sm:gap-7 p-6 sm:p-8">
        <!-- Texto principal -->
        <div class="space-y-4 flex-1 min-w-0">
          <div class="flex items-center gap-3 flex-wrap">
            <div
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/20 text-indigo-200 text-xs font-medium">
              <ShieldCheck class="w-3.5 h-3.5 text-indigo-300" /> Sem mensalidade fixa · créditos vitalícios
            </div>
          </div>

          <div class="space-y-1.5">
            <h2 class="text-2xl md:text-[1.75rem] font-semibold text-white leading-snug tracking-tight">
              Pague apenas pelo que usar. Seus créditos nunca expiram!
            </h2>
            <p class="text-sm text-slate-400 leading-relaxed max-w-xl">
              Sem assinatura mensal fixa. Abasteça sua conta com créditos e use-os quando precisar — sem surpresas ou cobranças automáticas.
            </p>
          </div>
        </div>

        <!-- Resumo de custos -->
        <div class="flex flex-col lg:w-72 shrink-0 gap-4 rounded-[.5rem] border border-white/10 bg-white/[0.04] p-4">
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs text-slate-400">Custos das principais ações</p>
            <button
              @click="isCostTableModalOpen = true"
              class="text-xs font-medium text-indigo-300 hover:text-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              Ver tabela completa <ChevronRight class="w-3.5 h-3.5" />
            </button>
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between gap-3 text-sm text-slate-300">
              <span class="flex items-center gap-2 min-w-0"><FileText class="w-3.5 h-3.5 text-indigo-300 shrink-0" /> <span class="truncate">Envio de proposta</span></span>
              <span class="text-sm font-semibold text-white shrink-0">{{ costText('proposalSend') }}</span>
            </div>
            <div class="flex items-center justify-between gap-3 text-sm text-slate-300">
              <span class="flex items-center gap-2 min-w-0"><Sparkles class="w-3.5 h-3.5 text-violet-300 shrink-0" /> <span class="truncate">Assistente IA</span></span>
              <span class="text-sm font-semibold text-white shrink-0">{{ costText('proposalSuggest') }}</span>
            </div>
            <div class="flex items-center justify-between gap-3 text-sm text-slate-300">
              <span class="flex items-center gap-2 min-w-0"><UserPlus class="w-3.5 h-3.5 text-indigo-300 shrink-0" /> <span class="truncate">Extração de lead</span></span>
              <span class="text-sm font-semibold text-white shrink-0">{{ costText('clientExtract') }}</span>
            </div>
            <div class="flex items-center justify-between gap-3 text-sm text-slate-300">
              <span class="flex items-center gap-2 min-w-0"><ReceiptText class="w-3.5 h-3.5 text-emerald-300 shrink-0" /> <span class="truncate">Relatório IA</span></span>
              <span class="text-sm font-semibold text-white shrink-0">{{ costText('analyzeReport') }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Modal da Tabela Transparente de Custos por Ação -->
    <BaseDialog
      v-model:open="isCostTableModalOpen"
      title="Tabela de Custos por Ação"
      size="xl"
    >
      <div class="space-y-6 py-2">
        <p class="text-sm text-muted leading-relaxed">
          Confira abaixo a relação completa de funcionalidades comerciais e de inteligência artificial da plataforma com os respectivos custos em créditos.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="item in actionCostsList"
            :key="item.key"
            class="bg-soft dark:bg-gray-800/60 p-5 rounded-[.5rem] border border-line dark:border-gray-700/60 flex flex-col justify-between space-y-4"
          >
            <div class="space-y-2.5">
              <div class="flex items-center justify-between gap-2">
                <div class="w-8 h-8 rounded-[.5rem] bg-white dark:bg-gray-700 flex items-center justify-center text-gray-900 dark:text-white border border-line dark:border-gray-600 shadow-sm shrink-0">
                  <component :is="item.icon" class="w-4 h-4 text-brand dark:text-brand" />
                </div>
                <span :class="['text-[10px] font-semibold px-2 py-0.5 rounded-[.5rem] border', item.badgeColor]">
                  {{ item.badge }}
                </span>
              </div>
              <div>
                <h4 class="text-sm font-semibold text-gray-900 dark:text-white">{{ item.name }}</h4>
                <p class="text-xs text-muted mt-1 leading-relaxed">{{ item.description }}</p>
              </div>
            </div>

            <div class="pt-3 border-t border-line dark:border-gray-700/50 flex items-center justify-between">
              <span class="text-xs font-medium text-muted">Custo</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-900 px-3 py-1 rounded-[.5rem] border border-line dark:border-gray-700">
                {{ costText(item.key) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </BaseDialog>

    <!-- Cupom Promocional -->
    <BaseCard compact data-tour="planos-cupom">
      <div class="flex flex-col md:flex-row md:items-end gap-4">
        <div class="flex-1">
          <BaseInput
            v-model="couponCode"
            label="Tem um cupom?"
            placeholder="Digite o código do cupom"
            :error="couponError"
          />
        </div>
        <BaseButton :disabled="couponLoading || !couponCode.trim()" @click="redeemCoupon" class="shrink-0">
          <Loader2 v-if="couponLoading" class="w-4 h-4 animate-spin mr-2" />
          Aplicar Cupom
        </BaseButton>
      </div>
    </BaseCard>

    <section class="space-y-8">
      <div data-tour="planos-pacotes" class="text-center space-y-1.5">
        <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Escolha a melhor opção de recarga</h2>
        <p class="text-sm text-muted">Créditos cumulativos e vitalícios aplicados na hora.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
        <BaseCard
          :data-tour="pack.highlight ? 'planos-pacote-destaque' : undefined"

          v-for="pack in packages"
          :key="pack.id"
          :class="[
            'relative flex flex-col rounded-[.5rem] transition-all',
            pack.highlight
              ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-white/10 shadow-lg shadow-indigo-900/20 z-10'
              : 'bg-white dark:bg-gray-900 border border-line dark:border-gray-800 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700'
          ]"
        >
          <!-- Badge do plano -->
          <div
            :class="[
              'inline-flex w-fit items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium',
              pack.highlight
                ? 'bg-indigo-500/15 border border-indigo-400/20 text-indigo-200'
                : 'bg-brand-soft/70 text-brand border border-brand/15'
            ]"
          >
            <span>{{ pack.badge }}</span>
            <span v-if="pack.highlight" class="flex items-center gap-1">
              <CheckCircle2 class="w-3 h-3" /> Recomendado
            </span>
          </div>

          <div class="mt-4 space-y-1.5">
            <h3
              :class="pack.highlight ? 'text-white' : 'text-gray-900 dark:text-white'"
              class="text-lg font-semibold leading-snug"
            >
              {{ pack.name }}
            </h3>
            <p
              :class="pack.highlight ? 'text-slate-400' : 'text-muted'"
              class="text-xs leading-relaxed"
            >
              {{ pack.description }}
            </p>
          </div>

          <!-- Preço -->
          <div class="mt-4 space-y-1">
            <span
              :class="pack.highlight ? 'text-white' : 'text-gray-900 dark:text-white'"
              class="text-3xl font-bold tracking-tight"
            >
              {{ pack.price }}
            </span>
            <p
              :class="pack.highlight ? 'text-indigo-200' : 'text-brand dark:text-blue-400'"
              class="text-xs font-medium"
            >
              {{ pack.unitPrice }}
            </p>
          </div>

          <div
            :class="pack.highlight ? 'bg-white/10' : 'bg-line dark:bg-gray-800'"
            class="h-px my-5"
          ></div>

          <!-- Recursos incluídos -->
          <ul class="space-y-2.5">
            <li
              v-for="feature in pack.features"
              :key="feature"
              class="flex items-start gap-2.5 text-xs leading-relaxed"
              :class="pack.highlight ? 'text-slate-300' : 'text-gray-600 dark:text-gray-300'"
            >
              <span
                :class="pack.highlight ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/20' : 'bg-brand-soft text-brand border border-brand/10'"
                class="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              >
                <CheckCircle2 class="w-3 h-3" />
              </span>
              <span>{{ feature }}</span>
            </li>
          </ul>

          <!-- Botão de recarga (alinhado embaixo) -->
          <template #footer>
            <BaseButton
              @click="handleAction(pack.id)"
              :disabled="isLoading === pack.id || !!isLoading"
              :variant="pack.highlight ? 'primary' : 'outline'"
              block
            >
              <Loader2 v-if="isLoading === pack.id" class="w-4 h-4 animate-spin mr-2" />
              <template v-else>
                Adicionar {{ pack.credits }} {{ pack.credits === 1 ? 'crédito' : 'créditos' }}
              </template>
            </BaseButton>
          </template>
        </BaseCard>
      </div>
    </section>

    <!-- Histórico de Recargas -->
    <BaseCard title="Histórico de Recargas" noPadding data-tour="planos-historico">
      <BaseTable
        :columns="[
          { key: 'date', label: 'Data' },
          { key: 'amount', label: 'Valor' },
          { key: 'method', label: 'Recarga' },
          { key: 'status', label: 'Status', align: 'right' }
        ]"
        :items="history || []"
        empty-text="Nenhuma transação de recarga registrada ainda."
      >
        <template #cell-date="{ item }">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-300">{{ new Date(item.date).toLocaleDateString('pt-BR') }}</span>
        </template>

        <template #cell-amount="{ item }">
          <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ item.amount }}</span>
        </template>

        <template #cell-method="{ item }">
          <div class="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
            {{ item.method }}
            <a v-if="item.pdf" :href="item.pdf" target="_blank" class="text-brand hover:text-brand-dark flex items-center gap-1 text-xs">
              <Download class="w-3 h-3" /> Fatura PDF
            </a>
          </div>
        </template>

        <template #cell-status="{ item }">
          <div class="flex justify-end">
            <BaseBadge :variant="item.status === 'paid' ? 'success' : 'warning'" light>
              {{ item.status === 'paid' ? 'Paga' : item.status }}
            </BaseBadge>
          </div>
        </template>
      </BaseTable>
    </BaseCard>

  </div>
</template>

<style scoped>
.pro-card-glow {
  box-shadow: 0 0 40px rgba(59, 130, 246, 0.15);
}
</style>
