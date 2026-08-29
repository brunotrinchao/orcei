<script setup lang="ts">
import { Plus, Pencil, Trash2, RotateCcw, Ticket } from 'lucide-vue-next'

const { user } = useUserSession()
if (process.client && user.value?.role !== 'admin') {
  navigateTo('/dashboard')
}

const { notify, confirm } = useAlerts()

const { data, refresh, pending } = useFetch<any>('/api/admin/coupons')
const coupons = computed(() => data.value?.coupons || [])

const audienceLabels: Record<string, string> = {
  all: 'Todos',
  new: 'Somente Novos',
  existing: 'Somente Antigos'
}

const audienceOptions = [
  { label: 'Todos os usuários', value: 'all' },
  { label: 'Somente novos usuários', value: 'new' },
  { label: 'Somente quem já assinou', value: 'existing' }
]

// Modal Criar
const isCreateOpen = ref(false)
const isSavingCreate = ref(false)
const createForm = ref({
  code: '',
  credits: 10,
  audience: 'all',
  expiresAt: '',
  maxRedemptions: null as number | null
})

function openCreateModal() {
  createForm.value = { code: '', credits: 10, audience: 'all', expiresAt: '', maxRedemptions: null }
  isCreateOpen.value = true
}

async function createCoupon() {
  isSavingCreate.value = true
  try {
    await $fetch('/api/admin/coupons', {
      method: 'POST',
      body: {
        code: createForm.value.code,
        credits: createForm.value.credits,
        audience: createForm.value.audience,
        expiresAt: createForm.value.expiresAt || undefined,
        maxRedemptions: createForm.value.maxRedemptions || undefined
      }
    })
    notify('Sucesso', 'Cupom criado com sucesso!')
    isCreateOpen.value = false
    refresh()
  } catch (e: any) {
    notify('Erro', e.data?.statusMessage || 'Erro ao criar cupom')
  } finally {
    isSavingCreate.value = false
  }
}

// Modal Editar
const isEditOpen = ref(false)
const isSavingEdit = ref(false)
const selectedCoupon = ref<any>(null)
const editForm = ref({ credits: 0, audience: 'all', active: true })

function openEditModal(coupon: any) {
  selectedCoupon.value = coupon
  editForm.value = { credits: coupon.credits, audience: coupon.audience, active: coupon.active }
  isEditOpen.value = true
}

async function saveEdit() {
  if (!selectedCoupon.value) return
  isSavingEdit.value = true
  try {
    await $fetch(`/api/admin/coupons/${selectedCoupon.value.id}`, {
      method: 'PATCH',
      body: {
        credits: editForm.value.credits,
        audience: editForm.value.audience,
        active: editForm.value.active
      }
    })
    notify('Sucesso', 'Cupom atualizado com sucesso!')
    isEditOpen.value = false
    refresh()
  } catch (e: any) {
    notify('Erro', e.data?.statusMessage || 'Erro ao atualizar cupom')
  } finally {
    isSavingEdit.value = false
  }
}

function confirmDeactivate(coupon: any) {
  confirm({
    title: 'Excluir Cupom',
    description: 'Isso vai desativar o cupom (a Stripe não permite exclusão definitiva). Continuar?',
    variant: 'destructive',
    actionText: 'Desativar',
    onConfirm: async () => {
      try {
        await $fetch(`/api/admin/coupons/${coupon.id}`, { method: 'DELETE' })
        notify('Sucesso', 'Cupom desativado com sucesso.')
        refresh()
      } catch (e: any) {
        notify('Erro', e.data?.statusMessage || 'Erro ao excluir cupom')
      }
    }
  })
}

async function reactivate(coupon: any) {
  try {
    await $fetch(`/api/admin/coupons/${coupon.id}`, { method: 'PATCH', body: { active: true } })
    notify('Sucesso', 'Cupom reativado com sucesso.')
    refresh()
  } catch (e: any) {
    notify('Erro', e.data?.statusMessage || 'Erro ao reativar cupom')
  }
}

