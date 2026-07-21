# Infinite Scroll (Desktop) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace desktop pagination (BasePagination) with infinite scroll (load on demand) identical to mobile behavior, using usePageLoader when fetching more items.

**Architecture:** New `useInfiniteList` composable handles item accumulation, page tracking, and usePageLoader integration. `BaseDataList` drops BasePagination and adds internal intersection-observer sentinel emitting `load-more`. All 5 paginated pages migrate; mobile-specific duplication in orcamentos is removed.

**Tech Stack:** Vue 3 Composition API, `@vueuse/core` (useIntersectionObserver already installed), Nuxt 3 `$fetch`, `usePageLoader` composable

## Global Constraints

- `usePageLoader` called only for "load more" fetches — initial loads use skeleton UI in BaseDataList
- `@vueuse/core` already installed — use `useIntersectionObserver`
- No new dependencies
- Mobile templates that bypass BaseDataList must also migrate (catalogo mobile grid, orcamentos mobile cards)
- `BasePagination.vue` stays unchanged (may be used elsewhere)
- `itemsKey`/`totalKey` options needed: audit-logs uses `logs`/`total`, users uses `users`/`total`

---

### Task 1: Create `useInfiniteList` composable

**Files:**
- Create: `app/composables/useInfiniteList.ts`

**Interfaces:**
- Produces: `useInfiniteList<T>(url, query, options?) → { items, total, pending, loadingMore, hasMore, loadMore, reset }`

- [ ] **Step 1: Create the file**

```typescript
// app/composables/useInfiniteList.ts
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
```

- [ ] **Step 2: Commit**

```bash
git add app/composables/useInfiniteList.ts
git commit -m "feat: add useInfiniteList composable for infinite scroll"
```

---

### Task 2: Refactor `BaseDataList.vue`

**Files:**
- Modify: `app/components/ui/BaseDataList.vue`

**Interfaces:**
- Removes props: `total`, `itemsPerPage`, `currentPage`; removes emit `update:currentPage`
- Adds props: `hasMore?: boolean`, `loadingMore?: boolean`
- Adds emit: `load-more`
- Sentinel div triggers emit when intersecting and `hasMore && !loadingMore`

- [ ] **Step 1: Rewrite the file**

Full replacement content:

