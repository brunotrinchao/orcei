<script setup lang="ts">
import { FileText, Download, Eye, Search, Calendar, RefreshCcw, Trash2, AlertTriangle, MoreVertical, Sparkles } from 'lucide-vue-next'
import { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuContent, DropdownMenuItem } from 'radix-vue'
import GenerateReportDrawer from '~/components/reports/GenerateReportDrawer.vue'
import ConfirmCreditDialog from '~/components/ui/ConfirmCreditDialog.vue'
import PaywallExpressModal from '~/components/ui/PaywallExpressModal.vue'

const searchQuery = ref('')
const startDate = ref('')
const endDate = ref('')
const { data: profile } = useLazyFetch<any>('/api/profile', { key: 'profile' })
const { getCost } = useCreditCosts()
const { 
  isCreditConfirmOpen, 
  confirmTitle, 
  confirmDescription, 
  executeWithCreditCheck, 
  handleCreditConfirm, 
  handleCreditCancel 
} = useConfirmCreditAction()

const isPaywallOpen = ref(false)
const paywallReason = ref('')
const isReportDrawerOpen = ref(false)
const isGeneratingReport = ref(false)

const activeFiltersCount = computed(() => {
  let count = 0
  if (startDate.value || endDate.value) count++
  return count
})

function clearFilters() {
  startDate.value = ''
  endDate.value = ''
}

const { data: reports, refresh, pending } = useLazyFetch<any[]>('/api/reports', {
  query: computed(() => ({
    start: startDate.value,
    end: endDate.value
  }))
})

const filteredReports = computed(() => {
  if (!reports.value) return []
  if (!searchQuery.value) return reports.value
  
  const query = searchQuery.value.toLowerCase()
  return reports.value.filter(r => 
    r.content.toLowerCase().includes(query) ||
    new Date(r.createdAt).toLocaleDateString('pt-BR').includes(query)
  )
})

const { notify, confirm } = useAlerts()
const selectedReport = ref<any>(null)
const isViewModalOpen = ref(false)

function getReportScore(report: any): number | null {
  if (!report) return null
  if (typeof report.score === 'number') return report.score
  if (typeof report.context?.score === 'number') return report.context.score
  if (report.content) {
    const match = report.content.match(/Score[^\d\n]*(\d{1,3})/i)
    if (match && match[1]) {
      const val = parseInt(match[1], 10)
      if (val >= 0 && val <= 100) return val
    }
  }
  return null
}

function openView(report: any) {
  selectedReport.value = report
  isViewModalOpen.value = true
}

function downloadPdf(reportId: string) {
  window.open(`/api/reports/${reportId}/pdf`, '_blank')
}

function confirmDeleteReport(report: any) {
  if (!report || !report._id) return
  confirm({
    title: 'Excluir Relatório',
    description: 'Tem certeza que deseja excluir este relatório? Essa ação não pode ser desfeita.',
    variant: 'destructive',
    actionText: 'Excluir',
    onConfirm: async () => {
      try {
        await $fetch(`/api/reports/${report._id}`, { method: 'DELETE' })
        notify('Sucesso', 'Relatório excluído com sucesso.')
        if (selectedReport.value?._id === report._id) {
          isViewModalOpen.value = false
          selectedReport.value = null
        }
        await refresh()
      } catch (e: any) {
        notify('Erro', e.data?.statusMessage || 'Erro ao excluir relatório')
      }
    }
  })
}

async function handleConfirmReport(payload: { period: string }) {
  executeWithCreditCheck('analyzeReport', async () => {
    isGeneratingReport.value = true
    try {
      const now = new Date()
      let start = new Date()
      if (payload.period === 'last_7_days') start.setDate(now.getDate() - 7)
      else if (payload.period === 'last_30_days') start.setDate(now.getDate() - 30)
      else if (payload.period === 'last_90_days') start.setDate(now.getDate() - 90)
      else if (payload.period === 'year') start = new Date(now.getFullYear(), 0, 1)

      const query: any = { background: 'true' }
      if (payload.period !== 'all') {
        query.start = start.toISOString()
        query.end = now.toISOString()
      }

      const res: any = await $fetch('/api/ai/analyze', { query })
      notify('Relatório em Segundo Plano', res.message || 'Seu relatório estratégico de IA está sendo gerado em segundo plano. Assim que estiver pronto, você será notificado na Central de Notificações!')
      isReportDrawerOpen.value = false
    } catch (e: any) {
      if (e.statusCode === 402) {
        paywallReason.value = 'gerar relatório estratégico de IA'
        isPaywallOpen.value = true
      } else if (e.statusCode === 429) {
        notify('Limite Atingido', 'Você fez muitas requisições seguidas. Tente novamente em um minuto.')
      } else {
        notify('Erro', e.data?.statusMessage || 'Erro ao gerar relatório')
      }
    } finally {
      isGeneratingReport.value = false
    }
  }, { title: 'Gerar Relatório Estratégico com IA' })
}

