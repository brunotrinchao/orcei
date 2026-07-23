<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Trash2, ArrowDown, Search, ChevronDown, ChevronUp, GripVertical } from 'lucide-vue-next'
import CatalogItemFormDialog from '../catalog/CatalogItemFormDialog.vue'

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
  'catalog-updated'
])

const internalSearch = computed({
  get: () => props.catalogSearch,
  set: (val) => emit('update:catalogSearch', val)
})

const selectedCatalogItemId = ref('')

const catalogOptions = computed(() => {
  return props.catalogItems.map((c: any) => ({
    label: `${c.name} - R$ ${((c.price ?? 0) as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / ${c.unit}`,
    value: c._id
  })) || []
})

const showCatalogItemFormDialog = ref(false)
const expandedItemIdx = ref<number | null>(null)
const expandedUpsellIdx = ref<number | null>(null)

function onCatalogItemCreated(item: any) {
  selectCatalogItem(item)
  emit('catalog-updated')
}

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
  }
}

function onCatalogItemSelect(itemId: string | undefined) {
  if (!itemId) return
  const item = props.catalogItems.find((c: any) => c._id === itemId)
  if (item) {
    selectCatalogItem(item)
  }
  // Remove a seleção do combobox logo após adicionar para permitir nova busca
  setTimeout(() => {
    selectedCatalogItemId.value = ''
  }, 0)
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

function isItemSelected(item: any) {
  return props.form.items.some((i: any) => i.catalogItemId?.toString() === item._id?.toString() || (i.name === item.name && i.price === item.price)) ||
         props.form.upsellItems.some((i: any) => i.catalogItemId?.toString() === item._id?.toString() || (i.name === item.name && i.price === item.price))
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
    <div class="space-y-2">
      <h3 class="text-lg font-black text-gray-900 dark:text-white tracking-tight">Serviços e Valores</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Defina o escopo obrigatório e adicione pacotes opcionais (upsell).</p>
    </div>

    <!-- Smart Catalog Search -->
    <div class="relative z-20">
      <div class="flex items-center gap-3">
        <div class="flex-1">
          <BaseCombobox 
            v-model="selectedCatalogItemId" 
            v-model:search="internalSearch"
            :options="catalogOptions"
            :loading="isGenerating"
            placeholder="Buscar serviço no catálogo..."
            empty-message="Nenhum serviço encontrado"
            @update:model-value="onCatalogItemSelect"
          />
        </div>
        <BaseButton type="button" variant="secondary" @click="showCatalogItemFormDialog = true" class="shrink-0 h-[56px] px-6 rounded-2xl">
          <Plus class="w-5 h-5 mr-2" />
          Novo
        </BaseButton>
      </div>
    </div>

    <!-- Escopo Principal -->
    <BaseSectionCard :title="`Itens Obrigatórios (${form.items.length})`">
      <div v-if="form.items.length === 0" class="p-8 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl text-center text-gray-400 dark:text-gray-500 font-medium">
        Adicione itens buscando no catálogo acima ou clicando em "Novo".
      </div>

      <div v-else class="space-y-3">
        <div 
          v-for="(item, idx) in form.items" 
          :key="'item_'+idx" 
          class="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 shadow-sm overflow-hidden transition-all group"
        >
          <!-- Cabecalho Compacto (Sempre visível) -->
          <div class="p-4 flex items-center gap-4">
            <div class="flex-1 flex items-center gap-3 min-w-0">
              <GripVertical class="w-5 h-5 text-gray-300 dark:text-gray-600 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block shrink-0" />
              <template v-if="!item.catalogItemId">
                <input 
                  v-model="item.name" 
                  class="flex-1 text-sm sm:text-base font-black text-gray-900 dark:text-gray-50 bg-transparent border-b border-transparent focus:border-blue-500 focus:ring-0 p-1 outline-none transition-all truncate" 
                  placeholder="Nome do Serviço" 
                >
              </template>
              <template v-else>
                <span class="flex-1 text-sm sm:text-base font-black text-gray-900 dark:text-gray-50 p-1 truncate">{{ item.name }}</span>
              </template>
            </div>
            
            <div class="flex items-center gap-3 sm:gap-6 shrink-0">
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase hidden sm:block">Qtd</span>
                <input v-model.number="item.quantity" type="number" class="w-14 sm:w-16 bg-gray-50 dark:bg-gray-950 px-2 py-1.5 rounded-lg font-bold text-sm border border-transparent focus:border-blue-500 text-gray-900 dark:text-gray-50 outline-none text-center">
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase hidden sm:block">R$</span>
                <input v-model.number="item.price" type="number" class="w-20 sm:w-24 bg-gray-50 dark:bg-gray-950 px-2 py-1.5 rounded-lg font-bold text-sm border border-transparent focus:border-blue-500 text-gray-900 dark:text-gray-50 outline-none text-right">
              </div>
              
              <div class="hidden md:block text-right min-w-[80px]">
                <span class="text-sm font-black text-gray-900 dark:text-gray-50">R$ {{ (item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
              </div>
            </div>

            <!-- Ações -->
            <div class="flex items-center gap-1 shrink-0 ml-2">
              <BaseButton variant="ghost" size="icon-sm" @click="toggleItemExpansion(idx)" type="button" aria-label="Editar Descrição">
                <ChevronUp v-if="expandedItemIdx === idx" class="w-4 h-4" />
                <ChevronDown v-else class="w-4 h-4" />
              </BaseButton>
              <BaseButton variant="ghost" size="icon-sm" @click="moveToUpsell(idx)" type="button" class="hidden sm:inline-flex text-blue-400 hover:text-blue-600 dark:hover:text-blue-300" aria-label="Mover para Opcionais">
                <ArrowDown class="w-4 h-4" />
              </BaseButton>
              <BaseButton variant="ghost" size="icon-sm" @click="form.items.splice(idx, 1)" type="button" class="text-red-400 hover:text-red-600" aria-label="Remover Item">
                <Trash2 class="w-4 h-4" />
              </BaseButton>
            </div>
          </div>

          <!-- Área Expandida (Descrição) -->
          <div v-show="expandedItemIdx === idx" class="px-4 pb-4 sm:pl-[4.5rem] bg-gray-50/50 dark:bg-gray-950/50 border-t border-gray-100 dark:border-gray-800">
            <div class="pt-4 flex flex-col gap-3">
              <div class="relative">
                <template v-if="!item.catalogItemId">
                  <textarea 
                    v-model="item.description" 
                    rows="3" 
                    class="w-full text-sm font-medium text-gray-600 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 bg-transparent p-0 border-0 focus:ring-0 outline-none resize-none transition-all" 
                    placeholder="Descreva detalhadamente o que será entregue (visível para o cliente)..."
                  ></textarea>
                </template>
                <template v-else>
                  <div class="w-full text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{{ item.description || 'Nenhuma descrição fornecida para este item do catálogo.' }}</div>
                </template>
              </div>
              <div class="flex sm:hidden justify-between items-center mt-2">
                <span class="text-sm font-black text-gray-900 dark:text-gray-50">Total: R$ {{ (item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
                <BaseButton variant="ghost" size="sm" @click="moveToUpsell(idx)" type="button" class="text-blue-600 dark:text-blue-400">
                  Tornar Opcional
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseSectionCard>

    <!-- Escopo Opcional (Upsell) -->
    <BaseSectionCard 
      v-if="form.upsellItems.length > 0"
      title="Itens Opcionais (Upsell)"
      subtitle="O cliente pode aceitar ou recusar no momento da aprovação."
    >
      <div class="space-y-3">
        <div 
          v-for="(item, idx) in form.upsellItems" 
          :key="'upsell_'+idx" 
          class="bg-blue-50/30 dark:bg-blue-950/20 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-900/50 hover:border-blue-300 dark:hover:border-blue-800 shadow-sm overflow-hidden transition-all group"
        >
          <!-- Cabecalho Compacto -->
          <div class="p-4 flex items-center gap-4">
            <div class="flex-1 flex items-center gap-3 min-w-0">
              <GripVertical class="w-5 h-5 text-blue-200 dark:text-blue-800 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block shrink-0" />
              <template v-if="!item.catalogItemId">
                <input 
                  v-model="item.name" 
                  class="flex-1 text-sm sm:text-base font-black text-gray-900 dark:text-gray-50 bg-transparent border-b border-transparent focus:border-blue-500 focus:ring-0 p-1 outline-none transition-all truncate" 
                  placeholder="Nome do Opcional" 
                >
              </template>
              <template v-else>
                <span class="flex-1 text-sm sm:text-base font-black text-gray-900 dark:text-gray-50 p-1 truncate">{{ item.name }}</span>
              </template>
            </div>
            
            <div class="flex items-center gap-3 sm:gap-6 shrink-0">
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase hidden sm:block">Qtd</span>
                <input v-model.number="item.quantity" type="number" class="w-14 sm:w-16 bg-white dark:bg-gray-950 px-2 py-1.5 rounded-lg font-bold text-sm border border-blue-100 dark:border-blue-900/50 text-gray-900 dark:text-gray-50 focus:border-blue-500 outline-none text-center">
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase hidden sm:block">R$</span>
                <input v-model.number="item.price" type="number" class="w-20 sm:w-24 bg-white dark:bg-gray-950 px-2 py-1.5 rounded-lg font-bold text-sm border border-blue-100 dark:border-blue-900/50 text-gray-900 dark:text-gray-50 focus:border-blue-500 outline-none text-right">
              </div>
              
              <div class="hidden md:block text-right min-w-[80px]">
                <span class="text-sm font-black text-gray-900 dark:text-gray-50">+ R$ {{ (item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
              </div>
            </div>

            <div class="flex items-center gap-1 shrink-0 ml-2">
              <BaseButton variant="ghost" size="icon-sm" @click="toggleItemExpansion(idx, true)" type="button" aria-label="Editar Descrição">
                <ChevronUp v-if="expandedUpsellIdx === idx" class="w-4 h-4" />
                <ChevronDown v-else class="w-4 h-4" />
              </BaseButton>
              <BaseButton variant="ghost" size="icon-sm" @click="moveToItems(idx)" type="button" class="hidden sm:inline-flex text-green-500 hover:text-green-600" aria-label="Tornar Obrigatório">
                <Plus class="w-4 h-4" />
              </BaseButton>
              <BaseButton variant="ghost" size="icon-sm" @click="form.upsellItems.splice(idx, 1)" type="button" class="text-red-400 hover:text-red-600" aria-label="Remover Opcional">
                <Trash2 class="w-4 h-4" />
              </BaseButton>
            </div>
          </div>

          <!-- Área Expandida (Descrição) -->
          <div v-show="expandedUpsellIdx === idx" class="px-4 pb-4 sm:pl-[4.5rem] bg-white/50 dark:bg-gray-950/40 border-t border-blue-100 dark:border-blue-900/40">
            <div class="pt-4 flex flex-col gap-3">
              <div class="relative">
                <template v-if="!item.catalogItemId">
                  <textarea 
                    v-model="item.description" 
                    rows="3" 
                    class="w-full text-sm font-medium text-gray-600 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 bg-transparent p-0 border-0 focus:ring-0 outline-none resize-none transition-all" 
                    placeholder="Por que o cliente deveria adquirir este pacote adicional?"
                  ></textarea>
                </template>
                <template v-else>
                  <div class="w-full text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{{ item.description || 'Nenhuma descrição fornecida para este opcional do catálogo.' }}</div>
                </template>
              </div>
              <div class="flex sm:hidden justify-between items-center mt-2">
                <span class="text-sm font-black text-gray-900 dark:text-gray-50">Total: R$ {{ (item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
                <BaseButton variant="ghost" size="sm" @click="moveToItems(idx)" type="button" class="text-green-600 dark:text-green-400">
                  Tornar Obrigatório
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseSectionCard>
    <!-- Modal para criar novo item no catálogo diretamente daqui -->
    <CatalogItemFormDialog 
      v-model:open="showCatalogItemFormDialog"
      @saved="onCatalogItemCreated"
    />
  </div>
</template>
