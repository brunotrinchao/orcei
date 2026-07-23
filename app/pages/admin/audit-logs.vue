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
      <NuxtLink to="/admin" class="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">Voltar ao Painel</NuxtLink>
    </PageHeader>

    <!-- Listagem Unificada (desktop) -->
    <div class="hidden md:block">
    <BaseDataList
      :items="logs"
      :pending="pending"
      :has-more="hasMore"
      :loading-more="loadingMore"
      @load-more="loadMore"
      empty-title="Nenhum log encontrado"
    >
      <template #header>
        <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data / Hora</th>
        <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Administrador</th>
        <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ação</th>
        <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Detalhes</th>
      </template>

      <template #item="{ item: log }">
        <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all text-xs">
          <td class="px-8 py-5 text-gray-500 dark:text-gray-400 font-bold flex items-center gap-2">
            <Clock class="w-3 h-3 text-gray-400 dark:text-gray-500" />
            {{ formatDate(log.createdAt) }}
          </td>
          <td class="px-8 py-5">
            <div class="flex items-center gap-2">
              <User class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
              <span class="font-black text-gray-900 dark:text-gray-100">{{ log.adminName }}</span>
            </div>
          </td>
          <td class="px-8 py-5">
            <span class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-[9px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
              {{ log.action }}
            </span>
          </td>
          <td class="px-8 py-5 text-gray-500 dark:text-gray-400 font-medium">
            <pre class="text-[9px] bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 p-2 rounded-lg max-w-xs overflow-hidden truncate border border-gray-100 dark:border-gray-800">{{ JSON.stringify(log.details) }}</pre>
          </td>
        </tr>
      </template>
    </BaseDataList>
    </div>

    <!-- Listagem em Cards (mobile) -->
    <div class="md:hidden space-y-4">
      <template v-if="pending && logs.length === 0">
        <BaseSkeleton v-for="i in 3" :key="i" height="7rem" borderRadius="1rem" />
      </template>
      <template v-else-if="logs.length === 0">
        <div class="py-16 text-center">
          <p class="font-black text-gray-900">Nenhum log encontrado</p>
        </div>
      </template>
      <template v-else>
        <AuditLogCard
          v-for="(log, index) in logs"
          :key="log._id || index"
          :log="log"
          :format-date="formatDate"
        />
        <div ref="mobileSentinelRef" v-if="hasMore" class="h-1" />
        <div v-if="loadingMore" class="py-4 text-center text-sm text-gray-400 font-bold">Carregando...</div>
      </template>
    </div>
  </div>
</template>
