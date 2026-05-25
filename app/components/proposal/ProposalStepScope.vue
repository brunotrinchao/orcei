<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Trash2, Sparkles, Search, ChevronDown, ChevronUp, GripVertical } from 'lucide-vue-next'

const props = defineProps<{
  form: any
  catalogItems: any[]
  totalCatalogItems: number
  catalogSearch: string
  isGenerating: boolean
}>()

const emit = defineEmits([
  'update:catalogSearch', 
  'generateDescription', 
  'addCustomItem'
])

const internalSearch = computed({
  get: () => props.catalogSearch,
  set: (val) => emit('update:catalogSearch', val)
})

const showCatalogDropdown = ref(false)
const expandedItemIdx = ref<number | null>(null)
const expandedUpsellIdx = ref<number | null>(null)

function toggleItemExpansion(idx: number, isUpsell = false) {
  if (isUpsell) {
    expandedUpsellIdx.value = expandedUpsellIdx.value === idx ? null : idx
  } else {
    expandedItemIdx.value = expandedItemIdx.value === idx ? null : idx
  }
}

function selectCatalogItem(item: any) {
  const indexItems = props.form.items.findIndex((i: any) => 
    i.catalogItemId?.toString() === item._id?.toString() ||
    (i.name === item.name && i.price === item.price)
  )
  const indexUpsells = props.form.upsellItems.findIndex((i: any) => 
    i.catalogItemId?.toString() === item._id?.toString() ||
    (i.name === item.name && i.price === item.price)
  )

  if (indexItems > -1) {
    props.form.items.splice(indexItems, 1)
  } else if (indexUpsells > -1) {
    props.form.upsellItems.splice(indexUpsells, 1)
  } else {
    props.form.items.push({
      catalogItemId: item._id,
      name: item.name,
      description: item.description,
      price: item.price,
      quantity: 1
    })
    // Auto-expand the newly added item
    expandedItemIdx.value = props.form.items.length - 1
  }
  showCatalogDropdown.value = false
  internalSearch.value = ''
}

function moveToUpsell(index: number) {
  const item = props.form.items.splice(index, 1)[0]
  props.form.upsellItems.push(item)
  if (expandedItemIdx.value === index) expandedItemIdx.value = null
}

function moveToItems(index: number) {
  const item = props.form.upsellItems.splice(index, 1)[0]
  props.form.items.push(item)
  if (expandedUpsellIdx.value === index) expandedUpsellIdx.value = null
}

function addCustomItem() {
  props.form.items.push({
    name: 'Novo Item Customizado',
    description: '',
    price: 0,
    quantity: 1
  })
  expandedItemIdx.value = props.form.items.length - 1
}

