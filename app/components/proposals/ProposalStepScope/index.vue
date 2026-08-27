<script setup lang="ts">
import CatalogItemFormDialog from '../../catalog/CatalogItemFormDialog/index.vue'
import { useProposalStepScope } from './index'

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

const {
  internalSearch,
  validateStep,
  reset,
  submitAttempted,
  selectedCatalogItemId,
  catalogOptions,
  showCatalogItemFormDialog,
  expandedItemIdx,
  expandedUpsellIdx,
  onCatalogItemCreated,
  toggleItemExpansion,
  onCatalogItemSelect,
  moveToUpsell,
  moveToItems,
  Plus,
  Trash2,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  GripVertical
} = useProposalStepScope(props, emit)

defineExpose({ validate: validateStep, reset })
</script>

<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-5 proposal-step-scope-container">
    <div class="space-y-2 px-3">
      <h3 class="text-lg font-black text-gray-900 dark:text-white tracking-tight">Serviços e Valores</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Defina o escopo obrigatório e adicione pacotes opcionais (upsell).</p>
    </div>

    <!-- Smart Catalog Search -->
    <div class="relative z-20 px-3">
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
        <BaseButton
          type="button"
          variant="outline"
          title="Cadastrar novo produto/serviço"
          aria-label="Cadastrar novo produto/serviço"
          style="height: 3.5rem; width: 3.5rem; padding: 0;"
          class="flex items-center justify-center"
          @click="showCatalogItemFormDialog = true"
        >
          <Plus class="w-4 h-4" />
        </BaseButton>
      </div>
    </div>

    <!-- Escopo Principal -->
    <BaseSectionCard :title="`Itens Obrigatórios (${form.items.length})`" :noBorder="true">
      <div
        v-if="form.items.length === 0"
        class="p-8 border-2 border-dashed rounded-[0.75rem] text-center font-medium transition-colors"
        :class="submitAttempted ? 'border-red-300 dark:border-red-500/50 text-red-500' : 'border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500'"
      >
        Adicione itens buscando no catálogo acima ou clicando em "+".
        <span v-if="submitAttempted" class="block text-[10px] font-black uppercase tracking-widest mt-2">Pelo menos 1 item obrigatório é necessário</span>
      </div>

      <div v-else class="space-y-3">
        <div 
          v-for="(item, idx) in form.items" 
          :key="'item_'+idx" 
          class="bg-white dark:bg-gray-900 rounded-[0.75rem] border-2 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 shadow-sm overflow-hidden transition-all group"
        >
          <!-- Cabecalho Compacto (Sempre visível) -->
          <div class="p-4 sm:flex items-center gap-4">
            <div class="flex-1 flex items-center gap-3 min-w-0 w-full sm:w-[30%]">
              <template v-if="!item.catalogItemId">
                <input
                  v-model="item.name"
                  class="flex-1 text-sm sm:text-base font-black text-gray-900 dark:text-gray-50 bg-transparent border-b focus:border-blue-500 focus:ring-0 p-1 outline-none transition-all truncate"
                  :class="submitAttempted && !item.name.trim() ? 'border-red-400 dark:border-red-500' : 'border-transparent'"
                  placeholder="Nome do Serviço"
                >
              </template>
              <template v-else>
                <span class="flex-1 text-sm sm:text-base font-black text-gray-900 dark:text-gray-50 p-1 sm:truncate ">{{ item.name }}</span>
              </template>
              <BaseButton variant="ghost" size="icon-sm" @click="toggleItemExpansion(idx)" type="button" aria-label="Editar Descrição" class="sm:hidden block">
                <ChevronUp v-if="expandedItemIdx === idx" class="w-4 h-4" />
                <ChevronDown v-else class="w-4 h-4" />
              </BaseButton>
            </div>

            <div class="flex items-center gap-3 sm:gap-6 shrink-0 w-full sm:w-[70%] sm:flex-1 sm:justify-end mt-3 sm:mt-0">
              <div class="flex items-center gap-2 w-[40%] sm:w-auto">
                <BaseInput
                  v-model="item.quantity"
                  type="number"
                  label=""
                  placeholder=""
                  prefix="Qtd"
                  class="w-full sm:w-auto"
                  required
                  value="0"
                />
              </div>
              <div class="flex items-center gap-2 w-[60%] sm:w-auto">
                <BaseInput
                  v-model="item.price"
                  mask="currency"
                  label=""
                  placeholder=""
                  prefix="R$"
                  class="w-full"
                  required
                />
              </div>
              
              <div class="hidden md:block text-right min-w-[90px]">
                <span class="text-sm font-black text-gray-900 dark:text-gray-50">R$ {{ (item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
              </div>
            </div>

            <!-- Ações -->
            <div class="flex items-center gap-1 shrink-0 ml-2 w-full sm:w-auto">
              <!-- <BaseButton variant="ghost" size="icon-sm" @click="toggleItemExpansion(idx)" type="button" aria-label="Editar Descrição" class="hidden sm:block">
                <ChevronUp v-if="expandedItemIdx === idx" class="w-4 h-4" />
                <ChevronDown v-else class="w-4 h-4" />
              </BaseButton> -->
              <BaseButton variant="ghost" size="icon-sm" @click="moveToUpsell(idx)" type="button" class="hidden sm:inline-flex text-blue-400 hover:text-blue-600 dark:hover:text-blue-300" aria-label="Mover para Opcionais">
                <ArrowDown class="w-4 h-4" />
              </BaseButton>
              
              <BaseButton variant="ghost" size="icon-sm" @click="form.items.splice(idx, 1)" type="button" class="text-red-400 hover:text-red-600" aria-label="Remover Item">
                <Trash2 class="w-4 h-4" />
              </BaseButton>
            </div>
          </div>

          <!-- Área Expandida (Descrição) -->
          <div v-show="true" class="px-4 pb-4 bg-gray-50/50 dark:bg-gray-950/50 border-t border-gray-100 dark:border-gray-800">
            <div class="pt-4 flex flex-col gap-3">
              <div class="relative">
                <template v-if="!item.catalogItemId">
                  <textarea 
                    v-model="item.description" 
                    rows="1" 
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
          class="bg-blue-50/30 dark:bg-blue-950/20 rounded-[0.75rem] border-2 border-dashed border-blue-200 dark:border-blue-900/50 hover:border-blue-300 dark:hover:border-blue-800 shadow-sm overflow-hidden transition-all group"
        >
          <!-- Cabecalho Compacto -->
          <div class="p-4 sm:flex items-center gap-4">
            <div class="flex-1 flex items-center gap-3 min-w-0 w-full sm:w-[30%]">
              <template v-if="!item.catalogItemId">
                <input
                  v-model="item.name"
                  class="flex-1 text-sm sm:text-base font-black text-gray-900 dark:text-gray-50 bg-transparent border-b focus:border-blue-500 focus:ring-0 p-1 outline-none transition-all truncate"
                  :class="submitAttempted && !item.name.trim() ? 'border-red-400 dark:border-red-500' : 'border-transparent'"
                  placeholder="Nome do Opcional"
                >
              </template>
              <template v-else>
                <span class="flex-1 text-sm sm:text-base font-black text-gray-900 dark:text-gray-50 p-1 sm:truncate ">{{ item.name }}</span>
              </template>
              <BaseButton variant="ghost" size="icon-sm" @click="toggleItemExpansion(idx, true)" type="button" aria-label="Editar Descrição" class="sm:hidden block">
                <ChevronUp v-if="expandedItemIdx === idx" class="w-4 h-4" />
                <ChevronDown v-else class="w-4 h-4" />
              </BaseButton>
            </div>

            <div class="flex items-center gap-3 sm:gap-6 shrink-0 w-full sm:flex-1 sm:justify-end mt-3 sm:mt-0">
              <div class="flex items-center gap-2 w-[40%] sm:w-auto">
                <BaseInput
                  v-model="item.quantity"
                  type="number"
                  label=""
                  placeholder=""
                  prefix="Qtd"
                  class="w-full"
                  required
                />
              </div>
              <div class="flex items-center gap-2 w-[60%] sm:w-auto">
                <BaseInput
                  v-model="item.price"
                  mask="currency"
                  label=""
                  placeholder=""
                  prefix="R$"
                  class="w-full"
                  required
                />
              </div>
              
              <div class="hidden md:block text-right min-w-[80px]">
                <span class="text-sm font-black text-gray-900 dark:text-gray-50">+ R$ {{ (item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
              </div>
            </div>

            <div class="flex items-center gap-1 shrink-0 ml-2 w-full sm:w-auto">
              <!-- <BaseButton variant="ghost" size="icon-sm" @click="toggleItemExpansion(idx, true)" type="button" aria-label="Editar Descrição" class="hidden sm:block">
                <ChevronUp v-if="expandedUpsellIdx === idx" class="w-4 h-4"/>
                <ChevronDown v-else class="w-4 h-4" />
              </BaseButton> -->
              <BaseButton variant="ghost" size="icon-sm" @click="moveToItems(idx)" type="button" class="hidden sm:inline-flex text-green-500 hover:text-green-600" aria-label="Tornar Obrigatório">
                <Plus class="w-4 h-4" />
              </BaseButton>
              <BaseButton variant="ghost" size="icon-sm" @click="form.upsellItems.splice(idx, 1)" type="button" class="text-red-400 hover:text-red-600" aria-label="Remover Opcional">
                <Trash2 class="w-4 h-4" />
              </BaseButton>
            </div>
          </div>

          <!-- Área Expandida (Descrição) -->
          <div v-show="true" class="px-4 pb-4 bg-white/50 dark:bg-gray-950/40 border-t border-blue-100 dark:border-blue-900/40">
            <div class="pt-4 flex flex-col gap-3">
              <div class="relative">
                <template v-if="!item.catalogItemId">
                  <textarea 
                    v-model="item.description" 
                    rows="1" 
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

    <CatalogItemFormDialog 
      v-model:open="showCatalogItemFormDialog"
      @saved="onCatalogItemCreated"
    />
  </div>
</template>

<style scoped src="./index.css"></style>
