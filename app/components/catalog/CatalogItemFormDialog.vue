<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Pencil, Trash2, RefreshCcw, Sparkles, Loader2, Package, Tag, Layers, DollarSign } from 'lucide-vue-next'
import type { CatalogItemDTO } from '../../../../types'

const props = defineProps<{
  open: boolean
  itemToEdit?: CatalogItemDTO | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'saved', item: any): void
}>()

const { notify } = useAlerts()
const { creditLabel } = useCreditCosts()
const { Cropper, showCropper, rawImage, cropperRef, onFileChange, resetCropper } = useCropper()

const showForm = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

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
    resetCropper()
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
const isSuggesting = ref(false)
const aiAssisted = ref(false)

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

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    if (props.itemToEdit) {
      form.value = { 
        type: props.itemToEdit.type,
        name: props.itemToEdit.name, 
        description: props.itemToEdit.description || '', 
        price: props.itemToEdit.price, 
        unit: props.itemToEdit.unit || 'UN',
        sku: props.itemToEdit.sku || '',
        imageUrl: props.itemToEdit.imageUrl || '',
        icon: props.itemToEdit.icon || 'Package'
      }
      aiAssisted.value = !!props.itemToEdit.aiAssisted
    } else {
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
      aiAssisted.value = false
    }
  }
})

async function suggestWithAI() {
  if (!form.value.name.trim()) {
    notify('Aviso', 'Digite o nome do item antes de pedir sugestão à IA.')
    return
  }

  isSuggesting.value = true
  try {
    const data: any = await $fetch('/api/ai/catalog-suggest', {
      method: 'POST',
      body: {
        name: form.value.name,
        type: form.value.type,
        context: form.value.description || undefined
      }
    })

    if (data.description) form.value.description = data.description
    if (data.price) form.value.price = data.price
    if (data.unit) form.value.unit = data.unit
    aiAssisted.value = true

    notify('Sucesso', 'Sugestão da IA aplicada com sucesso!')
  } catch (e: any) {
    notify('Erro', e.data?.statusMessage || 'Erro ao gerar sugestão com IA')
  } finally {
    isSuggesting.value = false
  }
}

