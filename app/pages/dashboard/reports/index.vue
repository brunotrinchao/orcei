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

    <!-- Listagem Unificada -->
    <BaseDataList
      :items="filteredReports"
      :pending="pending"
      empty-title="Nenhum relatório encontrado"
      empty-subtitle="Você ainda não gerou relatórios IA ou os filtros não retornaram resultados."
    >
      <template #item="{ item: report }">
        <div class="p-8 hover:bg-gray-50/50 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6 border-b last:border-0 border-gray-100">
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
