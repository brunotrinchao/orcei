<script setup lang="ts">
import { useRelatoriosPage } from '~/composables/pages/useRelatoriosPage'
import GenerateReportDrawer from '~/components/reports/GenerateReportDrawer/index.vue'
import ConfirmCreditDialog from '~/components/ui/ConfirmCreditDialog.vue'
import PaywallExpressModal from '~/components/ui/PaywallExpressModal/index.vue'

const {
  searchQuery,
  startDate,
  endDate,
  stagedStartDate,
  stagedEndDate,
  onOpenFilters,
  applyFilters,
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
} = useRelatoriosPage()

const formatDate = (date: string) => new Date(date).toLocaleString('pt-BR')
</script>

<template>
  <div class="space-y-10 relative">
    <PageHeader >
      <div class="flex flex-row gap-3 w-full sm:w-auto justify-end">
        <BaseButton @click="isReportDrawerOpen = true" variant="ia">
          <Sparkles class="w-4 h-4 mr-2 text-white" />
          Gerar Novo Relatório
        </BaseButton>
      </div>
    </PageHeader>

    <!-- Listagem Unificada (desktop & mobile) -->
    <BaseCard>
      <template #header>
        <BaseFilters
          :active-filters-count="activeFiltersCount"
          @open="onOpenFilters"
          @apply="applyFilters"
          @clear="clearFilters"
          data-tour="relatorios-filtros"
        >
          <template #search>
            <BaseInput
              v-model="searchQuery"
              type="text"
              placeholder="Buscar no conteúdo do relatório..."
              :icon="Search"
            />
          </template>

          <div class="w-full md:w-56 shrink-0">
            <BaseDateRangePicker v-model:start="stagedStartDate" v-model:end="stagedEndDate" />
          </div>
        </BaseFilters>
      </template>

      <BaseDataList
        data-tour="relatorios-lista"
        :columns="[
          { key: 'title', label: 'Relatório' },
          { key: 'createdAt', label: 'Data' },
          { key: 'proposals', label: 'Orçamentos' },
          { key: 'score', label: 'Score IA', align: 'right' }
        ]"
        :items="filteredReports || []"
        :pending="pending"
        empty-title="Sem Relatórios Gerados"
        empty-subtitle="Você ainda não gerou relatórios IA ou os filtros aplicados não retornaram resultados."
      >
        <template #cell-title="{ item: report }">
          <div class="flex items-center gap-3 cursor-pointer group" @click="openView(report)">
            <div class="w-10 h-10 rounded-[0.50rem] bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Sparkles class="w-5 h-5" />
            </div>
            <div class="flex flex-col min-w-0">
              <span class="font-normal text-base text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight">
                Análise Estratégica IA
              </span>
            </div>
          </div>
        </template>

        <template #cell-createdAt="{ item: report }">
          <span class="text-xs md:text-sm text-gray-500 font-medium cursor-pointer" @click="openView(report)">
            {{ formatDate(report.createdAt) }}
          </span>
        </template>

        <template #cell-proposals="{ item: report }">
          <div class="cursor-pointer" @click="openView(report)">
            <BaseBadge variant="info" light>
              {{ report.context?.totalProposals || 0 }} {{ (report.context?.totalProposals === 1) ? 'orçamento' : 'orçamentos' }}
            </BaseBadge>
          </div>
        </template>

        <template #cell-score="{ item: report }">
          <div class="flex justify-end cursor-pointer" @click="openView(report)">
            <BaseBadge
              v-if="getReportScore(report) !== null"
              :variant="getReportScore(report)! >= 70 ? 'success' : (getReportScore(report)! >= 50 ? 'warning' : 'error')"
              light
            >
              {{ getReportScore(report) }}/100
            </BaseBadge>
            <span v-else class="text-xs text-gray-400 font-medium">—</span>
          </div>
        </template>
      </BaseDataList>
    </BaseCard>

    <!-- Modal de Visualização -->
    <BaseDialog v-model:open="isViewModalOpen" title="Relatório Estratégico IA" size="xl">
      <template #context-menu v-if="selectedReport">
        <BaseDropdownMenu>
          <BaseDropdownMenuItem @click="downloadPdf(selectedReport._id)">
            <Download class="w-4 h-4 text-gray-500" />
            <span>Download PDF</span>
          </BaseDropdownMenuItem>
          <BaseDropdownMenuItem variant="danger" @click="confirmDeleteReport(selectedReport)">
            <Trash2 class="w-4 h-4 text-red-500" />
            <span>Excluir</span>
          </BaseDropdownMenuItem>
        </BaseDropdownMenu>
      </template>

      <div v-if="selectedReport" class="space-y-6 py-2">
        <!-- Header do Relatório (BaseCard compact color="slate") -->
        <BaseCard compact color="slate">
          <div class="flex gap-4 items-center content-center">
            <div
              class="hidden sm:flex w-20 h-20 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white shrink-0">
              <Sparkles class="w-9 h-9" />
            </div>
            <div class="flex gap-1 grid sm:grid-cols-3 grid-cols-1 flex-1">
              <div>
                <h3 class="font-semibold tracking-normal text-lg text-gray-700 dark:text-gray-200">
                  Análise Estratégica IA
                </h3>
                <p class="font-base tracking-wide text-sm text-gray-500">
                  Gerado em {{ formatDate(selectedReport.createdAt) }}
                </p>
              </div>
              <div>
                <h3 class="font-semibold tracking-normal text-lg text-gray-700 dark:text-gray-200">
                  {{ selectedReport.context?.totalProposals || 0 }} Orçamentos
                </h3>
                <p class="font-base tracking-wide text-sm text-gray-500">Volume de dados analisados</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 mt-1">
                  <BaseBadge
                    v-if="getReportScore(selectedReport) !== null"
                    :variant="getReportScore(selectedReport)! >= 70 ? 'success' : (getReportScore(selectedReport)! >= 50 ? 'warning' : 'danger')"
                  >
                    Score {{ getReportScore(selectedReport) }}/100
                  </BaseBadge>
                </div>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- Cards de Métricas Comerciais (BaseMetricCard com variant) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <BaseMetricCard
            color="sky"
            title="Orçamentos Analisados"
            subtitle="Volume de dados processados"
            :value="selectedReport.context?.totalProposals || 0"
            :icon="FileText"
            variant
          />

          <BaseMetricCard
            :color="getReportScore(selectedReport) && getReportScore(selectedReport)! >= 70 ? 'green' : (getReportScore(selectedReport) && getReportScore(selectedReport)! >= 50 ? 'amber' : 'rose')"
            title="Score da Análise"
            subtitle="Desempenho comercial apurado"
            :value="getReportScore(selectedReport) !== null ? `${getReportScore(selectedReport)}/100` : 'N/A'"
            :icon="Sparkles"
            variant
          />

          <BaseMetricCard
            color="purple"
            title="Data de Geração"
            subtitle="Data e hora do diagnóstico"
            :value="formatDate(selectedReport.createdAt)"
            :icon="Calendar"
            variant
          />
        </div>

        <!-- Callout de Aviso da IA -->
        <BaseCallout
          variant="warning"
          title="Aviso Importante"
          description="Relatório gerado por Inteligência Artificial. Os dados e recomendações podem conter equívocos — sempre valide antes de tomar decisões críticas."
        />

        <!-- Conteúdo Markdown -->
        <div class="space-y-3">
          <div class="flex items-center justify-between px-1">
            <h3 class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 tracking-wide uppercase">
              Conteúdo do Relatório
            </h3>
          </div>
          <div
            class="p-6 rounded-[.5rem] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 prose prose-blue dark:prose-invert prose-headings:font-black prose-h2:text-blue-600 dark:prose-h2:text-blue-400 prose-h2:mt-6 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-blue-100 dark:prose-h2:border-gray-800 prose-p:leading-relaxed prose-p:mb-4 prose-table:my-6 prose-li:my-1 max-w-none min-h-[40vh]">
            <div v-html="$md.render(selectedReport.content)"></div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between w-full items-center">
          <span class="text-xs font-semibold text-gray-400 tracking-wide">
            Gerado em {{ formatDate(selectedReport?.createdAt) }}
          </span>
          <BaseButton variant="outline" size="sm" @click="downloadPdf(selectedReport._id)">
            <Download class="w-4 h-4 mr-2" />
            Download PDF
          </BaseButton>
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
