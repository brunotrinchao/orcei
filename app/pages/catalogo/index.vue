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
    <PageHeader>
      <div class="flex flex-row gap-3 w-full sm:w-auto justify-end">
        <BaseButton type="button" variant="outline" @click="navigateTo('/configuracoes?section=multiplos-cadastros')">
          <Upload class="w-4 h-4 mr-2" />
          Importar
        </BaseButton>

        <BaseButton data-tour="catalogo-novo-item-btn" @click="openModal()">
          <Plus class="w-5 h-5 mr-0 sm:mr-2" />
          <span class="hidden sm:inline">Novo</span>
        </BaseButton>
      </div>
    </PageHeader>

    <!-- Modal de Formulário -->
    <CatalogItemFormDialog v-model:open="showForm" :itemToEdit="selectedItem" @saved="handleItemSaved" />

    <!-- Modal de Detalhes do Item -->
    <BaseDialog v-model:open="showInfo" :title="selectedItem?.name || 'Detalhes do Item'" size="lg">
      <template #context-menu v-if="selectedItem">
        <BaseDropdownMenu>
          <BaseDropdownMenuItem @click="showInfo = false; openModal(selectedItem)">
            <Pencil class="w-4 h-4 text-gray-500" />
            <span>Editar</span>
          </BaseDropdownMenuItem>
          <BaseDropdownMenuItem variant="danger" @click="showInfo = false; deleteItem(selectedItem._id)">
            <Trash2 class="w-4 h-4 text-red-500" />
            <span>Excluir</span>
          </BaseDropdownMenuItem>
        </BaseDropdownMenu>
      </template>

      <div v-if="selectedItem" class="space-y-6 py-2">

        <!-- Header do Item (Padronizado com BaseCard compact color="slate") -->
        <BaseCard compact color="slate">
          <div class="flex gap-4 items-center content-center">
            <div
              class="hidden sm:flex w-20 h-20 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white text-xl font-black shrink-0 overflow-hidden">
              <BaseImage v-if="selectedItem.imageUrl" :src="selectedItem.imageUrl" :alt="selectedItem.name"
                container-class="w-full h-full" img-class="w-full h-full object-cover" />
              <component v-else :is="getIcon(selectedItem.icon || 'Package')" class="w-9 h-9" />
            </div>
            <div class="flex gap-1 grid sm:grid-cols-2 grid-cols-1 flex-1">
              <div>
                <h3 class="font-semibold tracking-normal text-lg text-gray-700 dark:text-gray-200">{{ selectedItem.name }}</h3>
                <p class="font-base tracking-wide text-sm text-gray-500">{{ selectedItem.sku ? `SKU: ${selectedItem.sku}` : 'Sem SKU cadastrado' }}</p>

                <div class="flex flex-wrap items-center gap-1.5 mt-1">
                  <BaseBadge light :variant="selectedItem.type === 'service' ? 'info' : 'success'">
                    {{ selectedItem.type === 'service' ? 'Serviço' : 'Produto' }}
                  </BaseBadge>
                  <BaseBadge light variant="ia" v-if="selectedItem.aiGenerated">
                    <Sparkles class="w-3 h-3 mr-1" /> IA
                  </BaseBadge>
                </div>
              </div>
              <div>
                <h3 class="font-semibold tracking-normal text-lg text-gray-700 dark:text-gray-200">
                  R$ {{ (selectedItem.price ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
                </h3>
                <p class="font-base tracking-wide text-sm text-gray-500">por {{ selectedItem.unit || 'unidade' }}</p>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- Cards de Preço e Unidade (utilizando BaseMetricCard com variant) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BaseMetricCard
            color="sky"
            title="Preço de Venda"
            :subtitle="`Unidade comercial: ${selectedItem.unit || 'un'}`"
            :value="`R$ ${(selectedItem.price ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`"
            :icon="DollarSign"
            variant
          />

          <BaseMetricCard
            color="green"
            title="Unidade Comercial"
            :subtitle="selectedItem.type === 'service' ? 'Prestação de Serviço' : 'Item Físico / Produto'"
            :value="selectedItem.unit || 'Unidade'"
            :icon="Package"
            variant
          />
        </div>

        <!-- Descrição Comercial -->
        <div class="space-y-3">
          <div class="flex items-center justify-between px-1">
            <h3 class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 tracking-wide uppercase">
              Descrição Comercial
            </h3>
          </div>
          <div class="p-4 rounded-[.5rem] bg-gray-50/60 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
            <p class="text-sm text-gray-700 dark:text-gray-300 font-medium whitespace-pre-line leading-relaxed">
              {{ selectedItem.description || 'Nenhuma descrição informada.' }}
            </p>
          </div>
        </div>
      </div>
    </BaseDialog>

    <!-- Listagem Unificada (desktop & mobile) -->
    <BaseCard>
      <template #header>
        <BaseFilters :active-filters-count="activeFiltersCount" @clear="clearFilters" data-tour="catalogo-busca">
          <template #search>
            <BaseInput
            v-model="searchQuery"
              type="text"
              placeholder="Buscar itens por nome, código ou descrição..."
              :icon="Search"></BaseInput>
          </template>
        </BaseFilters>
      </template>
      <BaseDataList :columns="[
        { key: 'name', label: 'Item do Catálogo' },
        { key: 'type', label: 'Tipo' },
        { key: 'price', label: 'Preço', align: 'right', type: 'currency' },
        // { key: 'actions', label: '' }
      ]" :items="items || []" :pending="pending" :has-more="hasMore" :loading-more="loadingMore" @load-more="loadMore"
        empty-title="Catálogo Vazio"
        empty-subtitle="Sua lista de produtos e serviços aparecerá aqui. Comece cadastrando o primeiro.">
        <template #cell-name="{ item }">
          <div class="flex items-center gap-4 md:gap-6 cursor-pointer group" @click="openInfoModal(item)">
            <!-- <div class="w-12 h-12 md:w-16 md:h-16 rounded-[0.50rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm">
            <BaseImage v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" container-class="w-full h-full" img-class="w-full h-full object-cover" />
            <div v-else class="text-gray-400">
              <component :is="getIcon(item.icon || 'Package')" class="w-6 h-6 md:w-8 md:h-8" />
            </div>
          </div> -->
            <div class="flex flex-col">
              <span
                class="font-normal text-base md:text-lg text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {{ item.name }}
              </span>
              <span class="text-xs font-normal text-gray-400 dark:text-gray-500 line-clamp-1 max-w-xl mt-0.5">
                {{ item.description || 'Sem descrição comercial' }}
              </span>
            </div>
          </div>
        </template>

        <template #cell-type="{ item }">
          <div class="cursor-pointer" @click="openInfoModal(item)">
            <BaseBadge :variant=" item.type === 'service' ? 'info' : 'success' " light>{{ item.type === 'service' ? 'Serviço' : 'Produto' }}</BaseBadge>
          </div>
        </template>

        <template #cell-total="{ item }">
          <div class="flex flex-col items-start md:items-end cursor-pointer" @click="openInfoModal(item)">
            <span class="font-normal text-base md:text-lg text-gray-900 dark:text-gray-100">
              R$ {{ (item.price ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
            </span>
            <!-- <span class="text-[10px] font-normal text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">
              por {{ item.unit }}
            </span> -->
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
    </BaseCard>
  </div>
</template>