```vue
<script setup lang="ts">
import { FileSearch } from 'lucide-vue-next'
import { useIntersectionObserver } from '@vueuse/core'

interface Props {
  items: any[] | null
  pending: boolean
  type?: 'table' | 'grid'
  emptyTitle?: string
  emptySubtitle?: string
  skeletonCount?: number
  hasMore?: boolean
  loadingMore?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'table',
  emptyTitle: 'Nenhum registro encontrado',
  emptySubtitle: 'Sua busca não retornou resultados ou a lista está vazia.',
  skeletonCount: 5,
  hasMore: false,
  loadingMore: false,
})

const emit = defineEmits(['load-more'])

const sentinelRef = ref<HTMLElement | null>(null)

useIntersectionObserver(sentinelRef, ([entry]) => {
  if (entry?.isIntersecting && props.hasMore && !props.loadingMore) {
    emit('load-more')
  }
}, { threshold: 0.1 })
</script>

<template>
  <div class="w-full">
    <!-- TABLE TYPE -->
    <div v-if="type === 'table'" class="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden transition-all">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead v-if="$slots.header">
            <tr class="bg-gray-50/50 border-b border-gray-200">
              <slot name="header" />
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <!-- Initial Loading State -->
            <template v-if="pending && (!items || items.length === 0)">
              <slot name="skeleton">
                <tr v-for="i in skeletonCount" :key="i">
                  <td colspan="100%" class="px-8 py-6">
                    <div class="flex items-center gap-4">
                      <BaseSkeleton width="3rem" height="3rem" borderRadius="1rem" />
                      <div class="space-y-2 flex-1">
                        <BaseSkeleton width="60%" height="1.25rem" />
                        <BaseSkeleton width="30%" height="0.75rem" />
                      </div>
                    </div>
                  </td>
                </tr>
              </slot>
            </template>

            <!-- Real Data -->
            <template v-else-if="items && items.length > 0">
              <slot name="item" v-for="(item, index) in items" :key="item._id || index" :item="item" :index="index" />
            </template>

            <!-- Load More Skeleton -->
            <template v-if="loadingMore && items && items.length > 0">
              <tr v-for="i in 3" :key="`more-${i}`">
                <td colspan="100%" class="px-8 py-6">
                  <div class="flex items-center gap-4">
                    <BaseSkeleton width="3rem" height="3rem" borderRadius="1rem" />
                    <div class="space-y-2 flex-1">
                      <BaseSkeleton width="60%" height="1.25rem" />
                      <BaseSkeleton width="30%" height="0.75rem" />
                    </div>
                  </div>
                </td>
              </tr>
            </template>

            <!-- Intersection Sentinel -->
            <tr v-if="hasMore">
              <td colspan="100%">
                <div ref="sentinelRef" class="h-1" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="!pending && (!items || items.length === 0)" class="text-center py-24 bg-white">
        <slot name="empty">
          <div class="w-20 h-20 bg-gray-50 text-gray-300 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
            <FileSearch class="w-10 h-10" />
          </div>
          <h3 class="text-xl font-black text-gray-900 uppercase tracking-tight">{{ emptyTitle }}</h3>
          <p class="text-gray-400 font-bold mt-2 px-6 max-w-sm mx-auto">{{ emptySubtitle }}</p>
        </slot>
      </div>
    </div>

    <!-- GRID TYPE -->
    <div v-else class="space-y-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Initial Loading State -->
        <template v-if="pending && (!items || items.length === 0)">
          <slot name="skeleton">
            <div v-for="i in skeletonCount" :key="i" class="bg-white rounded-[2.5rem] border-2 border-gray-100 p-8 space-y-6 shadow-sm">
              <BaseSkeleton width="100%" height="12rem" borderRadius="1.5rem" />
              <div class="space-y-3">
                <BaseSkeleton width="70%" height="1.5rem" />
                <BaseSkeleton width="100%" height="3rem" />
              </div>
            </div>
          </slot>
        </template>

        <!-- Real Data -->
        <template v-else-if="items && items.length > 0">
          <slot name="item" v-for="(item, index) in items" :key="item._id || index" :item="item" :index="index" />
        </template>
      </div>

      <!-- Load More Skeleton (grid) -->
      <div v-if="loadingMore && items && items.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="i in 3" :key="`more-${i}`" class="bg-white rounded-[2.5rem] border-2 border-gray-100 p-8 space-y-6 shadow-sm">
          <BaseSkeleton width="100%" height="12rem" borderRadius="1.5rem" />
          <div class="space-y-3">
            <BaseSkeleton width="70%" height="1.5rem" />
            <BaseSkeleton width="100%" height="3rem" />
          </div>
        </div>
      </div>

      <!-- Intersection Sentinel (grid) -->
      <div ref="sentinelRef" v-if="hasMore" class="h-1" />

      <!-- Empty State -->
      <div v-if="!pending && (!items || items.length === 0)" class="text-center py-32 bg-white rounded-[3rem] border-2 border-gray-100">
        <slot name="empty">
          <div class="w-24 h-24 bg-gray-50 text-gray-300 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
            <FileSearch class="w-12 h-12" />
          </div>
          <h3 class="text-2xl font-black text-gray-900 uppercase tracking-tight">{{ emptyTitle }}</h3>
          <p class="text-gray-400 font-bold mt-2 px-6 max-w-sm mx-auto">{{ emptySubtitle }}</p>
        </slot>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/ui/BaseDataList.vue
git commit -m "refactor: replace BasePagination with infinite scroll sentinel in BaseDataList"
```

---

### Task 3: Migrate `clientes/index.vue`

**Files:**
- Modify: `app/pages/clientes/index.vue`

- [ ] **Step 1: Replace script fetch + pagination**

Remove:
```typescript
const currentPage = ref(1)
const itemsPerPage = 10

const { data: clientsData, refresh, pending } = useLazyFetch<any>('/api/clients', {
  query: computed(() => ({
    page: currentPage.value,
    limit: itemsPerPage,
    search: searchQuery.value
  })),
  watch: [currentPage, searchQuery]
})

const clients = computed(() => clientsData.value?.items || [])
const totalClients = computed(() => clientsData.value?.total || 0)
```

