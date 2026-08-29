<script setup lang="ts">
import { useRelatoriosPage } from '~/composables/pages/useRelatoriosPage'
import GenerateReportDrawer from '~/components/reports/GenerateReportDrawer/index.vue'
import ConfirmCreditDialog from '~/components/ui/ConfirmCreditDialog.vue'
import PaywallExpressModal from '~/components/ui/PaywallExpressModal/index.vue'

const {
  searchQuery,
  startDate,
  endDate,
  profile,
  getCost,
  isCreditConfirmOpen,
  confirmTitle,
  confirmDescription,
  handleCreditConfirm,
  handleCreditCancel,
  isPaywallOpen,
  paywallReason,
  isReportDrawerOpen,
  isGeneratingReport,
  activeFiltersCount,
  clearFilters,
  reports,
  refresh,
  pending,
  filteredReports,
  selectedReport,
  isViewModalOpen,
  getReportScore,
  openView,
  downloadPdf,
  confirmDeleteReport,
  handleConfirmReport,
  FileText,
  Download,
  Eye,
  Search,
  Calendar,
  RefreshCcw,
  Trash2,
  AlertTriangle,
  MoreVertical,
  Sparkles,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
} = useRelatoriosPage()
const formatDate = (date: string) => new Date(date).toLocaleString('pt-BR')
</script>

<template>
  <div class="space-y-10 relative">
    <PageHeader title="Relatórios IA" subtitle="Analises estratégicas geradas pela inteligência artificial.">
      <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <BaseButton @click="isReportDrawerOpen = true" class="shadow-2xl shadow-gray-200" variant="ia">
          <Sparkles class="w-4 h-4 mr-2 text-white animate-pulse" />
          Gerar Novo Relatório
        </BaseButton>
      </div>

      <template #filters>
        <BaseFilters :active-filters-count="activeFiltersCount" @clear="clearFilters">
          <template #search>
            <input v-model="searchQuery" type="text" placeholder="Buscar no conteúdo do relatório..."
              class="w-full h-[52px] pl-12 pr-5 bg-white dark:bg-gray-900 border-2  border-gray-300 dark:border-gray-800  rounded-[0.75rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm">
            <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
              <Search class="w-5 h-5" />
            </div>
          </template>

          <div class="w-full md:w-56 shrink-0">
            <BaseDateRangePicker v-model:start="startDate" v-model:end="endDate" />
          </div>
        </BaseFilters>
      </template>
    </PageHeader>

    <!-- Listagem Unificada (desktop & mobile) -->
    <BaseDataList data-tour="relatorios-lista" :columns="[
      { key: 'report', label: 'Relatórios' }
    ]" :items="filteredReports || []" :pending="pending" empty-title="Nenhum relatório encontrado"
      empty-subtitle="Você ainda não gerou relatórios IA ou os filtros não retornaram resultados.">
      <template #cell-report="{ item: report }">
        <div
          class="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 w-full cursor-pointer "
                @click="openView(report)">
          <div class="flex items-center gap-4 w-full">
            <div class="space-y-1">
              <h4
                class="text-base md:text-lg font-black text-gray-900 dark:text-gray-50 leading-tight transition-all">
                Análise Estratégica IA
              </h4>
              <div class="flex flex-wrap items-center gap-2 md:gap-3">
                <span class="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar class="w-3 h-3" />
                  {{ formatDate(report.createdAt) }}
                </span>
                <span class="w-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full hidden md:inline-block"></span>
                  <BaseBadge variant="info">
                    {{ report.context?.totalProposals || 0 }} Orçamentos analisados
                  </BaseBadge>
                <template v-if="getReportScore(report) !== null">
                  <span class="w-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full hidden md:inline-block"></span>
                    <BaseBadge
                      :variant="getReportScore(report)! >= 70 ? 'success' : (getReportScore(report)! >= 50 ? 'warning' : 'error')">
                      Score {{ getReportScore(report) }}/100
                    </BaseBadge>
                </template>
              </div>
            </div>
          </div>
        </div>
      </template>
    </BaseDataList>

    <!-- Modal de Visualização -->
    <BaseDialog v-model:open="isViewModalOpen" title="Relatório Estratégico IA" size="xl">
      <template #context-menu v-if="selectedReport">
        <DropdownMenuRoot>
          <DropdownMenuTrigger as-child>
            <button
              type="button"
              class="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-[0.75rem] transition-all cursor-pointer"
              title="Mais ações" aria-label="Mais ações do relatório">
              <MoreVertical class="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent align="end" :side-offset="6"
              class="min-w-[220px] bg-white dark:bg-gray-950 rounded-[0.75rem] shadow-xl border border-gray-100 dark:border-gray-800 p-2 z-[9999]">
              <DropdownMenuItem @click="downloadPdf(selectedReport._id)"
                class="flex items-center gap-3 px-4 py-3 rounded-[0.75rem] text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer outline-none transition-all">
                <Download class="w-4 h-4" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem @click="confirmDeleteReport(selectedReport)"
                class="flex items-center gap-3 px-4 py-3 rounded-[0.75rem] text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-red-600 dark:hover:text-red-400 cursor-pointer outline-none transition-all">
                <Trash2 class="w-4 h-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenuRoot>
      </template>
      <div v-if="selectedReport">
        <div
          class="flex items-center gap-3 px-5 py-3 mb-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/30 rounded-[0.75rem] text-amber-800 dark:text-amber-200">
          <AlertTriangle class="w-5 h-5 shrink-0" />
          <p class="text-xs font-bold">Relatório gerado por Inteligência Artificial. Os dados e recomendações podem
            conter
            equívocos — sempre valide antes de tomar decisões críticas.</p>
        </div>
        <div
          class="prose prose-blue dark:prose-invert prose-headings:font-black prose-h2:text-blue-600 dark:prose-h2:text-blue-400 prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-blue-100 dark:prose-h2:border-gray-800 prose-p:leading-relaxed prose-p:mb-4 prose-table:my-6 prose-li:my-1 max-w-none py-8 min-h-[60vh]">
          <div v-html="$md.render(selectedReport.content)"></div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-between w-full items-center">
          <span class="text-xs font-semibold text-gray-400 tracking-wide">Gerado em {{
            formatDate(selectedReport?.createdAt) }}</span>
          <div class="flex gap-3">
            <!-- <BaseButton variant="secondary" @click="isViewModalOpen = false">Fechar</BaseButton>
            <BaseButton @click="confirmDeleteReport(selectedReport)" class="bg-red-600 hover:bg-red-700">
              <Trash2 class="w-4 h-4 mr-2" />
              Excluir
            </BaseButton>
            <BaseButton @click="downloadPdf(selectedReport._id)">
              <Download class="w-4 h-4 mr-2" />
              Download PDF
            </BaseButton> -->
          </div>
        </div>
      </template>
    </BaseDialog>

    <!-- Drawer de Geração de Relatório IA com seletor de dias -->
    <GenerateReportDrawer v-model:open="isReportDrawerOpen" period="last_30_days"
      :credits-balance="profile?.creditsBalance || 0" :credit-cost="getCost('analyzeReport')"
      :loading="isGeneratingReport" :allow-change-period="true" @confirm="handleConfirmReport" />

    <!-- Modal de Paywall Express -->
    <PaywallExpressModal v-model:open="isPaywallOpen" :reason="paywallReason" />

    <!-- Modal de Confirmação de Consumo de Crédito IA -->
    <ConfirmCreditDialog v-model:open="isCreditConfirmOpen" :title="confirmTitle" :description="confirmDescription"
      @confirm="handleCreditConfirm" @cancel="handleCreditCancel" />
  </div>
</template>
