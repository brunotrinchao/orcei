<script setup lang="ts">
import { ref, computed } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { Plus, Search, Image, Pencil, Trash2, Sparkles, RefreshCcw, X, Package, ShoppingBag } from 'lucide-vue-next'
import type { CatalogItemDTO } from '../../../../types'

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

const { notify, confirm: confirmAlert } = useAlerts()

const showForm = ref(false)
const selectedItem = ref<CatalogItemDTO | null>(null)
const currentPage = ref(1)
const itemsPerPage = 10

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
      body: {
        image: base64Image,
        folder: 'orcei/catalog'
      }
    }) as { url: string }
    
    form.value.imageUrl = data.url
    showCropper.value = false
    rawImage.value = null
  } catch (e) {
    notify('Erro', 'Não foi possível fazer upload da imagem.')
  } finally {
    isSubmitting.value = false
  }
}

const form = ref({
  type: 'service' as 'product' | 'service',
  name: '',
  description: '',
  price: 0,
  unit: 'UN',
  sku: '',
  imageUrl: ''
})

const isSubmitting = ref(false)
const isGenerating = ref(false)

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
      description: item.description, 
      price: item.price, 
      unit: item.unit,
      sku: item.sku || '',
      imageUrl: item.imageUrl || ''
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
      imageUrl: ''
    }
  }
  showForm.value = true
}

async function generateWithAI() {
  if (!form.value.name) return notify('Aviso', 'Digite o nome do item primeiro')
  isGenerating.value = true
  try {
    const promptTemplate = `Você é um especialista em copywriting corporativo e negociação B2B. 
Sua tarefa é transformar um nome de ${form.value.type === 'product' ? 'produto' : 'serviço'} e alguns tópicos curtos em uma descrição comercial altamente persuasiva, profissional e clara.

REGRA DE SAÍDA ESTILIZADA:
1. O texto deve ser conciso (máximo 150 caracteres).
2. Foque no valor e benefícios.
3. Não inclua saudações ou introduções.
4. O tom deve ser direto e premium.

DADOS:
- Nome: ${form.value.name}
- Detalhes: ${form.value.description || 'Não informado'}

Escreva a descrição comercial agora:`

    const data: any = await $fetch('/api/ai/generate', {
      method: 'POST',
      body: { prompt: promptTemplate }
    })
    form.value.description = data.text
  } catch (e) {
    notify('Erro', 'Erro ao gerar descrição')
  } finally {
    isGenerating.value = false
  }
}

async function saveItem() {
  isSubmitting.value = true
  try {
    const method = selectedItem.value ? 'PUT' : 'POST'
    const endpoint = selectedItem.value ? `/api/catalog/${selectedItem.value._id}` : '/api/catalog'
    
    // Parse price string to number if it's a string from mask
    const payload = { 
      ...form.value,
      price: typeof form.value.price === 'string' 
        ? parseFloat(form.value.price.replace(/[R$\s.]/g, '').replace(',', '.')) 
        : form.value.price
    }

    await $fetch(endpoint, {
      method,
      body: payload
    })
    showForm.value = false
    refresh()
  } catch (e: any) {
    notify('Erro', e.data?.message || 'Erro ao salvar item')
  } finally {
    isSubmitting.value = false
  }
}