Add (after `searchQuery` declaration):
```typescript
const itemsPerPage = 10
const query = computed(() => ({ search: searchQuery.value }))
const {
  items: clients,
  total: totalClients,
  pending,
  loadingMore,
  hasMore,
  loadMore,
  reset: refresh,
} = useInfiniteList('/api/clients', query, { itemsPerPage })
```

- [ ] **Step 2: Update `BaseDataList` in template**

Remove `:total="totalClients"`, `:items-per-page="itemsPerPage"`, `v-model:current-page="currentPage"`.

Add `:has-more="hasMore"`, `:loading-more="loadingMore"`, `@load-more="loadMore"`.

- [ ] **Step 3: Commit**

```bash
git add app/pages/clientes/index.vue
git commit -m "feat(clientes): migrate to infinite scroll pagination"
```

---

### Task 4: Migrate `orcamentos/index.vue` — remove mobile duplication

**Files:**
- Modify: `app/pages/orcamentos/index.vue`

- [ ] **Step 1: Replace desktop fetch + remove all mobile state**

Remove (~lines 12–107):
```typescript
const currentPage = ref(1)
const itemsPerPage = 10
const { data: proposalsData, refresh, pending } = useLazyFetch<any>('/api/proposals', { ... })
const proposals = computed<any[]>(() => proposalsData.value?.items || [])
const totalProposals = computed(() => proposalsData.value?.total || 0)
// Infinite scroll (mobile)
const mobileProposals = ref<ProposalDTO[]>([])
const mobilePage = ref(1)
const mobileTotal = ref(0)
const isMobileFetching = ref(false)
const mobileInitialLoading = ref(true)
const mobileHasMore = computed(...)
const sentinelRef = ref<HTMLElement | null>(null)
function isMobileViewport() { ... }
async function fetchMobilePage(...) { ... }
function resetMobileList() { ... }
function refreshBoth() { ... }
watch([searchQuery, ...], () => resetMobileList())
useIntersectionObserver(sentinelRef, ...)
```

Add (after `hasFilters` computed):
```typescript
const itemsPerPage = 10
const query = computed(() => ({
  search: searchQuery.value,
  status: filterStatus.value,
  startDate: filterStartDate.value,
  endDate: filterEndDate.value,
  pendingChat: filterPendingChat.value,
}))

const {
  items: proposals,
  total: totalProposals,
  pending,
  loadingMore,
  hasMore,
  loadMore,
  reset: refresh,
} = useInfiniteList<ProposalDTO>('/api/proposals', query, { itemsPerPage })

const mobileSentinelRef = ref<HTMLElement | null>(null)
useIntersectionObserver(mobileSentinelRef, ([entry]) => {
  if (entry?.isIntersecting && hasMore.value && !loadingMore.value) {
    loadMore()
  }
}, { threshold: 0.1 })
```

- [ ] **Step 2: Fix `onMounted` — remove `resetMobileList()` call**

In `onMounted`, remove the line `resetMobileList()`.

- [ ] **Step 3: Replace all `refreshBoth()` calls with `refresh()`**

Search all occurrences of `refreshBoth()` and replace with `refresh()`.

- [ ] **Step 4: Update desktop `BaseDataList` template**

Remove `:total`, `:items-per-page`, `v-model:current-page`.
Add `:has-more="hasMore"`, `:loading-more="loadingMore"`, `@load-more="loadMore"`.

- [ ] **Step 5: Update mobile template**

- `v-for="proposal in mobileProposals"` → `v-for="proposal in proposals"`
- `ref="sentinelRef"` on sentinel div → `ref="mobileSentinelRef"`
- `v-if="isMobileFetching"` loading text → `v-if="loadingMore"`
- Remove any `v-if="mobileInitialLoading"` skeleton blocks (use `pending` from composable)

- [ ] **Step 6: Commit**

```bash
git add app/pages/orcamentos/index.vue
git commit -m "feat(orcamentos): unify desktop/mobile to single infinite scroll"
```

---

### Task 5: Migrate `catalogo/index.vue`

**Files:**
- Modify: `app/pages/catalogo/index.vue`

- [ ] **Step 1: Replace fetch in script**