function isItemSelected(item: any) {
  return props.form.items.some((i: any) => i.catalogItemId?.toString() === item._id?.toString() || (i.name === item.name && i.price === item.price)) ||
         props.form.upsellItems.some((i: any) => i.catalogItemId?.toString() === item._id?.toString() || (i.name === item.name && i.price === item.price))
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
    <div class="space-y-2">
      <h3 class="text-lg font-black text-gray-900 tracking-tight">Serviços e Valores</h3>
      <p class="text-sm text-gray-500 font-medium">Defina o escopo obrigatório e adicione pacotes opcionais (upsell).</p>
    </div>

    <!-- Smart Catalog Search -->
    <div class="relative z-20">
      <div class="flex items-center gap-3">
        <div class="relative flex-1">
          <input 
            v-model="internalSearch" 
            @focus="showCatalogDropdown = true"
            type="text" 
            placeholder="Buscar serviço no catálogo..." 
            class="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-gray-900 placeholder:text-gray-400"
          >
          <Search class="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <BaseButton variant="secondary" @click="addCustomItem" class="shrink-0 h-[56px] px-6 rounded-2xl">
          <Plus class="w-5 h-5 mr-2" />
          Item Avulso
        </BaseButton>
      </div>

      <!-- Catalog Dropdown -->
      <div 
        v-if="showCatalogDropdown" 
        class="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden max-h-80 overflow-y-auto"
      >
        <div class="p-2 flex justify-between items-center border-b border-gray-50 bg-gray-50/50">
          <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Itens do Catálogo ({{ totalCatalogItems }})</span>
          <button @click="showCatalogDropdown = false" class="text-xs text-blue-600 font-bold hover:underline px-2">Fechar</button>
        </div>
        <div 
          v-for="item in catalogItems" 
          :key="item._id"
          @click="selectCatalogItem(item)"
          class="p-4 flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
        >
          <div class="flex items-center gap-4">
            <div 
              :class="isItemSelected(item) ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'"
              class="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0"
            >
              <div v-if="isItemSelected(item)" class="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div>
              <p class="font-bold text-gray-900">{{ item.name }}</p>
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">R$ {{ ((item.price ?? 0) as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }} / {{ item.unit }}</p>
            </div>
          </div>
          <Plus v-if="!isItemSelected(item)" class="w-4 h-4 text-gray-300" />
        </div>
        <div v-if="!catalogItems?.length" class="p-8 text-center text-gray-400 text-sm font-medium">
          Nenhum item encontrado no catálogo.
        </div>
      </div>
    </div>
    
    <!-- Backdrop para fechar o dropdown -->
    <div v-if="showCatalogDropdown" @click="showCatalogDropdown = false" class="fixed inset-0 z-10"></div>

    <!-- Escopo Principal -->
    <div class="space-y-4 relative z-0">
      <h3 class="text-xs font-black text-gray-600 uppercase tracking-widest ml-1 flex justify-between">
        <span>Itens Obrigatórios ({{ form.items.length }})</span>
      </h3>
      
      <div v-if="form.items.length === 0" class="p-8 border-2 border-dashed border-gray-200 rounded-3xl text-center text-gray-400 font-medium">
        Adicione itens buscando no catálogo acima ou clicando em "Item Avulso".
      </div>

      <div class="space-y-3">
        <div 
          v-for="(item, idx) in form.items" 
          :key="'item_'+idx" 
          class="bg-white rounded-2xl border-2 border-gray-100 hover:border-gray-200 shadow-sm overflow-hidden transition-all group"
        >
          <!-- Cabecalho Compacto (Sempre visível) -->
          <div class="p-4 flex items-center gap-4">
            <div class="flex-1 flex items-center gap-3 min-w-0">
              <GripVertical class="w-5 h-5 text-gray-300 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block shrink-0" />
              <input 
                v-model="item.name" 
                class="flex-1 text-sm sm:text-base font-black text-gray-900 bg-transparent border-b border-transparent focus:border-blue-500 focus:ring-0 p-1 outline-none transition-all truncate" 
                placeholder="Nome do Serviço" 
              >
            </div>
            
            <div class="flex items-center gap-3 sm:gap-6 shrink-0">
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-black text-gray-400 uppercase hidden sm:block">Qtd</span>
                <input v-model.number="item.quantity" type="number" class="w-14 sm:w-16 bg-gray-50 px-2 py-1.5 rounded-lg font-bold text-sm border border-transparent focus:border-blue-500 outline-none text-center">
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-black text-gray-400 uppercase hidden sm:block">R$</span>
                <input v-model.number="item.price" type="number" class="w-20 sm:w-24 bg-gray-50 px-2 py-1.5 rounded-lg font-bold text-sm border border-transparent focus:border-blue-500 outline-none text-right">
              </div>
              
              <div class="hidden md:block text-right min-w-[80px]">
                <span class="text-sm font-black text-gray-900">R$ {{ (item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
              </div>
            </div>

            <!-- Ações -->
            <div class="flex items-center gap-1 shrink-0 ml-2">
              <button @click="toggleItemExpansion(idx)" type="button" class="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors" title="Editar Descrição">
                <ChevronUp v-if="expandedItemIdx === idx" class="w-5 h-5" />
                <ChevronDown v-else class="w-5 h-5" />
              </button>
              <button @click="moveToUpsell(idx)" type="button" class="hidden sm:block p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Mover para Opcionais">
                <Sparkles class="w-4 h-4" />
              </button>
              <button @click="form.items.splice(idx, 1)" type="button" class="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Remover Item">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Área Expandida (Descrição) -->
          <div v-show="expandedItemIdx === idx" class="px-4 pb-4 sm:pl-[4.5rem] bg-gray-50/50 border-t border-gray-100">
            <div class="pt-4 flex flex-col gap-3">
              <div class="relative">
                <textarea 
                  v-model="item.description" 
                  rows="3" 
                  class="w-full text-sm font-medium text-gray-600 bg-white p-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none transition-all shadow-sm" 
                  placeholder="Descreva detalhadamente o que será entregue (visível para o cliente)..."
                ></textarea>
                <button 
                  type="button"
                  @click="emit('generateDescription', { index: idx, isUpsell: false })"
                  class="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-gray-200 text-blue-600 hover:scale-105 transition-all text-xs font-bold"
                >
                  <Sparkles class="w-3 h-3" /> <span class="hidden sm:inline">Gerar com IA</span>
                </button>
              </div>
              <div class="flex sm:hidden justify-between items-center mt-2">
                <span class="text-sm font-black text-gray-900">Total: R$ {{ (item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
                <button @click="moveToUpsell(idx)" type="button" class="text-xs font-black text-blue-600 uppercase tracking-widest">
                  Tornar Opcional
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Escopo Opcional (Upsell) -->
    <div v-if="form.upsellItems.length > 0" class="space-y-4 pt-6 border-t border-gray-100 relative z-0">
      <h3 class="text-xs font-black text-gray-600 uppercase tracking-widest ml-1">Itens Opcionais (Upsell)</h3>
      <p class="text-[10px] font-bold text-gray-400 ml-1 mb-4 uppercase tracking-widest">O cliente pode aceitar ou recusar no momento da aprovação.</p>
      
      <div class="space-y-3">
        <div 
          v-for="(item, idx) in form.upsellItems" 
          :key="'upsell_'+idx" 
          class="bg-blue-50/30 rounded-2xl border-2 border-dashed border-blue-200 hover:border-blue-300 shadow-sm overflow-hidden transition-all group"
        >
          <!-- Cabecalho Compacto -->
          <div class="p-4 flex items-center gap-4">
            <div class="flex-1 flex items-center gap-3 min-w-0">
              <GripVertical class="w-5 h-5 text-blue-200 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block shrink-0" />
              <input 
                v-model="item.name" 
                class="flex-1 text-sm sm:text-base font-black text-gray-900 bg-transparent border-b border-transparent focus:border-blue-500 focus:ring-0 p-1 outline-none transition-all truncate" 
                placeholder="Nome do Opcional" 
              >
            </div>
            
            <div class="flex items-center gap-3 sm:gap-6 shrink-0">
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-black text-gray-400 uppercase hidden sm:block">Qtd</span>
                <input v-model.number="item.quantity" type="number" class="w-14 sm:w-16 bg-white px-2 py-1.5 rounded-lg font-bold text-sm border border-blue-100 focus:border-blue-500 outline-none text-center">
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-black text-gray-400 uppercase hidden sm:block">R$</span>
                <input v-model.number="item.price" type="number" class="w-20 sm:w-24 bg-white px-2 py-1.5 rounded-lg font-bold text-sm border border-blue-100 focus:border-blue-500 outline-none text-right">
              </div>
              
              <div class="hidden md:block text-right min-w-[80px]">
                <span class="text-sm font-black text-gray-900">+ R$ {{ (item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
              </div>
            </div>

            <div class="flex items-center gap-1 shrink-0 ml-2">
              <button @click="toggleItemExpansion(idx, true)" type="button" class="p-2 text-gray-400 hover:bg-white rounded-lg transition-colors" title="Editar Descrição">
                <ChevronUp v-if="expandedUpsellIdx === idx" class="w-5 h-5" />
                <ChevronDown v-else class="w-5 h-5" />
              </button>
              <button @click="moveToItems(idx)" type="button" class="hidden sm:block p-2 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Tornar Obrigatório">
                <Plus class="w-4 h-4" />
              </button>
              <button @click="form.upsellItems.splice(idx, 1)" type="button" class="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Remover Opcional">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Área Expandida (Descrição) -->
          <div v-show="expandedUpsellIdx === idx" class="px-4 pb-4 sm:pl-[4.5rem] bg-white/50 border-t border-blue-100">
            <div class="pt-4 flex flex-col gap-3">
              <div class="relative">
                <textarea 
                  v-model="item.description" 
                  rows="3" 
                  class="w-full text-sm font-medium text-gray-600 bg-white p-4 rounded-xl border border-blue-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none transition-all shadow-sm" 
                  placeholder="Por que o cliente deveria adquirir este pacote adicional?"
                ></textarea>
                <button 
                  type="button"
                  @click="emit('generateDescription', { index: idx, isUpsell: true })"
                  class="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-blue-100 text-blue-600 hover:scale-105 transition-all text-xs font-bold"
                >
                  <Sparkles class="w-3 h-3" /> <span class="hidden sm:inline">Gerar com IA</span>
                </button>
              </div>
              <div class="flex sm:hidden justify-between items-center mt-2">
                <span class="text-sm font-black text-gray-900">Total: R$ {{ (item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
                <button @click="moveToItems(idx)" type="button" class="text-xs font-black text-green-600 uppercase tracking-widest">
                  Tornar Obrigatório
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
