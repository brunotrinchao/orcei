<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core'
import { History, User, Activity, Clock } from 'lucide-vue-next'


const { user } = useUserSession()
if (process.client && user.value?.role !== 'admin') {
  navigateTo('/dashboard')
}

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

const mobileSentinelRef = ref<HTMLElement | null>(null)
useIntersectionObserver(mobileSentinelRef, ([entry]) => {
  if (entry?.isIntersecting && hasMore.value && !loadingMore.value) {
    loadMore()
  }
}, { threshold: 0.1 })

const formatDate = (date: string) => new Date(date).toLocaleString('pt-BR')
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-8">
    <PageHeader title="Logs de Auditoria" subtitle="Rastreabilidade total das ações realizadas por administradores.">
      <NuxtLink to="/admin" class="text-xs font-black text-blue-600 hover:underline">Voltar ao Painel</NuxtLink>
    </PageHeader>

    <!-- Listagem Unificada (desktop & mobile) -->
    <BaseDataList
      :columns="[
        { key: 'createdAt', label: 'Data / Hora' },
        { key: 'adminName', label: 'Administrador' },
        { key: 'action', label: 'Ação' },
        { key: 'details', label: 'Detalhes' }
      ]"
      :items="logs || []"
      :pending="pending"
      :has-more="hasMore"
      :loading-more="loadingMore"
      @load-more="loadMore"
      empty-title="Nenhum log encontrado"
    >
      <template #cell-createdAt="{ item: log }">
        <div class="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400">
          <Clock class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          {{ formatDate(log.createdAt) }}
        </div>
      </template>

      <template #cell-adminName="{ item: log }">
        <div class="flex items-center gap-2">
          <User class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          <span class="font-black text-xs md:text-sm text-gray-900 dark:text-gray-100">{{ log.adminName }}</span>
        </div>
      </template>

      <template #cell-action="{ item: log }">
        <span class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-[9px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 inline-block">
          {{ log.action }}
        </span>
      </template>

      <template #cell-details="{ item: log }">
        <pre class="text-[9px] bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 p-2 rounded-lg max-w-xs overflow-hidden truncate border border-gray-100 dark:border-gray-800">{{ JSON.stringify(log.details) }}</pre>
      </template>
    </BaseDataList>
  </div>
</template>