async function saveItem() {
  isSubmitting.value = true
  try {
    const method = props.itemToEdit ? 'PUT' : 'POST'
    const endpoint = props.itemToEdit ? `/api/catalog/${props.itemToEdit._id}` : '/api/catalog'

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
      icon: form.value.icon,
      aiAssisted: aiAssisted.value
    }

    const response = await $fetch(endpoint, {
      method,
      body: payload
    })
    
    emit('saved', response)
    showForm.value = false
  } catch (e: any) {
    const html = parseApiErrors(e)
    notify(html ? 'Dados inválidos' : 'Erro', html ?? (e.data?.statusMessage || 'Erro ao salvar item'))
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div>
    <!-- Modal de Formulário do Catálogo -->
    <BaseDialog
      v-model:open="showForm"
      :title="showCropper ? 'Ajustar Foto do Item' : (itemToEdit ? 'Editar Item do Catálogo' : 'Novo Item do Catálogo')"
      size="lg"
    >
      <!-- Cropper Mode -->
      <div v-if="showCropper" class="flex flex-col gap-6 py-2">
        <p class="text-xs font-bold text-gray-500 dark:text-gray-400">
          Arraste e redimensione a imagem para o enquadramento ideal (1:1).
        </p>
        <div class="bg-gray-100 dark:bg-gray-950 rounded-3xl overflow-hidden min-h-[380px] border border-gray-200 dark:border-gray-800">
          <Cropper
            ref="cropperRef"
            :src="rawImage"
            :stencil-props="{
              aspectRatio: 1/1,
              movable: true,
              resizable: true
            }"
            class="w-full h-[380px] cropper"
          />
        </div>
      </div>

      <!-- Main Form Mode -->
      <form v-else id="catalog-form" @submit.prevent="saveItem" class="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300 py-2">
        
        <!-- Seção 1: Identidade Visual e Classificação -->
        <BaseSectionCard 
          title="Identidade e Classificação"
          subtitle="Escolha a representação visual e o tipo do seu produto ou serviço."
          :icon="Package"
        >
          <div class="space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              
              <!-- Identidade Visual (Ícone vs Foto) -->
              <div class="space-y-2">
                <div class="flex items-center justify-between min-h-[20px]">
                  <label class="text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest ml-1">
                    Amostra Visual
                  </label>
                  <div class="flex bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl w-[120px]">
                    <button 
                      type="button"
                      @click="form.imageUrl = ''"
                      :class="[!form.imageUrl ? 'bg-white dark:bg-gray-950 shadow-sm text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-400 dark:text-gray-500']"
                      class="flex-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all"
                    >
                      Ícone
                    </button>
                    <button 
                      type="button"
                      class="relative flex-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all overflow-hidden"
                      :class="[form.imageUrl ? 'bg-white dark:bg-gray-950 shadow-sm text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-400 dark:text-gray-500']"
                    >
                      Foto
                      <input type="file" accept="image/*" @change="onFileChange" class="absolute inset-0 opacity-0 cursor-pointer">
                    </button>
                  </div>
                </div>

                <!-- Preview de Imagem Enviada -->
                <div v-if="form.imageUrl" class="relative group w-full h-[56px] bg-gray-50 dark:bg-gray-950 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 overflow-hidden flex items-center justify-center animate-in fade-in zoom-in-95 duration-200 shadow-sm">
                  <img :src="form.imageUrl" class="w-full h-full object-cover" loading="lazy">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label class="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white cursor-pointer hover:scale-105 transition-transform shadow-md">
                      <Pencil class="w-4 h-4" />
                      <input type="file" accept="image/*" @change="onFileChange" class="hidden">
                    </label>
                    <BaseButton type="button" variant="danger" size="icon-sm" @click="form.imageUrl = ''" aria-label="Remover Foto">
                      <Trash2 class="w-4 h-4" />
                    </BaseButton>
                  </div>
                </div>
                
                <!-- Seletor de Ícones Padronizado -->
                <div v-else class="w-full animate-in fade-in zoom-in-95 duration-200">
                  <BaseIconSelect v-model="form.icon" />
                </div>
              </div>

              <!-- Tipo de Item e SKU -->
              <div class="space-y-4">
                <BaseSelect 
                  v-model="form.type" 
                  label="Tipo de Item *" 
                  :options="typeOptions" 
                  :icon="Layers"
                  required
                />
                <BaseInput 
                  v-model="form.sku" 
                  label="SKU / Cód. (Opcional)" 
                  placeholder="Ex: SRV-001" 
                  :icon="Tag"
                />
              </div>
            </div>

            <!-- Nome Comercial do Item -->
            <BaseInput 
              v-model="form.name" 
              label="Nome Comercial do Item *" 
              placeholder="Ex: Desenvolvimento de Website Institucional" 
              required 
            />
          </div>
        </BaseSectionCard>

        <!-- Seção 2: Preços e Descrição Comercial -->
        <BaseSectionCard
          title="Valores e Detalhes Comerciais"
          subtitle="Defina o valor base e descreva os detalhes que aparecerão na proposta."
          :icon="DollarSign"
          icon-bg-class="bg-emerald-50 dark:bg-emerald-950/50"
          icon-color-class="text-emerald-600 dark:text-emerald-400"
        >
          <div class="space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <BaseInput 
                v-model="form.price" 
                label="Preço Base (R$) *" 
                mask="currency"
                required 
              />
              <BaseSelect 
                v-model="form.unit" 
                label="Unidade de Medida" 
                :options="unitOptions" 
              />
            </div>

            <!-- Descrição Comercial + Sugestão Inteligente com IA -->
            <div class="space-y-2">
              <div class="flex justify-between items-center px-1">
                <label class="block text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                  Descrição Comercial
                </label>
                <BaseButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  @click="suggestWithAI"
                  :disabled="isSuggesting || !form.name.trim()"
                  class="text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 font-black text-[10px] uppercase tracking-wider"
                >
                  <Loader2 v-if="isSuggesting" class="w-3.5 h-3.5 animate-spin mr-1" />
                  <Sparkles v-else class="w-3.5 h-3.5 mr-1" />
                  {{ creditLabel('catalogSuggest', 'Gerar Descrição com IA') }}
                </BaseButton>
              </div>
              <BaseTextarea 
                v-model="form.description" 
                :rows="4" 
                placeholder="Descreva em detalhes o que está incluído neste produto ou serviço..."
              />
            </div>
          </div>
        </BaseSectionCard>
      </form>

      <!-- Rodapé do Modal -->
      <template #footer>
        <template v-if="showCropper">
          <BaseButton type="button" variant="secondary" @click="showCropper = false">
            Cancelar
          </BaseButton>
          <BaseButton type="button" @click="cropImage" :disabled="isSubmitting">
            <RefreshCcw v-if="isSubmitting" class="w-4 h-4 animate-spin mr-2" />
            Confirmar Corte
          </BaseButton>
        </template>
        <template v-else>
          <BaseButton type="button" variant="secondary" @click="showForm = false">
            Cancelar
          </BaseButton>
          <BaseButton type="button" @click="saveItem" :disabled="isSubmitting" :loading="isSubmitting">
            <RefreshCcw v-if="isSubmitting" class="w-4 h-4 animate-spin mr-2" />
            {{ itemToEdit ? 'Atualizar Item' : 'Salvar no Catálogo' }}
          </BaseButton>
        </template>
      </template>
    </BaseDialog>
  </div>
</template>

<style scoped>
.cropper { height: 380px; background: #f3f4f6; }
.dark .cropper,
:deep(.dark .vue-advanced-cropper) {
  background: #030712;
}
</style>
