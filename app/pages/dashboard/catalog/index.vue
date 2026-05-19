<script setup lang="ts">
import { ref, computed } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import * as LucideIcons from 'lucide-vue-next'
import { Plus, Search, Image, Pencil, Trash2, Sparkles, RefreshCcw, Package, ShoppingBag, HelpCircle } from 'lucide-vue-next'
import type { CatalogItemDTO } from '../../../../types'

const { notify, confirm: confirmAlert } = useAlerts()

const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

const { data: catalogData, refresh } = useFetch<any>('/api/catalog', {
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

function generateWithIA() {
  if (!form.value.name) return notify('Aviso', 'Digite o nome do item primeiro')
  if (form.value.type === 'service') {
    aiPromptText.value = ''
    showAIDialog.value = true
  } else {
    runAIGenerate('')
  }
}

async function runAIGenerate(context: string) {
  isGenerating.value = true
  try {
    const data: any = await $fetch('/api/ai/catalog-suggest', {
      method: 'POST',
      body: { name: form.value.name, type: form.value.type, context: context || undefined }
    })

    if (data.description) form.value.description = data.description
    if (data.price) form.value.price = data.price
    if (data.unit) form.value.unit = data.unit

    notify('IA aplicada', 'Descrição, preço e unidade sugeridos. Revise antes de salvar.')
  } catch (e) {
    notify('Erro', 'Erro ao gerar sugestões com IA')
  } finally {
    isGenerating.value = false
  }
}

function confirmAIGenerate() {
  showAIDialog.value = false
  runAIGenerate(aiPromptText.value)
}

async function saveItem() {
  isSubmitting.value = true
  try {
    const method = selectedItem.value ? 'PUT' : 'POST'
    const endpoint = selectedItem.value ? `/api/catalog/${selectedItem.value._id}` : '/api/catalog'

    const priceValue = typeof form.value.price === 'string'
      ? parseFloat(form.value.price.replace(/[R$\s.]/g, '').replace(',', '.'))
      : form.value.price

    const payload = {
      type: form.value.type,
      name: form.value.name,
      description: form.value.description,
      price: priceValue,
      unit: form.value.unit,
      sku: form.value.sku,
      imageUrl: form.value.imageUrl || undefined,
      icon: form.value.icon
    }

    await $fetch(endpoint, {
      method,
      body: payload
    })
    showForm.value = false
    refresh()
  } catch (e: any) {
    const html = parseApiErrors(e)
    notify(html ? 'Dados inválidos' : 'Erro', html ?? (e.data?.statusMessage || 'Erro ao salvar item'))
  } finally {
    isSubmitting.value = false
  }
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
      <BaseButton @click="openModal()" class="w-full sm:w-auto shadow-2xl shadow-blue-100">
        Novo Item do Catálogo
      </BaseButton>
    </PageHeader>

    <!-- Filtros -->
    <div class="mb-10 relative max-w-xl">
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
    <BaseDialog
      v-model:open="showForm"
      :title="showCropper ? 'Ajustar Imagem' : (selectedItem ? 'Editar Item' : 'Novo Item')"
      size="lg"
    >
      <div v-if="showCropper" class="flex flex-col gap-6">
        <p class="text-sm text-gray-500 font-bold">Arraste e redimensione para o enquadramento ideal (1:1)</p>
        <div class="bg-gray-100 rounded-3xl overflow-hidden min-h-[400px]">
          <Cropper
            ref="cropperRef"
            :src="rawImage"
            :stencil-props="{
              aspectRatio: 1/1,
              movable: true,
              resizable: true
            }"
            class="w-full h-[400px]"
          />
        </div>
      </div>

      <form v-else id="catalog-form" @submit.prevent="saveItem" class="space-y-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <!-- Visual Identity -->
          <div class="space-y-4">
            <div class="flex items-center justify-between px-2">
              <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Identidade Visual</label>
              <div class="flex bg-gray-100 p-1 rounded-xl">
                <button 
                  type="button"
                  @click="form.imageUrl = ''"
                  :class="[!form.imageUrl ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400']"
                  class="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all"
                >Ícone</button>
                <button 
                  type="button"
                  class="relative px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all overflow-hidden"
                  :class="[form.imageUrl ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400']"
                >
                  Imagem
                  <input type="file" accept="image/*" @change="onFileChange" class="absolute inset-0 opacity-0 cursor-pointer">
                </button>
              </div>
            </div>

            <!-- Icon Selector -->
            <div v-if="!form.imageUrl" class="animate-in fade-in zoom-in-95 duration-200">
              <BaseIconSelect v-model="form.icon" />
            </div>

            <!-- Image Preview -->
            <div v-else class="relative group aspect-square bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
              <img :src="form.imageUrl" class="w-full h-full object-cover">
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <label class="p-3 bg-white rounded-xl text-gray-900 cursor-pointer hover:scale-110 transition-transform">
                  <Pencil class="w-5 h-5" />
                  <input type="file" accept="image/*" @change="onFileChange" class="hidden">
                </label>
                <button type="button" @click="form.imageUrl = ''" class="p-3 bg-white rounded-xl text-red-600 hover:scale-110 transition-transform">
                  <Trash2 class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <BaseSelect 
              v-model="form.type" 
              label="Tipo de Item" 
              :options="typeOptions" 
            />
            <BaseInput 
              v-model="form.name" 
              label="Nome do Item" 
              placeholder="Ex: Desenvolvimento Web" 
              required 
            />
            <div class="grid grid-cols-2 gap-4">
              <BaseInput 
                v-model="form.price" 
                label="Preço (R$)" 
                mask="currency"
                required 
              />
              <BaseSelect 
                v-model="form.unit" 
                label="Unidade" 
                :options="unitOptions" 
              />
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex justify-between items-center px-1">
            <label class="block text-xs font-black text-gray-500 uppercase tracking-widest">Descrição Comercial</label>
            <button
              type="button"
              @click="generateWithIA"
              :disabled="isGenerating || !form.name"
              class="text-[10px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-2 disabled:opacity-40 uppercase tracking-widest transition-colors"
            >
              <Sparkles class="w-4 h-4" />
              {{ isGenerating ? 'Gerando...' : 'Sugestão IA' }}
            </button>
          </div>
          <textarea 
            v-model="form.description" 
            rows="3" 
            class="w-full px-6 py-5 bg-white border-2 border-gray-100 rounded-[1.5rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-gray-900 shadow-inner"
            placeholder="Descreva o que está incluído..."
          ></textarea>
        </div>

        <BaseInput 
          v-model="form.sku" 
          label="SKU / Código Interno" 
          placeholder="Opcional" 
        />
      </form>

      <template #footer>
        <template v-if="showCropper">
          <button type="button" @click="showCropper = false" class="px-8 py-3 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-all">Cancelar</button>
          <BaseButton type="button" @click="cropImage" :disabled="isSubmitting">
            <RefreshCcw v-if="isSubmitting" class="w-4 h-4 animate-spin mr-2" />
            Confirmar Corte
          </BaseButton>
        </template>
        <template v-else>
          <BaseButton type="button" @click="saveItem" :disabled="isSubmitting">
            <RefreshCcw v-if="isSubmitting" class="w-4 h-4 animate-spin mr-2" />
            {{ isSubmitting ? 'Salvando...' : (selectedItem ? 'Atualizar Item' : 'Salvar no Catálogo') }}
          </BaseButton>
        </template>
      </template>
    </BaseDialog>

    <!-- Listagem -->
    <div class="bg-white rounded-[3rem] border-2 border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden transition-all">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50/50 border-b-2 border-gray-100">
              <th class="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Item do Catálogo</th>
              <th class="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] text-center">Tipo</th>
              <th class="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] text-right">Preço</th>
              <th class="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y-2 divide-gray-50">
            <tr v-for="item in items" :key="item._id" class="hover:bg-gray-50/30 transition-all group">
              <td class="px-10 py-8">
                <div class="flex items-center gap-6">
                  <div class="w-16 h-16 rounded-2xl border-2 border-gray-100 bg-white overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm">
                    <img v-if="item.imageUrl" :src="item.imageUrl" class="w-full h-full object-cover">
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
                  <button @click="openModal(item)" class="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all">
                    <Pencil class="w-6 h-6" />
                  </button>
                  <button @click="deleteItem(item._id)" class="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all">
                    <Trash2 class="w-6 h-6" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-if="totalItems > itemsPerPage" class="px-10 py-6 border-t-2 border-gray-50 bg-gray-50/20 flex justify-center">
        <BasePagination :total="totalItems" :items-per-page="itemsPerPage" v-model:page="currentPage" />
      </div>
      
      <div v-if="items.length === 0" class="text-center py-32 bg-gray-50/20">
        <div class="w-24 h-24 bg-white shadow-xl shadow-gray-100 text-gray-200 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
          <ShoppingBag class="w-10 h-10" />
        </div>
        <h3 class="text-2xl font-black text-gray-900 uppercase tracking-tight">Catálogo Vazio</h3>
        <BaseButton @click="openModal()" class="mt-10 shadow-xl shadow-blue-100">Adicionar Primeiro Item</BaseButton>
      </div>
    </div>

    <!-- Dialog IA -->
    <BaseDialog v-model:open="showAIDialog" title="Sugestão com IA" size="sm">
      <div class="space-y-4">
        <p class="text-sm text-gray-500 font-bold">Descreva o serviço <span class="text-gray-900">{{ form.name }}</span> para a IA.</p>
        <textarea
          v-model="aiPromptText"
          rows="4"
          placeholder="Ex: Criação de identidade visual completa..."
          class="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-gray-900 text-sm resize-none"
        />
      </div>
      <template #footer>
        <BaseButton type="button" @click="confirmAIGenerate" :disabled="isGenerating">Gerar Sugestão</BaseButton>
      </template>
    </BaseDialog>
  </div>
</template>

<style scoped>
.cropper { height: 400px; background: #f3f4f6; }
</style>
