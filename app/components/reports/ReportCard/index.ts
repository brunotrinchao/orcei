import { computed } from 'vue'
import { Calendar, Eye, Download, Trash2, ShieldCheck } from 'lucide-vue-next'

export function useReportCard(props: { report: any; formatDate: (date: string) => string }) {
  const score = computed(() => {
    if (typeof props.report?.score === 'number') return props.report.score
    if (typeof props.report?.context?.score === 'number') return props.report.context.score
    if (props.report?.content) {
      const match = props.report.content.match(/Score[^\d\n]*(\d{1,3})/i)
      if (match && match[1]) {
        const val = parseInt(match[1], 10)
        if (val >= 0 && val <= 100) return val
      }
    }
    return null
  })

  return {
    score,
    Calendar,
    Eye,
    Download,
    Trash2,
    ShieldCheck
  }
}
