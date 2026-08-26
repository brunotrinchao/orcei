import { ref, computed } from 'vue'
import { FileText, Download, Eye, Search, Calendar, RefreshCcw, Trash2, AlertTriangle, MoreVertical, Sparkles } from 'lucide-vue-next'
import { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuContent, DropdownMenuItem } from 'radix-vue'

export function useRelatoriosPage() {
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

  return {
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
    DropdownMenuItem,
  }
}
