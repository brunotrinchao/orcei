<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core'
import { Search, Plus, CreditCard, Mail, Trash2, Shield, User, Loader2, ArrowRight, LogIn, Eye } from 'lucide-vue-next'


const { notify, confirm } = useAlerts()
const { user, fetch: refreshSession } = useUserSession()
if (process.client && user.value?.role !== 'admin') {
  navigateTo('/dashboard')
}

const searchQuery = ref('')
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

const mobileSentinelRef = ref<HTMLElement | null>(null)
useIntersectionObserver(mobileSentinelRef, ([entry]) => {
  if (entry?.isIntersecting && hasMore.value && !loadingMore.value) {
    loadMore()
  }
}, { threshold: 0.1 })

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

// Modal de Detalhes do Usuário
const isDetailModalOpen = ref(false)
const selectedUserIdForDetail = ref<string | null>(null)

function openUserDetail(user: any) {
  if (user.role === 'admin') return
  selectedUserIdForDetail.value = user._id
  isDetailModalOpen.value = true
}

const isImpersonating = ref(false)

function confirmImpersonate(targetUser: any) {
  confirm({
    title: 'Personificar Usuário',
    description: `Você vai acessar a conta de "${targetUser.name}" como se fosse ele. Continuar?`,
    actionText: 'Personificar',
    onConfirm: async () => {
      isImpersonating.value = true
      try {
        await $fetch(`/api/admin/users/${targetUser._id}/impersonate`, { method: 'POST' })
        await refreshSession()
        navigateTo('/dashboard')
      } catch (e: any) {
        notify('Erro', e.data?.statusMessage || 'Erro ao personificar usuário')
      } finally {
        isImpersonating.value = false
      }
    }
  })
}
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
    <div class="max-w-lg">
      <BaseInput
        v-model="searchQuery"
        placeholder="Buscar por nome ou e-mail..."
        :icon="Search"
      />
    </div>

    <!-- Listagem Unificada (desktop & mobile) -->
    <BaseDataList
      :columns="[
        { key: 'user', label: 'Usuário' },
        { key: 'plan', label: 'Plano', align: 'center' },
        { key: 'credits', label: 'Créditos', align: 'center' },
        { key: 'createdAt', label: 'Cadastro', align: 'center' },
        { key: 'actions', label: 'Ações', align: 'right' }
      ]"
      :items="users || []"
      :pending="pending"
      :has-more="hasMore"
      :loading-more="loadingMore"
      @load-more="loadMore"
      empty-title="Nenhum usuário encontrado"
    >
      <template #cell-user="{ item: user }">
        <div 
          class="flex items-center gap-3"
          :class="user.role !== 'admin' ? 'cursor-pointer group' : ''"
          @click="user.role !== 'admin' ? openUserDetail(user) : null"
        >
          <div class="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm shrink-0">
            <img v-if="user.avatar" :src="user.avatar" class="w-full h-full object-cover" loading="lazy">
            <User v-else class="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
          </div>
          <div class="flex flex-col">
            <span class="font-black text-xs md:text-sm text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
              {{ user.name }}
            </span>
            <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight mt-0.5">
              {{ user.email }}
            </span>
          </div>
        </div>
      </template>

      <template #cell-plan="{ item: user }">
        <BaseBadge :variant="user.subscriptionPlan === 'premium' ? 'success' : user.subscriptionPlan === 'starter' ? 'info' : 'default'">
          {{ user.subscriptionPlan?.toUpperCase() || 'FREE' }}
        </BaseBadge>
      </template>

      <template #cell-credits="{ item: user }">
        <span class="font-black text-xs md:text-sm text-gray-900 dark:text-gray-100">{{ user.creditsBalance }}</span>
      </template>

      <template #cell-createdAt="{ item: user }">
        <span class="text-xs font-bold text-gray-500 dark:text-gray-400">{{ formatDate(user.createdAt) }}</span>
      </template>

      <template #cell-actions="{ item: user }">
        <div class="flex justify-end gap-2" @click.stop>
          <button v-if="user.role !== 'admin'" @click="openUserDetail(user)" class="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/60 rounded-xl transition-all" title="Ver Detalhes">
            <Eye class="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button @click="openCreditModal(user)" class="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-all" title="Ajustar Créditos">
            <CreditCard class="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button v-if="user.role !== 'admin'" :disabled="isImpersonating" @click="confirmImpersonate(user)" class="p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition-all disabled:opacity-50" title="Personificar Usuário">
            <LogIn class="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button v-if="user.role === 'admin'" class="p-2 text-red-500 bg-red-50 dark:bg-red-950/40 rounded-xl" title="Administrador">
            <Shield class="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </template>
    </BaseDataList>

    <!-- Modal de Créditos -->
    <BaseDialog v-model:open="isCreditModalOpen" title="Ajustar Créditos" size="md">
      <div v-if="selectedUser" class="p-6 space-y-6">
        <div class="flex items-center gap-4 p-4 bg-gray-50/50 dark:bg-gray-950/50 rounded-3xl border border-gray-100 dark:border-gray-800">
          <div class="w-12 h-12 rounded-xl bg-white dark:bg-gray-900 flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm overflow-hidden">
            <img v-if="selectedUser.avatar" :src="selectedUser.avatar" class="w-full h-full object-cover" loading="lazy">
            <User v-else class="w-6 h-6 text-gray-300 dark:text-gray-600" />
          </div>
          <div>
            <p class="font-black text-gray-900 dark:text-gray-100 leading-none mb-1">{{ selectedUser.name }}</p>
            <p class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Saldo Atual: {{ selectedUser.creditsBalance }} créditos</p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800/60 rounded-2xl">
            <button 
              v-for="a in [{id: 'add', label: 'Adicionar'}, {id: 'remove', label: 'Remover'}, {id: 'set', label: 'Definir'}]" 
              :key="a.id"
              @click="creditAction = a.id as any"
              :class="creditAction === a.id ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'"
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

    <!-- Modal de Detalhes do Usuário -->
    <UserDetailModal v-model:open="isDetailModalOpen" :user-id="selectedUserIdForDetail" />
  </div>
</template>
