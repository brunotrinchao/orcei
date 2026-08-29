<script setup lang="ts">
import { useCatalogoPage } from '~/composables/pages/useCatalogoPage'

const {
  searchQuery,
  items,
  totalItems,
  pending,
  loadingMore,
  hasMore,
  loadMore,
  refresh,
  mobileSentinelRef,
  showForm,
  showInfo,
  selectedItem,
  openModal,
  openInfoModal,
  handleItemSaved,
  deleteItem,
  getIcon,
  activeFiltersCount,
  clearFilters,
  Plus,
  Search,
  Image,
  Pencil,
  Trash2,
  Sparkles,
  RefreshCcw,
  Package,
  ShoppingBag,
  HelpCircle,
  MoreVertical,
  Upload,
  Eye,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
} = useCatalogoPage()
</script>

<template>
  <div class="space-y-10 relative">
    <PageHeader title="Catálogo" subtitle="Unifique seus produtos e serviços em um só lugar.">
      <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <BaseButton
          type="button"
          variant="outline"
          class="w-full sm:w-auto"
          @click="navigateTo('/configuracoes?section=multiplos-cadastros')"
        >
          <Upload class="w-4 h-4 mr-2" />
          Importar
        </BaseButton>

        <BaseButton data-tour="catalogo-novo-item-btn" @click="openModal()" class="w-full sm:w-auto shadow-2xl shadow-blue-100">
          <Plus class="w-5 h-5 mr-2" />
          Novo Item
        </BaseButton>
      </div>

      <template #filters>
        <BaseFilters :active-filters-count="activeFiltersCount" @clear="clearFilters" data-tour="catalogo-busca">
          <template #search>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar itens por nome, código ou descrição..." 
              class="w-full h-[52px] pl-12 pr-5 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-xs"
            >
            <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
              <Search class="w-5 h-5" />
            </div>
          </template>
        </BaseFilters>
      </template>
    </PageHeader>

    <!-- Modal de Formulário -->
    <CatalogItemFormDialog 
      v-model:open="showForm" 
      :itemToEdit="selectedItem" 
      @saved="handleItemSaved" 
    />

    <!-- Modal de Detalhes do Item -->
    <BaseDialog 
      v-model:open="showInfo" 
      :title="selectedItem?.name || 'Detalhes do Item'" 
      size="lg"
    >
      <template #context-menu v-if="selectedItem">
        <DropdownMenuRoot>
          <DropdownMenuTrigger as-child>
            <button
              type="button"
              class="p-2 text-gray-400 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-[0.75rem] transition-all cursor-pointer"
              title="Mais ações"
              aria-label="Mais ações do item"
            >
              <MoreVertical class="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent
              align="end"
              :side-offset="6"
              class="min-w-[220px] bg-white dark:bg-gray-950 rounded-[0.75rem] shadow-xl border border-gray-100 dark:border-gray-800 p-2 z-[9999]"
            >
              <DropdownMenuItem
                @click="showInfo = false; openModal(selectedItem)"
                class="flex items-center gap-3 px-4 py-3 rounded-[0.75rem] text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer outline-none transition-all"
              >
                <Pencil class="w-4 h-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                @click="showInfo = false; deleteItem(selectedItem._id)"
                class="flex items-center gap-3 px-4 py-3 rounded-[0.75rem] text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-300 cursor-pointer outline-none transition-all"
              >
                <Trash2 class="w-4 h-4 text-red-500" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenuRoot>
      </template>
      <div v-if="selectedItem" class="space-y-6 py-2">
        <!-- Header do Item -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-gray-800/40 border border-slate-100 dark:border-gray-800">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
              <BaseImage v-if="selectedItem.imageUrl" :src="selectedItem.imageUrl" :alt="selectedItem.name" container-class="w-full h-full" img-class="w-full h-full object-cover" />
              <div v-else class="text-gray-400 dark:text-gray-500">
                <component :is="getIcon(selectedItem.icon || 'Package')" class="w-8 h-8" />
              </div>
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2 mt-1.5">
                <BaseBadge variant="info">{{ selectedItem.type === 'service' ? 'Serviço' : 'Produto' }}</BaseBadge>
                <BaseBadge variant="ia"><Sparkles class="w-3 h-3" /> Gerado por IA</BaseBadge>
                <BaseBadge variant="default" v-if="selectedItem.sku">SKU: {{ selectedItem.sku }}</BaseBadge>
              </div>
            </div>
          </div>
        </div>

        <!-- Cards de Preço e Unidade -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 space-y-1">
            <span class="text-[10px] font-semibold text-blue-600 dark:text-blue-400 tracking-wide">Preço de Venda</span>
            <p class="text-2xl font-black text-gray-900 dark:text-gray-100">
              R$ {{ (selectedItem.price ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }} <span class="text-xs font-bold text-gray-400 dark:text-gray-500">/ {{ selectedItem.unit || 'unidade' }}</span>
            </p>
            
          </div>

          <div class="p-4 rounded-2xl bg-slate-50 dark:bg-gray-800/40 border border-slate-100 dark:border-gray-800 space-y-1">
            <span class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 tracking-wide">Unidade Comercial</span>
            <p class="text-xl font-black text-gray-900 dark:text-gray-100 capitalize">
              {{ selectedItem.unit || 'Unidade' }}
            </p>
          </div>
        </div>

        <!-- Descrição Comercial -->
        <div class="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-2">
          <h4 class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 tracking-wide">Descrição Comercial</h4>
          <p class="text-sm text-gray-700 dark:text-gray-300 font-medium whitespace-pre-line leading-relaxed">
            {{ selectedItem.description || 'Nenhuma descrição informada.' }}
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end items-center w-full">
          <BaseButton variant="primary" @click="showInfo = false; openModal(selectedItem)">
            <Pencil class="w-4 h-4 mr-2" />
            Editar
          </BaseButton>
        </div>
      </template>
    </BaseDialog>

    <!-- Listagem Unificada (desktop & mobile) -->
    <BaseDataList
      :columns="[
        { key: 'name', label: 'Item do Catálogo' },
        { key: 'type', label: 'Tipo' },
        { key: 'price', label: 'Preço' },
        // { key: 'actions', label: '' }
      ]"
      :items="items || []"
      :pending="pending"
      :has-more="hasMore"
      :loading-more="loadingMore"
      @load-more="loadMore"
      empty-title="Catálogo Vazio"
      empty-subtitle="Sua lista de produtos e serviços aparecerá aqui. Comece cadastrando o primeiro."
    >
      <template #cell-name="{ item }">
        <div class="flex items-center gap-4 md:gap-6 cursor-pointer group" @click="openInfoModal(item)">
          <!-- <div class="w-12 h-12 md:w-16 md:h-16 rounded-[0.50rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm">
            <BaseImage v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" container-class="w-full h-full" img-class="w-full h-full object-cover" />
            <div v-else class="text-gray-400">
              <component :is="getIcon(item.icon || 'Package')" class="w-6 h-6 md:w-8 md:h-8" />
            </div>
          </div> -->
          <div class="flex flex-col">
            <span class="font-black text-base md:text-lg text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {{ item.name }}
            </span>
            <span class="text-xs font-bold text-gray-400 dark:text-gray-500 line-clamp-1 max-w-xl mt-0.5">
              {{ item.description || 'Sem descrição comercial' }}
            </span>
          </div>
        </div>
      </template>

      <template #cell-type="{ item }">
        <div class="cursor-pointer" @click="openInfoModal(item)">
          <span 
            :class="item.type === 'service' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30' : 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'"
            class="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border inline-block"
          >
            {{ item.type === 'service' ? 'Serviço' : 'Produto' }}
          </span>
        </div>
      </template>

      <template #cell-price="{ item }">
        <div class="flex flex-col items-start md:items-end cursor-pointer" @click="openInfoModal(item)">
          <span class="font-black text-base md:text-lg text-gray-900 dark:text-gray-100">
            R$ {{ (item.price ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
          </span>
          <span class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">
            por {{ item.unit }}
          </span>
        </div>
      </template>

      <!-- <template #cell-actions="{ item }">
        <div class="flex justify-end gap-3 items-center" @click.stop>
          <DropdownMenuRoot>
            <DropdownMenuTrigger as-child>
              <button
                class="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"
                title="Mais ações"
                aria-label="Mais ações do item"
              >
                <MoreVertical class="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent
                align="end"
                :side-offset="6"
                class="min-w-[220px] bg-white dark:bg-gray-950 rounded-[0.75rem] shadow-xl border border-gray-100 dark:border-gray-800 p-2 z-50"
              >
                <DropdownMenuItem
                  @click="openInfoModal(item)"
                  class="flex items-center gap-3 px-4 py-3 rounded-[0.75rem] text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer outline-none transition-all"
                >
                  <Eye class="w-4 h-4" />
                  Ver Detalhes
                </DropdownMenuItem>
                <DropdownMenuItem
                  @click="openModal(item)"
                  class="flex items-center gap-3 px-4 py-3 rounded-[0.75rem] text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer outline-none transition-all"
                >
                  <Pencil class="w-4 h-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  @click="deleteItem(item._id)"
                  class="flex items-center gap-3 px-4 py-3 rounded-[0.75rem] text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-red-600 dark:hover:text-red-400 cursor-pointer outline-none transition-all"
                >
                  <Trash2 class="w-4 h-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenuRoot>
        </div>
      </template> -->
    </BaseDataList>
  </div>
</template>


