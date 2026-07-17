<script setup lang="ts">
import { FileText, Download, Eye, Search, Calendar, RefreshCcw, Trash2, AlertTriangle, MoreVertical } from 'lucide-vue-next'

import { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuContent, DropdownMenuItem } from 'radix-vue'
const searchQuery = ref('')
const startDate = ref('')
const endDate = ref('')

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

function openView(report: any) {
  selectedReport.value = report
  isViewModalOpen.value = true
}

function downloadPdf(reportId: string) {
  window.open(`/api/reports/${reportId}/pdf`, '_blank')
}

function confirmDeleteReport(report: any) {
  confirm({
    title: 'Excluir Relatório',
    description: 'Tem certeza que deseja excluir este relatório? Essa ação não pode ser desfeita.',
    variant: 'destructive',
    actionText: 'Excluir',
    onConfirm: async () => {
      try {
        await $fetch(`/api/reports/${report._id}`, { method: 'DELETE' })
        notify('Sucesso', 'Relatório excluído com sucesso.')
        if (selectedReport.value?._id === report._id) isViewModalOpen.value = false
        refresh()
      } catch (e: any) {
        notify('Erro', e.data?.statusMessage || 'Erro ao excluir relatório')
      }
    }
  })
}

const formatDate = (date: string) => new Date(date).toLocaleString('pt-BR')
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6">
    <PageHeader title="Meus Relatórios IA" subtitle="Analises estratégicas geradas pela inteligência artificial.">
      <BaseButton data-tour="relatorios-gerar-btn" to="/dashboard" variant="secondary">
        Gerar Novo Relatório
      </BaseButton>
    </PageHeader>

    <!-- Filtros -->
    <div class="flex flex-col md:flex-row gap-4 mb-10">
      <div class="relative flex-[2]">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar no conteúdo do relatório..."
          class="w-full pl-12 pr-6 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-gray-900 placeholder:text-gray-300 shadow-sm"
        >
        <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
          <Search class="w-5 h-5" />
        </div>
      </div>
      
      <div class="flex-1 min-w-[280px]">
        <BaseDateRangePicker 
          v-model:start="startDate"
          v-model:end="endDate"
        />
      </div>
    </div>

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
        <div class="p-8 hover:bg-gray-50/50 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6 border-b last:border-0 border-gray-100">
          <div class="flex items-center gap-6">
            <div class="space-y-1">
              <h4 class="text-lg font-black text-gray-900 leading-tight cursor-pointer hover:text-blue-600 transition-all" @click="openView(report)">Análise Estratégica IA</h4>
              <div class="flex items-center gap-3">
                <span class="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar class="w-3 h-3" />
                  {{ formatDate(report.createdAt) }}
                </span>
                <span class="w-1 h-1 bg-gray-200 rounded-full"></span>
                <span class="text-xs font-bold text-blue-600 uppercase tracking-widest">
                  <BaseBadge variant="info">
                    {{ report.context?.totalProposals || 0 }} Orçamentos analisados
                  </BaseBadge>
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button
              @click="openView(report)"
              class="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
              title="Visualizar"
              aria-label="Visualizar relatório"
            >
              <Eye class="w-5 h-5" />
            </button>
            <DropdownMenuRoot>
                <DropdownMenuTrigger as-child>
                  <button
                    class="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all"
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
                    class="min-w-[220px] bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50"
                  >
                  <DropdownMenuItem
                      @click="downloadPdf(report._id)"
                      class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-600 cursor-pointer outline-none transition-all"
                    >
                      <Download class="w-4 h-4" />
                      Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      @click="confirmDeleteReport(report)"
                      class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-600 cursor-pointer outline-none transition-all"
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
          <p class="font-black text-gray-900">Nenhum relatório encontrado</p>
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
        <div class="flex items-center gap-3 px-5 py-3 mb-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800">
          <AlertTriangle class="w-5 h-5 shrink-0" />
          <p class="text-xs font-bold">Relatório gerado por Inteligência Artificial. Os dados e recomendações podem conter equívocos — sempre valide antes de tomar decisões críticas.</p>
        </div>
        <div class="prose prose-blue prose-headings:font-black prose-h2:text-blue-600 prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-blue-100 prose-p:leading-relaxed prose-p:mb-4 prose-table:my-6 prose-li:my-1 max-w-none p-8 bg-gray-50 rounded-[2rem] border border-gray-100 min-h-[60vh]">
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
  </div>
</template>