const formatDate = (date: string) => new Date(date).toLocaleString('pt-BR')
</script>

<template>
  <div class="space-y-10 relative">
    <PageHeader title="Meus Relatórios IA" subtitle="Analises estratégicas geradas pela inteligência artificial.">
      <BaseButton data-tour="relatorios-gerar-btn" @click="isReportDrawerOpen = true" variant="primary" class="cursor-pointer">
        <Sparkles class="w-4 h-4 mr-2" />
        Gerar Novo Relatório
      </BaseButton>

      <template #filters>
        <BaseFilters :active-filters-count="activeFiltersCount" @clear="clearFilters">
          <template #search>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar no conteúdo do relatório..."
              class="w-full h-[52px] pl-12 pr-5 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-[0.5rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm"
            >
            <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
              <Search class="w-5 h-5" />
            </div>
          </template>

          <div class="w-full md:w-56 shrink-0">
            <BaseDateRangePicker 
              v-model:start="startDate"
              v-model:end="endDate"
            />
          </div>
        </BaseFilters>
      </template>
    </PageHeader>

    <!-- Listagem Unificada (desktop) -->
    <div class="hidden md:block">
    <BaseDataList data-tour="relatorios-lista"
      :items="filteredReports"
      :pending="pending"
      empty-title="Nenhum relatório encontrado"
      empty-subtitle="Você ainda não gerou relatórios IA ou os filtros não retornaram resultados."
    >
    <template #header>
        <th class="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Relatórios</th>
      </template>

      <template #item="{ item: report }">
        <div class="p-8 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6 border-b last:border-0 border-gray-100 dark:border-gray-800">
          <div class="flex items-center gap-6">
            <div class="space-y-1">
              <h4 class="text-lg font-black text-gray-900 dark:text-gray-50 leading-tight cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-all" @click="openView(report)">Análise Estratégica IA</h4>
              <div class="flex items-center gap-3">
                <span class="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar class="w-3 h-3" />
                  {{ formatDate(report.createdAt) }}
                </span>
                <span class="w-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"></span>
                <span class="text-xs font-bold text-blue-600 uppercase tracking-widest">
                  <BaseBadge variant="info">
                    {{ report.context?.totalProposals || 0 }} Orçamentos analisados
                  </BaseBadge>
                </span>
                <template v-if="getReportScore(report) !== null">
                  <span class="w-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"></span>
                  <span>
                    <BaseBadge :variant="getReportScore(report)! >= 70 ? 'success' : (getReportScore(report)! >= 50 ? 'warning' : 'error')">
                      Score {{ getReportScore(report) }}/100
                    </BaseBadge>
                  </span>
                </template>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button
              @click="openView(report)"
              class="p-2.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-[0.5rem] transition-all"
              title="Visualizar"
              aria-label="Visualizar relatório"
            >
              <Eye class="w-5 h-5" />
            </button>
            <DropdownMenuRoot>
                <DropdownMenuTrigger as-child>
                  <button
                    class="p-2.5 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-[0.5rem] transition-all"
                    title="Mais ações"
                    aria-label="Mais ações do orçamento"
                  >
                    <MoreVertical class="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuContent
                    align="end"
                    :side-offset="6"
                    class="min-w-[220px] bg-white dark:bg-gray-950 rounded-[0.5rem] shadow-xl border border-gray-100 dark:border-gray-800 p-2 z-50"
                  >
                  <DropdownMenuItem
                      @click="downloadPdf(report._id)"
                      class="flex items-center gap-3 px-4 py-3 rounded-[0.5rem] text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer outline-none transition-all"
                    >
                      <Download class="w-4 h-4" />
                      Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      @click="confirmDeleteReport(report)"
                      class="flex items-center gap-3 px-4 py-3 rounded-[0.5rem] text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-red-600 dark:hover:text-red-400 cursor-pointer outline-none transition-all"
                    >
                      <Trash2 class="w-4 h-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenuPortal>
              </DropdownMenuRoot>
          </div>
        </div>
      </template>

      <!-- Custom skeleton for report cards -->
      <template #skeleton>
        <div v-for="i in 3" :key="i" class="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-50">
          <div class="flex items-center gap-6">
            <BaseSkeleton width="4rem" height="4rem" borderRadius="1rem" />
            <div class="space-y-2">
              <BaseSkeleton width="180px" height="1.25rem" />
              <BaseSkeleton width="250px" height="0.75rem" />
            </div>
          </div>
          <div class="flex gap-3">
            <BaseSkeleton width="120px" height="2.5rem" borderRadius="1rem" />
            <BaseSkeleton width="150px" height="2.5rem" borderRadius="1rem" />
          </div>
        </div>
      </template>
    </BaseDataList>
    </div>

    <!-- Listagem em Cards (mobile) -->
    <div class="md:hidden space-y-4" data-tour="relatorios-lista">
      <template v-if="pending && filteredReports.length === 0">
        <BaseSkeleton v-for="i in 3" :key="i" height="8rem" borderRadius="1rem" />
      </template>
      <template v-else-if="filteredReports.length === 0">
        <div class="py-16 text-center">
          <p class="font-black text-gray-900 dark:text-gray-50">Nenhum relatório encontrado</p>
          <p class="text-sm text-gray-500 mt-1">Você ainda não gerou relatórios IA ou os filtros não retornaram resultados.</p>
        </div>
      </template>
      <template v-else>
        <ReportCard
          v-for="report in filteredReports"
          :key="report._id"
          :report="report"
          :format-date="formatDate"
          @view="openView(report)"
          @download="downloadPdf(report._id)"
          @delete="confirmDeleteReport(report)"
        />
      </template>
    </div>

    <!-- Modal de Visualização -->
    <BaseDialog
      v-model:open="isViewModalOpen"
      title="Relatório Estratégico IA"
      size="xl"
    >
      <div v-if="selectedReport">
        <div class="flex items-center gap-3 px-5 py-3 mb-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/30 rounded-2xl text-amber-800 dark:text-amber-200">
          <AlertTriangle class="w-5 h-5 shrink-0" />
          <p class="text-xs font-bold">Relatório gerado por Inteligência Artificial. Os dados e recomendações podem conter equívocos — sempre valide antes de tomar decisões críticas.</p>
        </div>
        <div class="prose prose-blue dark:prose-invert prose-headings:font-black prose-h2:text-blue-600 dark:prose-h2:text-blue-400 prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-blue-100 dark:prose-h2:border-gray-800 prose-p:leading-relaxed prose-p:mb-4 prose-table:my-6 prose-li:my-1 max-w-none p-8 bg-gray-50 dark:bg-gray-900/50 rounded-[2rem] border border-gray-100 dark:border-gray-800 min-h-[60vh]">
          <div v-html="$md.render(selectedReport.content)"></div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-between w-full items-center">
          <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Gerado em {{ formatDate(selectedReport?.createdAt) }}</span>
          <div class="flex gap-3">
            <BaseButton variant="secondary" @click="isViewModalOpen = false">Fechar</BaseButton>
            <BaseButton @click="confirmDeleteReport(selectedReport)" class="bg-red-600 hover:bg-red-700">
              <Trash2 class="w-4 h-4 mr-2" />
              Excluir
            </BaseButton>
            <BaseButton @click="downloadPdf(selectedReport._id)">
              <Download class="w-4 h-4 mr-2" />
              Download PDF
            </BaseButton>
          </div>
        </div>
      </template>
    </BaseDialog>

    <!-- Drawer de Geração de Relatório IA com seletor de dias -->
    <GenerateReportDrawer
      v-model:open="isReportDrawerOpen"
      period="last_30_days"
      :credits-balance="profile?.creditsBalance || 0"
      :credit-cost="getCost('analyzeReport')"
      :loading="isGeneratingReport"
      :allow-change-period="true"
      @confirm="handleConfirmReport"
    />

    <!-- Modal de Paywall Express -->
    <PaywallExpressModal 
      v-model:open="isPaywallOpen" 
      :reason="paywallReason" 
    />

    <!-- Modal de Confirmação de Consumo de Crédito IA -->
    <ConfirmCreditDialog
      v-model:open="isCreditConfirmOpen"
      :title="confirmTitle"
      :description="confirmDescription"
      @confirm="handleCreditConfirm"
      @cancel="handleCreditCancel"
    />
  </div>
</template>
