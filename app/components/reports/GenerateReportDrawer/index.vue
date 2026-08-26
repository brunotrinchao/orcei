<script setup lang="ts">
import { useGenerateReportDrawer } from './index'

const props = withDefaults(defineProps<{
  open: boolean
  period?: string
  periodLabel?: string
  stats?: any
  creditsBalance?: number
  creditCost?: number
  loading?: boolean
  allowChangePeriod?: boolean
}>(), {
  period: 'last_30_days',
  creditsBalance: 0,
  creditCost: 1,
  loading: false,
  allowChangePeriod: true
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:open', val: boolean): void
  (e: 'confirm', payload: { period: string }): void
  (e: 'update:period', val: string): void
}>()

const {
  localPeriod,
  periodOptions,
  currentPeriodObj,
  selectPeriod,
  statsPending,
  activeStats,
  close,
  handleOpenUpdate,
  handleConfirm,
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
  Sparkles,
  Loader2,
  X,
  Calendar,
  Coins,
  TrendingUp,
  DollarSign,
  Clock,
  Award,
  Zap
} = useGenerateReportDrawer(props, emit)
</script>

<template>
  <DialogRoot :open="open" @update:open="handleOpenUpdate">
    <DialogPortal>
      <DialogOverlay 
        class="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-md dialog-overlay" 
      />
      
      <DialogContent 
        class="fixed inset-y-0 right-0 z-50 h-full w-full sm:max-w-xl bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 shadow-2xl flex flex-col ease-out-back dialog-content"
      >
        <div class="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-tr from-violet-500/20 via-fuchsia-500/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse duration-[8000ms]" />
        <div class="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div class="relative px-6 py-5 border-b border-gray-100 dark:border-slate-800/80 flex items-center justify-between z-10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-[0.75rem] bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles class="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <DialogTitle class="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">
                Gerar Relatório Estratégico IA
              </DialogTitle>
              <span class="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Inteligência Comercial Avançada</span>
            </div>
          </div>
          
          <DialogClose 
            type="button" 
            @click="close" 
            :disabled="loading"
            class="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-[0.75rem] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
          >
            <X class="w-5 h-5" />
          </DialogClose>
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6 z-10 custom-scrollbar">
          
          <div class="p-5 bg-gradient-to-br from-indigo-50/80 to-blue-50/40 dark:from-indigo-950/30 dark:to-blue-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-[0.75rem] space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                <Calendar class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span class="text-xs font-black uppercase tracking-wider">Período da Análise</span>
              </div>
              <span class="text-[10px] font-black text-indigo-800 dark:text-indigo-200 uppercase bg-indigo-100/80 dark:bg-indigo-900/50 px-3 py-0.5 rounded-[0.50rem] border border-indigo-200 dark:border-indigo-800">
                {{ currentPeriodObj.fullLabel }}
              </span>
            </div>

            <div v-if="allowChangePeriod" class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide bg-indigo-100/40 dark:bg-indigo-950/50 p-1.5 rounded-[0.50rem] border border-indigo-200/40 dark:border-indigo-800/40">
              <button
                v-for="opt in periodOptions"
                :key="opt.value"
                type="button"
                @click="selectPeriod(opt.value)"
                :class="[
                  'px-3.5 py-1.5 rounded-[0.50rem] text-[10px] uppercase tracking-wider font-black transition-all cursor-pointer whitespace-nowrap',
                  localPeriod === opt.value
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-800'
                    : 'text-indigo-700/70 dark:text-indigo-300/70 hover:text-indigo-900 dark:hover:text-white'
                ]"
              >
                {{ opt.label }}
              </button>
            </div>

            <p class="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              O relatório será gerado utilizando exclusivamente os dados comerciais registrados no período <strong class="text-indigo-900 dark:text-white">{{ currentPeriodObj.fullLabel }}</strong>.
            </p>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Base de Dados a Ser Analisada ({{ currentPeriodObj.fullLabel }})
              </h4>
              <Loader2 v-if="statsPending" class="w-3 h-3 animate-spin text-indigo-500" />
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div class="bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-[0.75rem] border border-gray-100 dark:border-slate-800 space-y-1">
                <div class="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <DollarSign class="w-3.5 h-3.5" />
                  <span class="text-[8px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">Faturamento</span>
                </div>
                <p class="text-sm font-black text-slate-900 dark:text-white truncate">
                  R$ {{ (activeStats?.totalRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }}
                </p>
              </div>

              <div class="bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-[0.75rem] border border-gray-100 dark:border-slate-800 space-y-1">
                <div class="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <TrendingUp class="w-3.5 h-3.5" />
                  <span class="text-[8px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">Orçamentos</span>
                </div>
                <p class="text-sm font-black text-slate-900 dark:text-white truncate">
                  {{ activeStats?.proposalsCount ?? 0 }} <span class="text-[9px] font-bold text-gray-400">totais</span>
                </p>
              </div>

              <div class="bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-[0.75rem] border border-gray-100 dark:border-slate-800 space-y-1">
                <div class="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                  <Award class="w-3.5 h-3.5" />
                  <span class="text-[8px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">Conversão</span>
                </div>
                <p class="text-sm font-black text-slate-900 dark:text-white truncate">
                  {{ Math.round(activeStats?.approvalRate ?? 0) }}% <span class="text-[9px] font-bold text-gray-400">({{ activeStats?.acceptedCount ?? 0 }} aceitos)</span>
                </p>
              </div>

              <div class="bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-[0.75rem] border border-gray-100 dark:border-slate-800 space-y-1">
                <div class="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  <Clock class="w-3.5 h-3.5" />
                  <span class="text-[8px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">TMA Médio</span>
                </div>
                <p class="text-sm font-black text-slate-900 dark:text-white truncate">
                  {{ (activeStats?.tmaHours ?? 0) > 24 ? `${Math.round((activeStats?.tmaHours || 0) / 24)}d` : `${Math.round(activeStats?.tmaHours || 0)}h` }}
                </p>
              </div>

              <div class="bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-[0.75rem] border border-gray-100 dark:border-slate-800 space-y-1 col-span-2 sm:col-span-2">
                <div class="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Zap class="w-3.5 h-3.5" />
                  <span class="text-[8px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">Horas Poupadas IA</span>
                </div>
                <p class="text-sm font-black text-slate-900 dark:text-white truncate">
                  {{ activeStats?.aiRoi?.timeSavedHours ?? 0 }}h {{ activeStats?.aiRoi?.timeSavedMinutes ?? 0 }}m de trabalho manual
                </p>
              </div>
            </div>
          </div>

          <div class="p-5 bg-slate-900 dark:bg-slate-950 text-white rounded-[0.75rem] border border-white/10 shadow-xl space-y-3 relative overflow-hidden">
            <div class="flex items-center justify-between relative z-10">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-[0.50rem] bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Coins class="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Custo da Análise IA</p>
                  <p class="text-base font-black text-white">
                    {{ creditCost }} {{ creditCost === 1 ? 'Crédito' : 'Créditos' }}
                  </p>
                </div>
              </div>

              <div class="text-right">
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Seu Saldo Atual</p>
                <p class="text-base font-black text-blue-400">
                  {{ creditsBalance }} Créditos
                </p>
              </div>
            </div>

            <p class="text-[10px] font-medium text-slate-400 pt-2 border-t border-white/10 leading-relaxed">
              * O crédito será debitado da sua conta no momento da geração do relatório. Se você não tiver saldo suficiente, poderá efetuar uma recarga expressa.
            </p>
          </div>

        </div>

        <div class="px-6 py-4 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between gap-4 z-10 bg-gray-50/50 dark:bg-slate-900/50">
          <BaseButton 
            variant="secondary" 
            size="sm" 
            @click="close" 
            :disabled="loading"
            class="px-5 py-3 rounded-[0.75rem] text-xs font-bold uppercase tracking-wider"
          >
            Cancelar
          </BaseButton>

          <BaseButton 
            variant="ia" 
            size="sm" 
            @click="handleConfirm" 
            :disabled="loading"
            class="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-[0.75rem] py-3 text-xs font-black tracking-widest uppercase shadow-lg shadow-indigo-600/20 border border-indigo-400/20 cursor-pointer disabled:opacity-50"
          >
            <Loader2 v-if="loading" class="w-4 h-4 animate-spin mr-2" />
            <template v-else>
              <Sparkles class="w-4 h-4 mr-2" />
              Gerar Relatório
            </template>
          </BaseButton>
        </div>

      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped src="./index.css"></style>
