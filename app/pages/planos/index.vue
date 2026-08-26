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
    <header class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div>
        <h1 class="text-4xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Planos e Recargas</h1>
        <p class="text-gray-500 dark:text-gray-400 font-medium">Adquira pacotes de créditos cumulativos vitalícios para criar orçamentos e relatórios.</p>
      </div>
      
      <!-- Saldo Glowing -->
      <div class="bg-slate-900 dark:bg-slate-900/90 text-white px-5 py-5 rounded-[0.75rem] shadow-2xl flex items-center gap-6 border border-white/5 relative overflow-hidden shrink-0">
        <div class="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>
        <div class="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400">
          <Coins class="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Saldo de Créditos</p>
          <p class="text-3xl font-black text-white">
            {{ profile?.creditsBalance || 0 }} <span class="text-xs font-bold text-gray-400 uppercase">Créditos</span>
          </p>
        </div>
      </div>
    </header>

    <!-- Banners de Notificação Stripe -->
    <div v-if="success" class="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-100 dark:border-emerald-900/50 p-6 rounded-[0.75rem] flex items-center gap-4 text-emerald-700 dark:text-emerald-300 animate-in fade-in slide-in-from-top-4">
      <CheckCircle2 class="w-6 h-6 shrink-0" />
      <p class="font-bold">Recarga efetuada com sucesso! Seus créditos vitalícios foram adicionados ao saldo.</p>
    </div>

    <div v-if="canceled" class="bg-orange-50 dark:bg-orange-950/40 border-2 border-orange-100 dark:border-orange-900/50 p-6 rounded-[0.75rem] flex items-center gap-4 text-orange-700 dark:text-orange-300 animate-in fade-in slide-in-from-top-4">
      <AlertCircle class="w-6 h-6 shrink-0 text-orange-500" />
      <p class="font-bold">A compra de créditos foi cancelada ou não pôde ser processada.</p>
    </div>

    <!-- Banner Hero: Garantia de Créditos Vitalícios -->
    <section class="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-[0.75rem] border border-indigo-500/20 shadow-xl shadow-indigo-500/5">
      <div class="absolute -top-20 -left-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl opacity-60"></div>
      <div class="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl opacity-60"></div>
      
      <div class="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div class="space-y-3 flex-1 text-center lg:text-left">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-500/20 rounded-full text-indigo-200 text-[9px] font-black uppercase tracking-widest border border-indigo-500/30">
            <ShieldCheck class="w-4 h-4 text-indigo-400" /> Sem Mensalidade Fixa • Créditos Vitalícios
          </div>
          <h2 class="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight uppercase">
            Pague apenas pelo que utilizar. Seus créditos nunca expiram!
          </h2>
          <p class="text-slate-400 text-sm max-w-2xl leading-relaxed">
            Eliminamos a barreira da assinatura mensal fixa. Abasteça sua conta com créditos e use-os nos meses em que seu fluxo de orçamentos exigir. Sem surpresas ou cobranças automáticas invisíveis.
          </p>
        </div>
        
        <!-- Resumo Rápido de Custos das Principais Ações + Botão para Abrir Modal -->
        <div class="bg-slate-950/50 p-6 rounded-[0.75rem] border border-white/10 shrink-0 w-full lg:w-80 space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumo</p>
            <button 
              @click="isCostTableModalOpen = true"
              class="text-[9px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded-lg border border-blue-500/20 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
              title="Abrir Tabela Completa de Custos"
            >
              Ver Tabela Completa <ChevronRight class="w-3 h-3" />
            </button>
          </div>
          <div class="space-y-2 text-xs font-bold text-slate-300">
            <div class="flex items-center justify-between border-b border-white/5 pb-1.5">
              <span class="flex items-center gap-2"><FileText class="w-3.5 h-3.5 text-blue-400" /> Envio de Proposta</span>
              <span class="font-black text-white bg-white/10 px-2 py-0.5 rounded text-[10px]">{{ costText('proposalSend') }}</span>
            </div>
            <div class="flex items-center justify-between border-b border-white/5 pb-1.5">
              <span class="flex items-center gap-2"><Sparkles class="w-3.5 h-3.5 text-violet-400" /> Assistente IA</span>
              <span class="font-black text-white bg-white/10 px-2 py-0.5 rounded text-[10px]">{{ costText('proposalSuggest') }}</span>
            </div>
            <div class="flex items-center justify-between border-b border-white/5 pb-1.5">
              <span class="flex items-center gap-2"><UserPlus class="w-3.5 h-3.5 text-indigo-400" /> Extração de Lead</span>
              <span class="font-black text-white bg-white/10 px-2 py-0.5 rounded text-[10px]">{{ costText('clientExtract') }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-2"><ReceiptText class="w-3.5 h-3.5 text-emerald-400" /> Relatório IA</span>
              <span class="font-black text-white bg-white/10 px-2 py-0.5 rounded text-[10px]">{{ costText('analyzeReport') }}</span>
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
        <p class="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed">
          Confira abaixo a relação completa de funcionalidades comerciais e de inteligência artificial da plataforma com os respectivos custos em créditos.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="item in actionCostsList" 
            :key="item.key"
            class="bg-gray-50/60 dark:bg-gray-800/60 p-5 rounded-[0.75rem] border border-gray-100 dark:border-gray-700/60 flex flex-col justify-between space-y-4"
          >
            <div class="space-y-2.5">
              <div class="flex items-center justify-between gap-2">
                <div class="w-8 h-8 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center text-gray-900 dark:text-white border border-gray-100 dark:border-gray-600 shadow-sm shrink-0">
                  <component :is="item.icon" class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span :class="['text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border', item.badgeColor]">
                  {{ item.badge }}
                </span>
              </div>
              <div>
                <h4 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ item.name }}</h4>
                <p class="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{{ item.description }}</p>
              </div>
            </div>

            <div class="pt-3 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
              <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Custo</span>
              <span class="text-xs font-black text-gray-900 dark:text-white bg-white dark:bg-gray-900 px-3 py-1 rounded-xl border border-gray-200/60 dark:border-gray-700">
                {{ costText(item.key) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </BaseDialog>

    <!-- Cupom Promocional -->
    <section class="bg-white dark:bg-gray-900 p-8 rounded-[0.75rem] border border-gray-100 dark:border-gray-800 shadow-sm">
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
    </section>

    <!-- Grade de Pacotes Transacionais de Recarga -->
    <section class="space-y-8">
      <div class="text-center space-y-2">
        <h3 class="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">Recarga Expressa de Créditos</h3>
        <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Escolha a melhor opção de recarga</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        <div 
          v-for="pack in packages" 
          :key="pack.id"
          :class="[
            'bg-white dark:bg-gray-900 p-8 rounded-[0.75rem] border transition-all flex flex-col justify-between relative overflow-hidden',
            pack.highlight 
              ? 'border-blue-600 dark:border-blue-500 ring-8 ring-blue-50 dark:ring-blue-950/40 shadow-2xl scale-[1.03] z-10' 
              : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-lg'
          ]"
        >
          <!-- Selo Recomendado flutuante -->
          <div 
            v-if="pack.highlight" 
            class="absolute top-6 right-6 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md animate-pulse"
          >
            Recomendado
          </div>

          <div class="space-y-6">
            <div class="space-y-2">
              <span class="text-[9px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 px-2.5 py-1 rounded-lg w-fit block">
                {{ pack.badge }}
              </span>
              <h3 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ pack.name }}</h3>
              <p class="text-gray-500 dark:text-gray-400 font-medium text-xs leading-relaxed">{{ pack.description }}</p>
            </div>

            <!-- Preço de Recarga -->
            <div class="space-y-1">
              <div class="flex items-baseline gap-1">
                <span class="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{{ pack.price }}</span>
              </div>
              <p class="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded w-fit">
                {{ pack.unitPrice }}
              </p>
            </div>

            <div class="h-px bg-gray-100 dark:bg-gray-800"></div>

            <!-- Recursos Incluídos -->
            <ul class="space-y-3.5">
              <li 
                v-for="feature in pack.features" 
                :key="feature" 
                class="flex items-start gap-3 text-xs font-bold text-gray-600 dark:text-gray-300"
              >
                <div class="w-5 h-5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 class="w-3.5 h-3.5" />
                </div>
                <span>{{ feature }}</span>
              </li>
            </ul>
          </div>

          <!-- Botão de Recarga -->
          <div class="pt-8">
            <BaseButton 
              @click="handleAction(pack.id)" 
              :disabled="isLoading === pack.id || !!isLoading"
              :variant="pack.highlight ? 'primary' : 'outline'"
              class="w-full py-5 rounded-2xl text-xs font-black uppercase tracking-widest relative overflow-hidden"
            >
              <Loader2 v-if="isLoading === pack.id" class="w-4 h-4 animate-spin mr-2" />
              <template v-else>
                {{ pack.credits }} {{ pack.credits === 1 ? 'Crédito' : 'Créditos' }}
              </template>
            </BaseButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Histórico de Pagamentos Stripe -->
    <section class="pt-8">
      <div class="flex items-center gap-3 mb-8">
        <h2 class="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Histórico de Recargas</h2>
        <div class="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
      </div>

      <div class="bg-white dark:bg-gray-900 rounded-[0.75rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <th class="px-8 py-5 text-[9px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest">Data</th>
                <th class="px-8 py-5 text-[9px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest">Valor</th>
                <th class="px-8 py-5 text-[9px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest">Recarga</th>
                <th class="px-8 py-5 text-[9px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
              <tr v-for="item in history" :key="item.id" class="hover:bg-gray-50/30 dark:hover:bg-gray-800/30 transition-all">
                <td class="px-8 py-6 text-xs font-bold text-gray-600 dark:text-gray-300">{{ new Date(item.date).toLocaleDateString('pt-BR') }}</td>
                <td class="px-8 py-6 text-sm font-black text-gray-900 dark:text-white">{{ item.amount }}</td>
                <td class="px-8 py-6 text-xs font-medium text-gray-500 dark:text-gray-400">
                  <div class="flex items-center gap-2">
                    {{ item.method }}
                    <a v-if="item.pdf" :href="item.pdf" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                      <Download class="w-3 h-3" /> Fatura PDF
                    </a>
                  </div>
                </td>
                <td class="px-8 py-6 text-right">
                  <span 
                    :class="[
                      'px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border',
                      item.status === 'paid' 
                        ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900/40' 
                        : 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/40'
                    ]"
                  >
                    {{ item.status === 'paid' ? 'Paga' : item.status }}
                  </span>
                </td>
              </tr>
              <tr v-if="!history?.length">
                <td colspan="4" class="px-8 py-20 text-center text-gray-400 dark:text-gray-500 font-medium text-xs font-semibold">
                  Nenhuma transação de recarga registrada ainda.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>
.pro-card-glow {
  box-shadow: 0 0 40px rgba(59, 130, 246, 0.15);
}
</style>
