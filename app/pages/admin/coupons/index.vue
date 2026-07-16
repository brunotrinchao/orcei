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

    <div class="hidden md:block">
    <BaseDataList
      :items="coupons"
      :pending="pending"
      empty-title="Nenhum cupom encontrado"
    >
      <template #header>
        <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Código</th>
        <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Créditos</th>
        <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Público</th>
        <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Usos</th>
        <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Expira em</th>
        <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
        <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
      </template>

      <template #item="{ item: coupon }">
        <tr class="hover:bg-gray-50/30 transition-all group">
          <td class="px-8 py-6">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <Ticket class="w-5 h-5 text-gray-400" />
              </div>
              <span class="font-black text-gray-900 tracking-wide">{{ coupon.code }}</span>
            </div>
          </td>
          <td class="px-8 py-6 text-center font-black text-gray-900">{{ coupon.credits }}</td>
          <td class="px-8 py-6 text-center">
            <BaseBadge variant="info">{{ audienceLabels[coupon.audience] || 'Todos' }}</BaseBadge>
          </td>
          <td class="px-8 py-6 text-center text-xs font-bold text-gray-500">
            {{ coupon.timesRedeemed }} / {{ coupon.maxRedemptions ?? '∞' }}
          </td>
          <td class="px-8 py-6 text-center text-xs font-bold text-gray-500">{{ formatDate(coupon.expiresAt) }}</td>
          <td class="px-8 py-6 text-center">
            <BaseBadge :variant="coupon.active ? 'success' : 'error'">{{ coupon.active ? 'Ativo' : 'Inativo' }}</BaseBadge>
          </td>
          <td class="px-8 py-6 text-right">
            <div class="flex justify-end gap-2">
              <button @click="openEditModal(coupon)" class="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Editar">
                <Pencil class="w-5 h-5" />
              </button>
              <button v-if="coupon.active" @click="confirmDeactivate(coupon)" class="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Excluir (desativa)">
                <Trash2 class="w-5 h-5" />
              </button>
              <button v-else @click="reactivate(coupon)" class="p-2.5 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all" title="Reativar">
                <RotateCcw class="w-5 h-5" />
              </button>
            </div>
          </td>
        </tr>
      </template>
    </BaseDataList>
    </div>

    <!-- Listagem em Cards (mobile) -->
    <div class="md:hidden space-y-4">
      <template v-if="pending && coupons.length === 0">
        <BaseSkeleton v-for="i in 3" :key="i" height="9rem" borderRadius="1rem" />
      </template>
      <template v-else-if="coupons.length === 0">
        <div class="py-16 text-center">
          <p class="font-black text-gray-900">Nenhum cupom encontrado</p>
        </div>
      </template>
      <template v-else>
        <CouponCard
          v-for="coupon in coupons"
          :key="coupon.id"
          :coupon="coupon"
          :audience-labels="audienceLabels"
          :format-date="formatDate"
          @edit="openEditModal(coupon)"
          @deactivate="confirmDeactivate(coupon)"
          @reactivate="reactivate(coupon)"
        />
      </template>
    </div>

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
        <p class="text-xs font-bold text-gray-400 leading-relaxed">
          Código, expiração e limite de usos não podem ser alterados após a criação (restrição da Stripe) — desative este cupom e crie um novo se precisar mudar isso.
        </p>
        <BaseInput :model-value="selectedCoupon?.code" label="Código" disabled />
        <BaseInput v-model.number="editForm.credits" type="number" label="Créditos Concedidos" />
        <BaseSelect v-model="editForm.audience" :options="audienceOptions" label="Público-alvo" />
        <label class="flex items-center gap-3 cursor-pointer select-none">
          <input v-model="editForm.active" type="checkbox" class="w-5 h-5 rounded-md border-2 border-gray-300 text-blue-600 focus:ring-blue-500">
          <span class="text-xs font-black text-gray-600 uppercase tracking-widest">Cupom ativo</span>
        </label>
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="isEditOpen = false">Cancelar</BaseButton>
        <BaseButton variant="primary" :loading="isSavingEdit" @click="saveEdit">Salvar</BaseButton>
      </template>
    </BaseDialog>
  </div>
</template>
