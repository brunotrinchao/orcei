<script setup lang="ts">
import { FileText, Download, Eye, Search, Calendar, RefreshCcw, Sparkles } from 'lucide-vue-next'

const searchQuery = ref('')
const startDate = ref('')
const endDate = ref('')

const { data: reports, refresh, pending } = useFetch<any[]>('/api/reports', {
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

const { notify } = useAlerts()
const selectedReport = ref<any>(null)
const isViewModalOpen = ref(false)

function openView(report: any) {
  selectedReport.value = report
  isViewModalOpen.value = true
}

function downloadPdf(reportId: string) {
  window.open(`/api/reports/${reportId}/pdf`, '_blank')
}

const formatDate = (date: string) => new Date(date).toLocaleString('pt-BR')
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6">
    <PageHeader title="Meus Relatórios IA" subtitle="Analises estratégicas geradas pela inteligência artificial.">
      <BaseButton to="/dashboard" variant="secondary">
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

    <!-- Listagem -->
    <div class="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
      <div v-if="pending" class="p-20 text-center space-y-4">
        <RefreshCcw class="w-10 h-10 text-blue-600 animate-spin mx-auto" />
        <p class="text-gray-400 font-black uppercase tracking-widest text-xs">Carregando Relatórios...</p>
      </div>

      <div v-else-if="!filteredReports.length" class="p-20 text-center space-y-6">
        <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
          <FileText class="w-10 h-10 text-gray-300" />
        </div>
        <div class="space-y-2">
          <h3 class="text-xl font-black text-gray-900 uppercase tracking-tight">Nenhum relatório encontrado</h3>
          <p class="text-gray-500 font-medium">Você ainda não gerou relatórios IA ou os filtros não retornaram resultados.</p>
        </div>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div v-for="report in filteredReports" :key="report._id" class="p-8 hover:bg-gray-50/50 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="flex items-center gap-6">
            <div class="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
              <Sparkles class="w-8 h-8" />
            </div>
            <div class="space-y-1">
              <h4 class="text-lg font-black text-gray-900 leading-tight">Análise Estratégica IA</h4>
              <div class="flex items-center gap-3">
                <span class="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar class="w-3 h-3" />
                  {{ formatDate(report.createdAt) }}
                </span>
                <span class="w-1 h-1 bg-gray-200 rounded-full"></span>
                <span class="text-xs font-bold text-blue-600 uppercase tracking-widest">
                  {{ report.context?.totalProposals || 0 }} Orçamentos analisados
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <BaseButton variant="outline" size="sm" @click="openView(report)">
              <Eye class="w-4 h-4 mr-2" />
              Visualizar
            </BaseButton>
            <BaseButton size="sm" @click="downloadPdf(report._id)">
              <Download class="w-4 h-4 mr-2" />
              Download PDF
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Visualização -->
    <BaseDialog
      v-model:open="isViewModalOpen"
      title="Relatório Estratégico IA"
      size="xl"
    >
      <div v-if="selectedReport" class="prose prose-blue max-w-none p-6 bg-gray-50 rounded-[2rem] border border-gray-100 min-h-[60vh]">
        <div v-html="$md.render(selectedReport.content)"></div>
      </div>
      <template #footer>
        <div class="flex justify-between w-full items-center">
          <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Gerado em {{ formatDate(selectedReport?.createdAt) }}</span>
          <div class="flex gap-3">
            <BaseButton variant="secondary" @click="isViewModalOpen = false">Fechar</BaseButton>
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
