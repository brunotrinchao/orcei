<script setup lang="ts">
import type { CatalogItemDTO } from '../../../../types'
import { useCatalogItemFormDialog } from './index'

const props = defineProps<{
  open: boolean
  itemToEdit?: CatalogItemDTO | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'saved', item: any): void
}>()

const {
  showForm,
  form,
  isSubmitting,
  isSuggesting,
  aiAssisted,
  isPhotoType,
  unitOptions,
  typeOptions,
  typeLabel,
  Cropper,
  showCropper,
  rawImage,
  cropperRef,
  onFileChange,
  resetCropper,
  cropImage,
  suggestWithAI,
  saveItem,
  creditLabel,
  isCreditConfirmOpen,
  confirmTitle,
  confirmDescription,
  handleCreditConfirm,
  handleCreditCancel,
  Pencil,
  Trash2,
  RefreshCcw,
  Sparkles,
  Loader2,
  Package,
  Tag,
  Layers,
  DollarSign
} = useCatalogItemFormDialog(props, emit)
</script>

<template>
  <BaseDrawer  v-model:open="showForm"
    :title="itemToEdit ? 'Editar Item' : 'Novo Item'" size="xl">
    
    <!-- Modal Modo Cortar Foto (Cropper Active) -->
    <div v-if="showCropper" class="space-y-4 animate-in fade-in duration-200">
      <div class="flex items-center justify-between">
        <h4 class="text-xs font-black uppercase text-gray-700 dark:text-gray-300 tracking-wider">
          Ajustar Recorte da Foto
        </h4>
        <BaseButton variant="ghost" size="sm" @click="resetCropper">
          Cancelar
        </BaseButton>
      </div>

      <div class="bg-gray-100 dark:bg-gray-950 rounded-[.5rem] overflow-hidden min-h-[380px] border border-gray-200 dark:border-gray-800">
        <Cropper
          ref="cropperRef"
          :src="rawImage"
          :stencil-props="{
            aspectRatio: 1 / 1,
            movable: true,
            resizable: true,
          }"
          class="w-full h-[380px] cropper"
        />
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <BaseButton variant="secondary" size="md" @click="resetCropper">
          Voltar
        </BaseButton>
        <BaseButton
          variant="primary"
          size="md"
          :loading="isSubmitting"
          @click="cropImage"
        >
          Aplicar Recorte
        </BaseButton>
      </div>
    </div>

    <!-- Main Form Mode -->
    <form
      v-else
      id="catalog-form"
      @submit.prevent="saveItem"
      class="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300 py-2 catalog-item-form-dialog"
    >
      <!-- Seção 1: Identidade Visual e Classificação -->
        <div class="space-y-6">
          <div class="grid grid-cols-1 gap-4 items-start">
            <!-- Identidade Visual (Ícone vs Foto) -->
            <div class="space-y-2">
              <div class="flex items-center justify-between min-h-[20px]">
                <div class="flex bg-gray-100 dark:bg-gray-800/80 p-1 rounded-[.5rem] w-[120px]">
                  <button
                    type="button"
                    @click="isPhotoType = false; form.imageUrl = '';"
                    :class="[
                      !isPhotoType && form.imageUrl == ''
                        ? 'bg-white dark:bg-gray-950 shadow-sm text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-gray-400 dark:text-gray-500',
                    ]"
                    class="flex-1 px-2 py-1 rounded-lg text-[9px] font-semibold transition-all"
                  >
                    Ícone
                  </button>
                  <button
                    type="button"
                    @click="isPhotoType = true"
                    class="relative flex-1 px-2 py-1 rounded-lg text-[9px] font-semibold transition-all overflow-hidden"
                    :class="[
                      isPhotoType || form.imageUrl
                        ? 'bg-white dark:bg-gray-950 shadow-sm text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-gray-400 dark:text-gray-500',
                    ]"
                  >
                    Foto
                  </button>
                </div>
              </div>

              <!-- Preview de Imagem Enviada -->
              <div
                v-if="form.imageUrl"
                class="relative group w-full h-[200px] bg-gray-50 dark:bg-gray-950 rounded-[.5rem] border-2 border-dashed border-gray-200 dark:border-gray-800 overflow-hidden flex items-center justify-center animate-in fade-in zoom-in-95 duration-200 shadow-sm"
              >
                <BaseImage
                  :src="form.imageUrl"
                  alt="Preview da Imagem"
                  container-class="w-full h-full"
                  img-class="w-full h-full object-cover"
                />
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <label class="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-[.5rem] text-gray-900 dark:text-white cursor-pointer hover:scale-105 transition-transform shadow-md">
                    <Pencil class="w-4 h-4" />
                    <input type="file" accept="image/*" @change="onFileChange" class="hidden" />
                  </label>
                  <BaseButton
                    type="button"
                    variant="danger"
                    size="icon-sm"
                    @click="form.imageUrl = ''"
                    aria-label="Remover Foto"
                  >
                    <Trash2 class="w-4 h-4" />
                  </BaseButton>
                </div>
              </div>

              <!-- Seletor de Ícones Padronizado -->
              <div v-if="!isPhotoType && !form.imageUrl" class="w-full animate-in fade-in zoom-in-95 duration-200">
                <BaseIconSelect v-model="form.icon" />
              </div>

              <div v-if="isPhotoType && form.imageUrl == ''" class="transition-all animate-fadeIn">
                <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-[.5rem] cursor-pointer bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-all relative group">
                  <div class="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                    <svg class="w-8 h-8 mb-2 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p class="mb-1 text-xs text-gray-500 dark:text-gray-400">
                      <span class="font-bold text-blue-600 dark:text-blue-400">Clique para enviar</span> ou arraste e solte
                    </p>
                    <p class="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">PNG ou JPG</p>
                  </div>
                  <input type="file" accept="image/*" @change="onFileChange" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                </label>
              </div>
            </div>

            <!-- Dados Principais -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BaseSelect
                v-model="form.type"
                label="Tipo de Item"
                :options="typeOptions"
                required
              />

              <BaseInput
                v-model="form.name"
                :label="`Nome do ${typeLabel}`"
                placeholder="Ex: Consultoria Técnica ou Peça de Reposição"
                required
              />

              <BaseInput
                v-model="form.sku"
                label="Código / SKU"
                placeholder="Ex: SERV-001"
              />
            </div>
          </div>

          <!-- Seção 2: Precificação e Unidade -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BaseInput
              v-model="form.price"
              label="Preço / Valor Base (R$)"
              mask="currency"
              placeholder="0,00"
              prefix="R$"
              required
            />

            <BaseSelect
              v-model="form.unit"
              label="Unidade de Medida"
              :options="unitOptions"
              required
            />
          </div>

          <!-- Seção 3: Descrição e Assistente de IA -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-sm font-semibold text-slate-500 dark:text-gray-400 tracking-wide ml-1">
                Descrição Comercial do {{ typeLabel }}
              </label>

              <!-- Botão com IA para Gerar Descrição -->
               <BaseButton
               type="button"
               variant="ia"
               :tooltip="creditLabel('catalogSuggest')"
               size="xs"
                @click="suggestWithAI"
                :disabled="isSuggesting"
               >
                <Loader2 v-if="isSuggesting" class="w-3 h-3 animate-spin mr-1" />
                <Sparkles v-else class="w-3 h-3 mr-1" />
                <span>{{ isSuggesting ? 'Gerando...' : 'Usar IA' }}</span>
              </BaseButton>
            </div>

            <BaseTextarea
              v-model="form.description"
              :rows="3"
              :maxLength="150"
              placeholder="Descreva em detalhes o escopo do serviço, garantia ou especificações..."
            />
          </div>
        </div>
    </form>

    <!-- Modal de Confirmação de Uso de Créditos IA -->
    <ConfirmCreditDialog
      v-model:open="isCreditConfirmOpen"
      :title="confirmTitle"
      :description="confirmDescription"
      @confirm="handleCreditConfirm"
      @cancel="handleCreditCancel"
    />

    <template #footer>
      <div v-if="!showCropper" class="flex items-center justify-end gap-3 w-full">
        <BaseButton
          variant="secondary"
          size="md"
          @click="showForm = false"
          :disabled="isSubmitting || isSuggesting"
        >
          Cancelar
        </BaseButton>


        <BaseButton type="button" :disabled="isSubmitting || isSuggesting" :loading="isSubmitting" @click="saveItem">
          {{ itemToEdit ? 'Salvar' : 'Cadastrar' }}
        </BaseButton>
      </div>
    </template>
    </BaseDrawer>
</template>

<style scoped src="./index.css"></style>
