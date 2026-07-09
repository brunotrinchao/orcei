export function useCreditCosts() {
  const { data } = useFetch<any>('/api/system/status', { key: 'system-status' })
  const costs = computed(() => data.value?.creditCosts || {})

  function getCost(action: string): number {
    return costs.value[action] ?? 1
  }

  function creditLabel(action: string, prefix = ''): string {
    const cost = getCost(action)
    if (cost === 0) return prefix
    return `${prefix} (${cost} ${cost === 1 ? 'Crédito' : 'Créditos'})`.trim()
  }

  return { costs, getCost, creditLabel }
}
