<script setup lang="ts">
import { History, User, Activity, Clock } from 'lucide-vue-next'


const { user } = useUserSession()
if (process.client && user.value?.role !== 'admin') {
  navigateTo('/dashboard')
}

const currentPage = ref(1)
const itemsPerPage = 50

const { data: logsData, pending } = useFetch<any>('/api/admin/audit-logs', {
  query: computed(() => ({
    page: currentPage.value,
    limit: itemsPerPage
  })),
  watch: [currentPage]
})

const logs = computed(() => logsData.value?.logs || [])
const totalLogs = computed(() => logsData.value?.total || 0)

const formatDate = (date: string) => new Date(date).toLocaleString('pt-BR')
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-8">
    <PageHeader title="Logs de Auditoria" subtitle="Rastreabilidade total das ações realizadas por administradores.">
      <NuxtLink to="/admin" class="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">Voltar ao Painel</NuxtLink>
    </PageHeader>

    <div class="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50/50 border-b border-gray-100">
              <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data / Hora</th>
              <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Administrador</th>
              <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ação</th>
              <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Detalhes</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 text-xs">
            <tr v-for="log in logs" :key="log._id" class="hover:bg-gray-50/50 transition-all">
              <td class="px-8 py-5 text-gray-500 font-bold flex items-center gap-2">
                <Clock class="w-3 h-3" />
                {{ formatDate(log.createdAt) }}
              </td>
              <td class="px-8 py-5">
                <div class="flex items-center gap-2">
                  <User class="w-3.5 h-3.5 text-gray-400" />
                  <span class="font-black text-gray-900">{{ log.adminName }}</span>
                </div>
              </td>
              <td class="px-8 py-5">
                <span class="px-2 py-1 bg-gray-100 rounded text-[9px] font-black uppercase tracking-widest text-gray-600 border border-gray-200">
                  {{ log.action }}
                </span>
              </td>
              <td class="px-8 py-5 text-gray-500 font-medium">
                <pre class="text-[9px] bg-gray-50 p-2 rounded-lg max-w-xs overflow-hidden truncate">{{ JSON.stringify(log.details) }}</pre>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalLogs > itemsPerPage" class="px-8 py-6 border-t border-gray-100 bg-gray-50/20 flex justify-center">
        <BasePagination 
          :total="totalLogs" 
          :items-per-page="itemsPerPage" 
          v-model:page="currentPage" 
        />
      </div>
    </div>
  </div>
</template>
