<script setup lang="ts">
import { ref, computed } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import * as LucideIcons from 'lucide-vue-next'
import { Plus, Search, Image, Pencil, Trash2, Sparkles, RefreshCcw, Package, ShoppingBag, HelpCircle, MoreVertical } from 'lucide-vue-next'
import { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuContent, DropdownMenuItem } from 'radix-vue'
import type { CatalogItemDTO } from '../../../../types'

const { notify, confirm: confirmAlert } = useAlerts()

const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

const { data: catalogData, refresh, pending } = useLazyFetch<any>('/api/catalog', {
  query: computed(() => ({
    page: currentPage.value,
    limit: itemsPerPage,
    search: searchQuery.value
  })),
  watch: [currentPage, searchQuery]
})

const items = computed(() => catalogData.value?.items || [])
const totalItems = computed(() => catalogData.value?.total || 0)

const showForm = ref(false)
const selectedItem = ref<CatalogItemDTO | null>(null)

const showCropper = ref(false)
const rawImage = ref<string | null>(null)
const cropperRef = ref<any>(null)

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    rawImage.value = e.target?.result as string
    showCropper.value = true
  }
  reader.readAsDataURL(file)
}

async function cropImage() {
  if (!cropperRef.value) return

  const { canvas } = cropperRef.value.getResult()
  if (!canvas) return

  const finalCanvas = document.createElement('canvas')
  finalCanvas.width = 400
  finalCanvas.height = 400
  const ctx = finalCanvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, 400, 400)
  ctx.drawImage(canvas, 0, 0, 400, 400)

  const base64Image = finalCanvas.toDataURL('image/jpeg', 0.8)

  isSubmitting.value = true
  try {
    const data = await ($fetch as any)('/api/upload/cloudinary', {
      method: 'POST',
      body: { image: base64Image, folder: 'catalog' }
    }) as { url: string }

    if (!data?.url) throw new Error('URL não retornada pelo Cloudinary')
    form.value.imageUrl = data.url
    showCropper.value = false
    rawImage.value = null
  } catch (e) {
    console.error('[Catalog] Image upload failed:', e)
    notify('Erro', 'Não foi possível fazer upload da imagem.')
  } finally {
    isSubmitting.value = false
  }
}

const form = ref({
  type: 'service' as 'product' | 'service',
  name: '',
  description: '',
  price: 0 as any,
  unit: 'UN',
  sku: '',
  imageUrl: '',
  icon: 'Package'
})

const isSubmitting = ref(false)
const isGenerating = ref(false)
const showAIDialog = ref(false)
const aiPromptText = ref('')

const unitOptions = [
  { label: 'Unidade (UN)', value: 'UN' },
  { label: 'Hora (H)', value: 'H' },
  { label: 'Dia (DIA)', value: 'DIA' },
  { label: 'Mês (MES)', value: 'MES' },
  { label: 'Kilograma (KG)', value: 'KG' },
  { label: 'Centímetro (CM)', value: 'CM' },
  { label: 'Mililitro (ML)', value: 'ML' }
]

const typeOptions = [
  { label: 'Serviço', value: 'service' },
  { label: 'Produto', value: 'product' }
]

function openModal(item: CatalogItemDTO | null = null) {
  if (item) {
    selectedItem.value = item
    form.value = { 
      type: item.type,
      name: item.name, 
      description: item.description || '', 
      price: item.price, 
      unit: item.unit || 'UN',
      sku: item.sku || '',
      imageUrl: item.imageUrl || '',
      icon: item.icon || 'Package'
    }
  } else {
    selectedItem.value = null
    form.value = { 
      type: 'service',
      name: '', 
      description: '', 
      price: 0, 
      unit: 'UN',
      sku: '',
      imageUrl: '',
      icon: 'Package'
    }
  }
  showForm.value = true
}

function handleItemSaved() {
  refresh()
}

async function deleteItem(id: string) {
  confirmAlert({
    title: 'Excluir Item',
    description: 'Tem certeza que deseja excluir este item?',
    variant: 'destructive',
    actionText: 'Excluir',
    onConfirm: async () => {
      try {
        await $fetch(`/api/catalog/${id}`, { method: 'DELETE' as any })
        refresh()
      } catch (e) {
        notify('Erro', 'Erro ao excluir item')
      }
    }
  })
}

