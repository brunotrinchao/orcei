<script setup lang="ts">
import { Search, Plus, CreditCard, Mail, Trash2, Shield, User, Loader2, ArrowRight } from 'lucide-vue-next'


const { notify } = useAlerts()
const { user } = useUserSession()
if (process.client && user.value?.role !== 'admin') {
  navigateTo('/dashboard')
}

const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 20

const { data: usersData, refresh, pending } = useFetch<any>('/api/admin/users', {
  query: computed(() => ({
    page: currentPage.value,
    limit: itemsPerPage,
    search: searchQuery.value
  })),
  watch: [currentPage, searchQuery]
})

const users = computed(() => usersData.value?.users || [])
const totalUsers = computed(() => usersData.value?.total || 0)

// Modal de Créditos
const isCreditModalOpen = ref(false)
const selectedUser = ref<any>(null)
const creditAmount = ref(1)
const creditAction = ref<'add' | 'remove' | 'set'>('add')
const isSavingCredits = ref(false)

function openCreditModal(user: any) {
  selectedUser.value = user
  creditAmount.value = 1
  isCreditModalOpen.value = true
}

async function updateCredits() {
  if (!selectedUser.value) return
  isSavingCredits.value = true
  try {
    await $fetch(`/api/admin/users/${selectedUser.value._id}/credits`, {
      method: 'PATCH',
      body: { amount: creditAmount.value, action: creditAction.value }
    })
    notify('Sucesso', 'Créditos atualizados com sucesso!')
    isCreditModalOpen.value = false
    refresh()
  } catch (e: any) {
    notify('Erro', e.data?.statusMessage || 'Erro ao atualizar créditos')
  } finally {
    isSavingCredits.value = false
  }
}

const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR')
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-8">
    <PageHeader title="Gestão de Usuários" subtitle="Monitore e gerencie as contas de todos os usuários da plataforma.">
      <template #default>
        <NuxtLink to="/admin" class="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline mr-6">Voltar ao Painel</NuxtLink>
        <BaseButton variant="secondary" @click="() => {}" class="opacity-50 cursor-not-allowed">
          <Plus class="w-4 h-4 mr-2" />
          Novo Usuário (Em breve)
        </BaseButton>
      </template>
    </PageHeader>

    <!-- Busca -->
    <div class="relative max-w-xl">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar por nome ou e-mail..."
        class="w-full pl-14 pr-6 py-5 bg-white border-2 border-gray-100 rounded-[2rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-gray-900 placeholder:text-gray-300 shadow-sm"
      >
      <div class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300">
        <Search class="w-6 h-6" />
      </div>
    </div>

    <!-- Tabela -->
    <div class="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50/50 border-b border-gray-200">
              <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Usuário</th>
              <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Plano</th>
              <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Créditos</th>
              <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Cadastro</th>
              <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="user in users" :key="user._id" class="hover:bg-gray-50/30 transition-all group">
              <td class="px-8 py-6">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                    <img v-if="user.avatar" :src="user.avatar" class="w-full h-full object-cover">
                    <User v-else class="w-5 h-5 text-gray-400" />
                  </div>
                  <div class="flex flex-col">
                    <span class="font-black text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">{{ user.name }}</span>
                    <span class="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-1">{{ user.email }}</span>
                  </div>
                </div>
              </td>
              <td class="px-8 py-6 text-center">
                <BaseBadge :variant="user.subscriptionPlan === 'premium' ? 'success' : user.subscriptionPlan === 'starter' ? 'info' : 'default'">
                  {{ user.subscriptionPlan.toUpperCase() }}
                </BaseBadge>
              </td>
              <td class="px-8 py-6 text-center font-black text-gray-900">
                {{ user.creditsBalance }}
              </td>
              <td class="px-8 py-6 text-center text-xs font-bold text-gray-500">
                {{ formatDate(user.createdAt) }}
              </td>
              <td class="px-8 py-6 text-right">
                <div class="flex justify-end gap-2">
                  <button @click="openCreditModal(user)" class="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Ajustar Créditos">
                    <CreditCard class="w-5 h-5" />
                  </button>
                  <button v-if="user.role === 'admin'" class="p-2.5 text-red-500 bg-red-50 rounded-xl" title="Administrador">
                    <Shield class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginação -->
      <div v-if="totalUsers > itemsPerPage" class="px-8 py-6 border-t border-gray-100 bg-gray-50/20 flex justify-center">
        <BasePagination 
          :total="totalUsers" 
          :items-per-page="itemsPerPage" 
          v-model:page="currentPage" 
        />
      </div>

      <div v-if="!pending && users?.length === 0" class="text-center py-20 text-gray-400 font-bold uppercase text-xs tracking-widest">
        Nenhum usuário encontrado.
      </div>
    </div>

    <!-- Modal de Créditos -->
    <BaseDialog v-model:open="isCreditModalOpen" title="Ajustar Créditos" size="md">
      <div v-if="selectedUser" class="p-6 space-y-6">
        <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-3xl border border-gray-100">
          <div class="w-12 h-12 rounded-xl bg-white flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
            <img v-if="selectedUser.avatar" :src="selectedUser.avatar" class="w-full h-full object-cover">
            <User v-else class="w-6 h-6 text-gray-300" />
          </div>
          <div>
            <p class="font-black text-gray-900 leading-none mb-1">{{ selectedUser.name }}</p>
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Saldo Atual: {{ selectedUser.creditsBalance }} créditos</p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex gap-2 p-1 bg-gray-100 rounded-2xl">
            <button 
              v-for="a in [{id: 'add', label: 'Adicionar'}, {id: 'remove', label: 'Remover'}, {id: 'set', label: 'Definir'}]" 
              :key="a.id"
              @click="creditAction = a.id as any"
              :class="creditAction === a.id ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500'"
              class="flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
            >
              {{ a.label }}
            </button>
          </div>

          <BaseInput 
            v-model.number="creditAmount" 
            type="number" 
            label="Quantidade de Créditos" 
            min="0"
          />
        </div>

        <div class="flex gap-3">
          <BaseButton variant="secondary" class="flex-1" @click="isCreditModalOpen = false">Cancelar</BaseButton>
          <BaseButton class="flex-[2]" :disabled="isSavingCredits" :loading="isSavingCredits" @click="updateCredits">
            Confirmar Alteração
            <ArrowRight class="w-4 h-4 ml-2" />
          </BaseButton>
        </div>
      </div>
    </BaseDialog>
  </div>
</template>
