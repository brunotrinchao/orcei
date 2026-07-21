import type { ComputedRef, Ref } from 'vue'

interface InfiniteListOptions {
  itemsPerPage?: number
  itemsKey?: string
  totalKey?: string
}

export function useInfiniteList<T = any>(
  url: string,
  query: ComputedRef<Record<string, any>>,
  options: InfiniteListOptions = {}
) {
  const { itemsPerPage = 10, itemsKey = 'items', totalKey = 'total' } = options
  const { startLoading, stopLoading } = usePageLoader()

  const allItems = ref<T[]>([]) as Ref<T[]>
  const total = ref(0)
  const currentPage = ref(1)
  const pending = ref(false)
  const loadingMore = ref(false)
  const hasMore = computed(() => allItems.value.length < total.value)

  let fetchId = 0

  async function fetchPage(page: number, replace = false) {
    const id = ++fetchId

    if (replace) {
      pending.value = true
    } else {
      loadingMore.value = true
      startLoading()
    }

    try {
      const res: any = await $fetch(url, {
        query: { ...query.value, page, limit: itemsPerPage }
      })
      if (id !== fetchId) return
      const newItems: T[] = res[itemsKey] || []
      allItems.value = replace ? newItems : [...allItems.value, ...newItems]
      total.value = res[totalKey] || 0
      currentPage.value = page
    } finally {
      if (id === fetchId) {
        pending.value = false
        loadingMore.value = false
        if (!replace) stopLoading()
      }
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value || pending.value) return
    await fetchPage(currentPage.value + 1)
  }

  async function reset() {
    allItems.value = []
    total.value = 0
    currentPage.value = 1
    await fetchPage(1, true)
  }

  watch(query, () => reset(), { deep: true })
  onMounted(() => reset())

  return {
    items: allItems,
    total,
    pending,
    loadingMore,
    hasMore,
    loadMore,
    reset,
  }
}