Remove:
```typescript
const currentPage = ref(1)
const itemsPerPage = 10
const { data: catalogData, refresh, pending } = useLazyFetch<any>('/api/catalog', { ... })
const items = computed(() => catalogData.value?.items || [])
const totalItems = computed(() => catalogData.value?.total || 0)
```

Add:
```typescript
const itemsPerPage = 10
const query = computed(() => ({ search: searchQuery.value }))
const {
  items,
  total: totalItems,
  pending,
  loadingMore,
  hasMore,
  loadMore,
  reset: refresh,
} = useInfiniteList('/api/catalog', query, { itemsPerPage })

const mobileSentinelRef = ref<HTMLElement | null>(null)
useIntersectionObserver(mobileSentinelRef, ([entry]) => {
  if (entry?.isIntersecting && hasMore.value && !loadingMore.value) {
    loadMore()
  }
}, { threshold: 0.1 })
```

- [ ] **Step 2: Update desktop `BaseDataList`**

Remove `:total`, `:items-per-page`, `v-model:current-page`.
Add `:has-more="hasMore"`, `:loading-more="loadingMore"`, `@load-more="loadMore"`.

- [ ] **Step 3: Update mobile grid template**

Remove:
```html
<div v-if="totalItems > itemsPerPage" class="flex justify-center pt-2">
  <BasePagination :total="totalItems" :items-per-page="itemsPerPage" v-model="currentPage" />
</div>
```

Add after cards loop:
```html
<div ref="mobileSentinelRef" class="h-1" />
<div v-if="loadingMore" class="py-4 text-center text-sm text-gray-400 font-bold">Carregando...</div>
```

- [ ] **Step 4: Commit**

```bash
git add app/pages/catalogo/index.vue
git commit -m "feat(catalogo): migrate to infinite scroll, remove mobile BasePagination"
```

---

### Task 6: Migrate `admin/audit-logs.vue`

**Files:**
- Modify: `app/pages/admin/audit-logs.vue`

- [ ] **Step 1: Replace fetch in script**

Remove:
```typescript
const currentPage = ref(1)
const itemsPerPage = 50
const { data: logsData, pending } = useFetch<any>('/api/admin/audit-logs', { ... })
const logs = computed(() => logsData.value?.logs || [])
const totalLogs = computed(() => logsData.value?.total || 0)
```

Add:
```typescript
const itemsPerPage = 50
const query = computed(() => ({}))
const {
  items: logs,
  total: totalLogs,
  pending,
  loadingMore,
  hasMore,
  loadMore,
} = useInfiniteList('/api/admin/audit-logs', query, { itemsPerPage, itemsKey: 'logs' })
```

- [ ] **Step 2: Update `BaseDataList` template**

Remove `:total`, `:items-per-page`, `v-model:current-page`.
Add `:has-more="hasMore"`, `:loading-more="loadingMore"`, `@load-more="loadMore"`.

- [ ] **Step 3: Commit**

```bash
git add app/pages/admin/audit-logs.vue
git commit -m "feat(admin/audit-logs): migrate to infinite scroll"
```

---

### Task 7: Migrate `admin/users/index.vue`

**Files:**
- Modify: `app/pages/admin/users/index.vue`

- [ ] **Step 1: Replace fetch in script**

Remove:
```typescript
const currentPage = ref(1)
const itemsPerPage = 20
const { data: usersData, refresh, pending } = useFetch<any>('/api/admin/users', { ... })
const users = computed(() => usersData.value?.users || [])
const totalUsers = computed(() => usersData.value?.total || 0)
```

Add:
```typescript
const itemsPerPage = 20
const query = computed(() => ({ search: searchQuery.value }))
const {
  items: users,
  total: totalUsers,
  pending,
  loadingMore,
  hasMore,
  loadMore,
  reset: refresh,
} = useInfiniteList('/api/admin/users', query, { itemsPerPage, itemsKey: 'users' })
```

- [ ] **Step 2: Update `BaseDataList` template**

Remove `:total`, `:items-per-page`, `v-model:current-page`.
Add `:has-more="hasMore"`, `:loading-more="loadingMore"`, `@load-more="loadMore"`.

- [ ] **Step 3: Commit**

```bash
git add app/pages/admin/users/index.vue
git commit -m "feat(admin/users): migrate to infinite scroll"
```