function getIcon(name: string) {
  return (LucideIcons as any)[name] || HelpCircle
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6">
    <PageHeader title="Seu Catálogo" subtitle="Unifique seus produtos e serviços em um só lugar.">
      <BaseButton data-tour="catalogo-novo-item-btn" @click="openModal()" class="w-full sm:w-auto shadow-2xl shadow-blue-100">
        Novo Item do Catálogo
      </BaseButton>
    </PageHeader>

    <!-- Filtros -->
    <div data-tour="catalogo-busca" class="mb-10 relative max-w-xl">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar por nome, descrição ou SKU..." 
        class="w-full pl-14 pr-6 py-5 bg-white border-2 border-gray-100 rounded-[2rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-gray-900 placeholder:text-gray-300 shadow-sm"
      >
      <div class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300">
        <Search class="w-6 h-6" />
      </div>
    </div>

    <!-- Modal de Formulário -->
    <CatalogItemFormDialog 
      v-model:open="showForm" 
      :itemToEdit="selectedItem" 
      @saved="handleItemSaved" 
    />

    <!-- Listagem Unificada (desktop) -->
    <div class="hidden md:block">
    <BaseDataList
      :items="items"
      :pending="pending"
      :total="totalItems"
      :items-per-page="itemsPerPage"
      v-model:current-page="currentPage"
      empty-title="Catálogo Vazio"
      empty-subtitle="Sua lista de produtos e serviços aparecerá aqui. Comece cadastrando o primeiro."
    >
      <template #header>
        <th class="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Item do Catálogo</th>
        <th class="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] text-center">Tipo</th>
        <th class="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] text-right">Preço</th>
        <th class="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] text-right"></th>
      </template>

      <template #item="{ item }">
        <tr class="hover:bg-gray-50/30 transition-all group">
          <td class="px-10 py-8">
            <div class="flex items-center gap-6">
              <div class="w-16 h-16 rounded-2xl border-2 border-gray-100 bg-white overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm">
                <img v-if="item.imageUrl" :src="item.imageUrl" class="w-full h-full object-cover" loading="lazy">
                <div v-else class="text-gray-400">
                  <component :is="getIcon(item.icon || 'Package')" class="w-8 h-8" />
                </div>
              </div>
              <div class="flex flex-col">
                <span class="font-black text-lg text-gray-900 group-hover:text-blue-600 transition-colors">{{ item.name }}</span>
                <span class="text-xs font-bold text-gray-400 line-clamp-1 max-w-xl mt-1">{{ item.description || 'Sem descrição comercial' }}</span>
              </div>
            </div>
          </td>
          <td class="px-10 py-8 text-center">
            <span 
              :class="item.type === 'service' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'" 
              class="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border"
            >
              {{ item.type === 'service' ? 'Serviço' : 'Produto' }}
            </span>
          </td>
          <td class="px-10 py-8 text-right">
            <div class="flex flex-col items-end">
              <span class="font-black text-lg text-gray-900">R$ {{ (item.price ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
              <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">por {{ item.unit }}</span>
            </div>
          </td>
          <td class="px-10 py-8 text-right">
            <div class="flex justify-end gap-3 items-center">
              <DropdownMenuRoot>
                <DropdownMenuTrigger as-child>
                  <button
                    class="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all"
                    title="Mais ações"
                    aria-label="Mais ações do orçamento"
                  >
                    <MoreVertical class="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuContent
                    align="end"
                    :side-offset="6"
                    class="min-w-[220px] bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50"
                  >
                  <DropdownMenuItem
                      @click="openModal(item)"
                      class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-600 cursor-pointer outline-none transition-all"
                    >
                      <Pencil class="w-4 h-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      @click="deleteItem(item._id)"
                      class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-red-600 cursor-pointer outline-none transition-all"
                    >
                      <Trash2 class="w-4 h-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenuPortal>
              </DropdownMenuRoot>
            </div>
          </td>
        </tr>
      </template>

      <!-- Custom skeleton -->
      <template #skeleton>
        <tr v-for="i in 5" :key="i">
          <td class="px-10 py-8">
            <div class="flex items-center gap-6">
              <BaseSkeleton width="4rem" height="4rem" borderRadius="1rem" />
              <div class="space-y-2 flex-1">
                <BaseSkeleton width="60%" height="1.25rem" />
                <BaseSkeleton width="90%" height="0.75rem" />
              </div>
            </div>
          </td>
          <td class="px-10 py-8 text-center">
            <div class="flex justify-center">
              <BaseSkeleton width="80px" height="1.5rem" borderRadius="999px" />
            </div>
          </td>
          <td class="px-10 py-8 text-right">
            <div class="space-y-2">
              <BaseSkeleton width="100px" height="1.5rem" />
              <BaseSkeleton width="60%" height="0.75rem" />
            </div>
          </td>
          <td class="px-10 py-8 text-right">
            <div class="flex justify-end gap-3">
              <BaseSkeleton width="3rem" height="3rem" borderRadius="1rem" />
              <BaseSkeleton width="3rem" height="3rem" borderRadius="1rem" />
            </div>
          </td>
        </tr>
      </template>
    </BaseDataList>
    </div>

    <!-- Listagem em Cards (mobile) -->
    <div class="md:hidden space-y-4">
      <template v-if="pending && items.length === 0">
        <BaseSkeleton v-for="i in 3" :key="i" height="9rem" borderRadius="1rem" />
      </template>
      <template v-else-if="items.length === 0">
        <div class="py-16 text-center">
          <p class="font-black text-gray-900">Catálogo Vazio</p>
          <p class="text-sm text-gray-500 mt-1">Sua lista de produtos e serviços aparecerá aqui. Comece cadastrando o primeiro.</p>
        </div>
      </template>
      <template v-else>
        <CatalogItemCard
          v-for="item in items"
          :key="item._id"
          :item="item"
          :get-icon="getIcon"
          @edit="openModal(item)"
          @delete="deleteItem(item._id)"
        />
        <div v-if="totalItems > itemsPerPage" class="flex justify-center pt-2">
          <BasePagination :total="totalItems" :items-per-page="itemsPerPage" v-model="currentPage" />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.cropper { height: 400px; background: #f3f4f6; }
</style>
