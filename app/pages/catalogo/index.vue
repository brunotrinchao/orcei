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
  selectedItem,
  openModal,
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

    <!-- Listagem Unificada (desktop) -->
    <div class="hidden md:block">
    <BaseDataList
      :items="items"
      :pending="pending"
      :has-more="hasMore"
      :loading-more="loadingMore"
      @load-more="loadMore"
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
        <tr class="hover:bg-gray-50/30 dark:hover:bg-gray-800/20 transition-all group">
          <td class="px-8 py-8">
            <div class="flex items-center gap-6">
              <div class="w-16 h-16 rounded-[0.50rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm">
                <BaseImage v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" container-class="w-full h-full" img-class="w-full h-full object-cover" />
                <div v-else class="text-gray-400">
                  <component :is="getIcon(item.icon || 'Package')" class="w-8 h-8" />
                </div>
              </div>
              <div class="flex flex-col">
                <span class="font-black text-lg text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{{ item.name }}</span>
                <span class="text-xs font-bold text-gray-400 dark:text-gray-500 line-clamp-1 max-w-xl mt-1">{{ item.description || 'Sem descrição comercial' }}</span>
              </div>
            </div>
          </td>
          <td class="px-10 py-8 text-center">
            <span 
              :class="item.type === 'service' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30' : 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'"
              class="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border"
            >
              {{ item.type === 'service' ? 'Serviço' : 'Produto' }}
            </span>
          </td>
          <td class="px-10 py-8 text-right">
            <div class="flex flex-col items-end">
              <span class="font-black text-lg text-gray-900 dark:text-gray-100">R$ {{ (item.price ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
              <span class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">por {{ item.unit }}</span>
            </div>
          </td>
          <td class="px-10 py-8 text-right">
            <div class="flex justify-end gap-3 items-center">
              <DropdownMenuRoot>
                <DropdownMenuTrigger as-child>
                  <button
                    class="p-2.5 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"
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
                    class="min-w-[220px] bg-white dark:bg-gray-950 rounded-[0.75rem] shadow-xl border border-gray-100 dark:border-gray-800 p-2 z-50"
                  >
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
          <p class="font-black text-gray-900 dark:text-gray-50">Catálogo Vazio</p>
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
        <div ref="mobileSentinelRef" v-if="hasMore" class="h-1" />
        <div v-if="loadingMore" class="py-4 text-center text-sm text-gray-400 font-bold">Carregando...</div>
      </template>
    </div>
  </div>
</template>