async function deleteItem(id: string) {
  confirmAlert({
    title: 'Excluir Item',
    description: 'Tem certeza que deseja excluir este item?',
    variant: 'destructive',
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
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <header class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
      <div>
        <h1 class="text-3xl font-black text-gray-900 uppercase tracking-tight">Seu Catálogo</h1>
        <p class="text-gray-500 font-medium mt-1">Unifique seus produtos e serviços em um só lugar.</p>
      </div>
      <BaseButton @click="openModal()" class="w-full md:w-auto px-10 py-5 rounded-[2rem] shadow-2xl shadow-blue-100">
        Novo Item do Catálogo
      </BaseButton>
    </header>

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
      :title="selectedItem ? 'Editar Item' : 'Novo Item'" 
      size="lg"
    >
      <form @submit.prevent="saveItem" class="space-y-8 py-4">
        <div class="flex items-center gap-6 p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
          <div class="relative group">
            <div class="w-24 h-24 bg-white rounded-2xl border-2 border-gray-100 shadow-sm flex items-center justify-center overflow-hidden">
              <img v-if="form.imageUrl" :src="form.imageUrl" class="w-full h-full object-cover">
              <div v-else class="text-gray-300">
                <Image class="w-8 h-8 opacity-30" />
              </div>
            </div>
            <label class="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer shadow-lg hover:bg-blue-700 transition-all border-2 border-white">
              <Pencil class="w-4 h-4" />
              <input type="file" accept="image/*" @change="onFileChange" class="hidden">
            </label>
          </div>
          <div>
            <h4 class="text-sm font-black text-gray-900 uppercase tracking-tight">Imagem do Item</h4>
            <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Opcional. Recomendado 400x400px.</p>
            <button v-if="form.imageUrl" type="button" @click="form.imageUrl = ''" class="text-[10px] text-red-600 font-black uppercase tracking-widest mt-2 hover:underline">Remover Imagem</button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BaseSelect 
            v-model="form.type" 
            label="Tipo de Item" 
            :options="typeOptions" 
          />
          <div class="md:col-span-2">
            <BaseInput 
              v-model="form.name" 
              label="Nome do Item" 
              placeholder="Ex: Desenvolvimento Web ou Pacote de Logos" 
              required 
            />
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex justify-between items-center px-1">
            <label class="block text-xs font-black text-gray-500 uppercase tracking-widest">Descrição Comercial</label>
            <button 
              type="button"
              @click="generateWithAI"
              :disabled="isGenerating"
              class="text-[10px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-2 disabled:opacity-50 uppercase tracking-widest transition-colors"
            >
              <Sparkles class="w-4 h-4" />
              {{ isGenerating ? 'Gerando...' : 'Melhorar com IA' }}
            </button>
          </div>
          <textarea 
            v-model="form.description" 
            rows="3" 
            class="w-full px-6 py-5 bg-white border-2 border-gray-100 rounded-[1.5rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-gray-900 placeholder:text-gray-300 shadow-inner"
            placeholder="Descreva o que está incluído..."
          ></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BaseInput 
            v-model="form.price" 
            label="Preço Base (R$)" 
            mask="currency"
            required 
          />
          <BaseSelect 
            v-model="form.unit" 
            label="Unidade" 
            :options="unitOptions" 
          />
          <BaseInput 
            v-model="form.sku" 
            label="SKU / Código" 
            placeholder="Opcional" 
          />
        </div>

        <div class="flex justify-end pt-6">
          <BaseButton 
            type="submit" 
            :disabled="isSubmitting"
            class="w-full md:w-auto px-12 py-5 rounded-[2rem] shadow-xl shadow-blue-100"
          >
            <RefreshCcw v-if="isSubmitting" class="w-5 h-5 animate-spin mr-3" />
            {{ isSubmitting ? 'Salvando...' : (selectedItem ? 'Atualizar Item' : 'Salvar no Catálogo') }}
          </BaseButton>
        </div>
      </form>
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
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-xl bg-gray-100 border border-gray-100 overflow-hidden flex-shrink-0">
                    <img v-if="item.imageUrl" :src="item.imageUrl" class="w-full h-full object-cover">
                    <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
                      <Image class="w-5 h-5 opacity-30" />
                    </div>
                  </div>
                  <div class="flex flex-col">
                    <span class="font-black text-lg text-gray-900 group-hover:text-blue-600 transition-colors">{{ item.name }}</span>
                    <span class="text-xs font-bold text-gray-400 line-clamp-1 max-w-xl mt-1">{{ item.description || 'Sem descrição comercial disponível' }}</span>
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
                  <span class="font-black text-lg text-gray-900">R$ {{ (item.price as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
                  <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">por {{ item.unit }}</span>
                </div>
              </td>
              <td class="px-10 py-8 text-right">
                <div class="flex justify-end gap-3 items-center opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                  <button @click="openModal(item)" class="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all" title="Editar">
                    <Pencil class="w-6 h-6" />
                  </button>
                  <button @click="deleteItem(item._id)" class="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all" title="Excluir">
                    <Trash2 class="w-6 h-6" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Paginação -->
      <div v-if="totalItems > itemsPerPage" class="px-10 py-6 border-t-2 border-gray-50 bg-gray-50/20 flex justify-center">
        <BasePagination 
          :total="totalItems" 
          :items-per-page="itemsPerPage" 
          v-model:page="currentPage" 
        />
      </div>
      
      <div v-if="items.length === 0" class="text-center py-32 bg-gray-50/20">
        <div class="w-24 h-24 bg-white shadow-xl shadow-gray-100 text-gray-200 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
          <ShoppingBag class="w-10 h-10" />
        </div>
        <h3 class="text-2xl font-black text-gray-900 uppercase tracking-tight">{{ searchQuery ? 'Item não encontrado' : 'Catálogo Vazio' }}</h3>
        <p class="text-gray-400 font-bold mt-2 px-6 max-w-sm mx-auto">{{ searchQuery ? 'Não encontramos nenhum item com esses termos.' : 'Sua lista de serviços e produtos aparecerá aqui.' }}</p>
        <BaseButton v-if="!searchQuery" @click="openModal()" class="mt-10 px-12 py-5 rounded-[2rem] shadow-xl shadow-blue-100">Adicionar Primeiro Item</BaseButton>
        <button v-else @click="searchQuery = ''" class="mt-10 text-blue-600 font-black uppercase tracking-widest text-xs hover:underline decoration-2 underline-offset-8">Ver Catálogo Completo</button>
      </div>
    </div>

    <!-- Modal do Cropper -->
    <Teleport to="body">
      <div v-if="showCropper" class="fixed inset-0 bg-gray-900/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
        <div class="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col border-8 border-white">
          <header class="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
              <h2 class="text-2xl font-black text-gray-900 uppercase tracking-tight">Ajustar Imagem</h2>
              <p class="text-sm text-gray-500 font-bold">Arraste e redimensione para o enquadramento ideal (1:1)</p>
            </div>
            <button @click="showCropper = false" class="p-3 hover:bg-gray-200 rounded-full transition-all">
              <X class="w-6 h-6 text-gray-400" />
            </button>
          </header>
          
          <div class="p-8 bg-gray-100 flex-1 min-h-[400px]">
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

          <footer class="p-8 border-t border-gray-100 bg-white flex justify-end gap-4">
            <button @click="showCropper = false" class="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-all">Cancelar</button>
            <button @click="cropImage" class="px-10 py-4 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">Confirmar Corte</button>
          </footer>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.cropper {
  height: 400px;
  background: #f3f4f6;
}
</style>
