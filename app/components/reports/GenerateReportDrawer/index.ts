import { ref, computed, watch } from 'vue'
import {
  Sparkles,
  Loader2,
  Calendar,
  Coins,
  TrendingUp,
  DollarSign,
  Clock,
  Award,
  Zap
} from 'lucide-vue-next'

export function useGenerateReportDrawer(
  props: { open: boolean; period?: string; periodLabel?: string; stats?: any; creditsBalance?: number; creditCost?: number; loading?: boolean; allowChangePeriod?: boolean },
  emit: (e: 'close' | 'update:open' | 'confirm' | 'update:period', payload?: any) => void
) {
  const localPeriod = ref(props.period || 'last_30_days')

  watch(() => props.open, (isOpen) => {
    if (isOpen) {
      localPeriod.value = props.period || 'last_30_days'
    }
  })

  watch(() => props.period, (newP) => {
    if (newP) localPeriod.value = newP
  })

  const periodOptions = [
    { label: '7D', value: 'last_7_days', fullLabel: 'Últimos 7 dias' },
    { label: '30D', value: 'last_30_days', fullLabel: 'Últimos 30 dias' },
    { label: '90D', value: 'last_90_days', fullLabel: 'Últimos 90 dias' },
    { label: 'Este ano', value: 'year', fullLabel: 'Este ano' },
    { label: 'Total', value: 'all', fullLabel: 'Todo o período' }
  ]

  const currentPeriodObj = computed(() => {
    return periodOptions.find(p => p.value === localPeriod.value) || { label: '30D', value: 'last_30_days', fullLabel: 'Últimos 30 dias' }
  })

  function selectPeriod(val: string) {
    localPeriod.value = val
    emit('update:period', val)
  }

  const fetchQuery = computed(() => {
    const now = new Date()
    let start = new Date()
    
    if (localPeriod.value === 'last_7_days') start.setDate(now.getDate() - 7)
    else if (localPeriod.value === 'last_30_days') start.setDate(now.getDate() - 30)
    else if (localPeriod.value === 'last_90_days') start.setDate(now.getDate() - 90)
    else if (localPeriod.value === 'year') start = new Date(now.getFullYear(), 0, 1)
    else return {}

    return { start: start.toISOString(), end: now.toISOString() }
  })

  const { data: drawerStats, pending: statsPending } = useLazyFetch<any>('/api/dashboard/stats', {
    key: 'drawer-dashboard-stats',
    query: fetchQuery,
    watch: [localPeriod],
    immediate: true
  })

  const activeStats = computed(() => {
    if (props.stats && localPeriod.value === props.period) {
      return props.stats
    }
    return drawerStats.value || props.stats || {}
  })

  function close() {
    if (props.loading) return
    emit('close')
    emit('update:open', false)
  }

  function handleOpenUpdate(val: boolean) {
    if (!val) {
      close()
    }
  }

  function handleConfirm() {
    emit('confirm', { period: localPeriod.value })
  }

  return {
    localPeriod,
    periodOptions,
    currentPeriodObj,
    selectPeriod,
    statsPending,
    activeStats,
    close,
    handleOpenUpdate,
    handleConfirm,
    Sparkles,
    Loader2,
    Calendar,
    Coins,
    TrendingUp,
    DollarSign,
    Clock,
    Award,
    Zap
  }
}