const formatDate = (ts: number | null) => ts ? new Date(ts).toLocaleDateString('pt-BR') : 'Sem expiração'
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-8">
    <PageHeader title="Cupons Promocionais" subtitle="Crie e gerencie cupons de créditos resgatáveis via Stripe.">
      <template #default>
        <NuxtLink to="/admin" class="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline mr-6">Voltar ao Painel</NuxtLink>
        <BaseButton variant="primary" @click="openCreateModal">
          <Plus class="w-4 h-4 mr-2" />
          Novo Cupom
        </BaseButton>
      </template>
    </PageHeader>

    <!-- Listagem Unificada (desktop & mobile) -->
    <BaseDataList
      :columns="[
        { key: 'code', label: 'Código' },
        { key: 'credits', label: 'Créditos', align: 'center' },
        { key: 'audience', label: 'Público', align: 'center' },
        { key: 'redemptions', label: 'Usos', align: 'center' },
        { key: 'expiresAt', label: 'Expira em', align: 'center' },
        { key: 'status', label: 'Status', align: 'center' },
        { key: 'actions', label: 'Ações', align: 'right' }
      ]"
      :items="coupons || []"
      :pending="pending"
      empty-title="Nenhum cupom encontrado"
    >
      <template #cell-code="{ item: coupon }">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
            <Ticket class="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
          </div>
          <span class="font-black text-xs md:text-sm text-gray-900 dark:text-gray-100 tracking-wide">{{ coupon.code }}</span>
        </div>
      </template>

      <template #cell-credits="{ item: coupon }">
        <span class="font-black text-xs md:text-sm text-gray-900 dark:text-gray-100">{{ coupon.credits }}</span>
      </template>

      <template #cell-audience="{ item: coupon }">
        <BaseBadge variant="info">{{ audienceLabels[coupon.audience] || 'Todos' }}</BaseBadge>
      </template>

      <template #cell-redemptions="{ item: coupon }">
        <span class="text-xs font-bold text-gray-500 dark:text-gray-400">
          {{ coupon.timesRedeemed }} / {{ coupon.maxRedemptions ?? '∞' }}
        </span>
      </template>

      <template #cell-expiresAt="{ item: coupon }">
        <span class="text-xs font-bold text-gray-500 dark:text-gray-400">{{ formatDate(coupon.expiresAt) }}</span>
      </template>

      <template #cell-status="{ item: coupon }">
        <BaseBadge :variant="coupon.active ? 'success' : 'error'">{{ coupon.active ? 'Ativo' : 'Inativo' }}</BaseBadge>
      </template>

      <template #cell-actions="{ item: coupon }">
        <div class="flex justify-end gap-2" @click.stop>
          <button @click="openEditModal(coupon)" class="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-all" title="Editar">
            <Pencil class="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button v-if="coupon.active" @click="confirmDeactivate(coupon)" class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all" title="Excluir (desativa)">
            <Trash2 class="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button v-else @click="reactivate(coupon)" class="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-all" title="Reativar">
            <RotateCcw class="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </template>
    </BaseDataList>

    <!-- Modal Criar -->
    <BaseDialog v-model:open="isCreateOpen" title="Novo Cupom" size="md">
      <div class="space-y-5">
        <BaseInput v-model="createForm.code" label="Código do Cupom" placeholder="EX: PROMO20" />
        <BaseInput v-model.number="createForm.credits" type="number" label="Créditos Concedidos" />
        <BaseSelect v-model="createForm.audience" :options="audienceOptions" label="Público-alvo" />
        <BaseInput v-model="createForm.expiresAt" type="date" label="Expira em (opcional)" />
        <BaseInput v-model.number="createForm.maxRedemptions" type="number" label="Limite de usos (opcional)" placeholder="Ilimitado" />
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="isCreateOpen = false">Cancelar</BaseButton>
        <BaseButton variant="primary" :loading="isSavingCreate" @click="createCoupon">Criar Cupom</BaseButton>
      </template>
    </BaseDialog>

    <!-- Modal Editar -->
    <BaseDialog v-model:open="isEditOpen" title="Editar Cupom" size="md">
      <div class="space-y-5">
        <p class="text-xs font-bold text-gray-400 dark:text-gray-500 leading-relaxed">
          Código, expiração e limite de usos não podem ser alterados após a criação (restrição da Stripe) — desative este cupom e crie um novo se precisar mudar isso.
        </p>
        <BaseInput :model-value="selectedCoupon?.code" label="Código" disabled />
        <BaseInput v-model.number="editForm.credits" type="number" label="Créditos Concedidos" />
        <BaseSelect v-model="editForm.audience" :options="audienceOptions" label="Público-alvo" />
        <div class="flex items-center gap-3 pt-2">
          <BaseCheckbox v-model="editForm.active" id="edit-coupon-active" />
          <label for="edit-coupon-active" class="text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest cursor-pointer select-none">Cupom ativo</label>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="isEditOpen = false">Cancelar</BaseButton>
        <BaseButton variant="primary" :loading="isSavingEdit" @click="saveEdit">Salvar</BaseButton>
      </template>
    </BaseDialog>
  </div>
</template>
