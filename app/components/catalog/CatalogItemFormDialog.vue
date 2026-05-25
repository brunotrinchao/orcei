<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { Pencil, Trash2, RefreshCcw } from 'lucide-vue-next'
import type { CatalogItemDTO } from '../../../../types'

const props = defineProps<{
  open: boolean
  itemToEdit?: CatalogItemDTO | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'saved', item: any): void // item added or updated
}>()

const { notify } = useAlerts()

const showForm = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

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
    }
  }
})


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
      icon: form.value.icon
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
    <!-- Modal de Formulário -->
    <BaseDialog
      v-model:open="showForm"
      :title="showCropper ? 'Ajustar Imagem' : (itemToEdit ? 'Editar Item' : 'Novo Item')"
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

      <form v-else id="catalog-form" @submit.prevent="saveItem" class="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-4">
        
        <!-- Section 1: Visual & Name -->
        <div class="space-y-6">
          <div class="space-y-2">
            <h3 class="text-lg font-black text-gray-900 tracking-tight">Identidade e Classificação</h3>
            <p class="text-sm text-gray-500 font-medium">Defina o visual e o nome comercial do seu item.</p>
          </div>

          <div class="space-y-8">
            <!-- Visual Identity & Type Row -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Identidade Visual</label>
                  <div class="flex bg-gray-100 p-1 rounded-xl w-[120px]">
                    <button 
                      type="button"
                      @click="form.imageUrl = ''"
                      :class="[!form.imageUrl ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400']"
                      class="flex-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all"
                    >Ícone</button>
                    <button 
                      type="button"
                      class="relative flex-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all overflow-hidden"
                      :class="[form.imageUrl ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400']"
                    >
                      Foto
                      <input type="file" accept="image/*" @change="onFileChange" class="absolute inset-0 opacity-0 cursor-pointer">
                    </button>
                  </div>
                </div>

                <!-- Image Preview -->
                <div v-if="form.imageUrl" class="relative group w-full h-[60px] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center animate-in fade-in zoom-in-95 duration-200 shadow-sm">
                  <img :src="form.imageUrl" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label class="p-1.5 bg-white rounded-lg text-gray-900 cursor-pointer hover:scale-110 transition-transform">
                      <Pencil class="w-4 h-4" />
                      <input type="file" accept="image/*" @change="onFileChange" class="hidden">
                    </label>
                    <button type="button" @click="form.imageUrl = ''" class="p-1.5 bg-white rounded-lg text-red-600 hover:scale-110 transition-transform">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <!-- Icon Selector -->
                <div v-else class="w-full animate-in fade-in zoom-in-95 duration-200">
                  <BaseIconSelect v-model="form.icon" />
                </div>
              </div>

              <!-- Type & SKU -->
              <div class="space-y-4">
                <BaseSelect 
                  v-model="form.type" 
                  label="Tipo de Item" 
                  :options="typeOptions" 
                />
                <BaseInput 
                  v-model="form.sku" 
                  label="SKU / Cód. (Opcional)" 
                  placeholder="Ex: SRV-001" 
                />
              </div>
            </div>

            <!-- Name -->
            <div class="space-y-4">
              <BaseInput 
                v-model="form.name" 
                label="Nome Comercial do Item" 
                placeholder="Ex: Desenvolvimento de Site Institucional" 
                required 
              />
            </div>
          </div>
        </div>

        <!-- Section 2: Values & Description -->
        <div class="space-y-6 pt-8 border-t border-gray-100">
          <div class="space-y-2">
            <h3 class="text-lg font-black text-gray-900 tracking-tight">Valores e Detalhes</h3>
            <p class="text-sm text-gray-500 font-medium">Como este item será cobrado e descrito no orçamento.</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <BaseInput 
              v-model="form.price" 
              label="Preço (R$)" 
              mask="currency"
              required 
            />
            <BaseSelect 
              v-model="form.unit" 
              label="Unidade de Medida" 
              :options="unitOptions" 
            />
          </div>

          <div class="space-y-3 pt-2">
            <div class="flex justify-between items-center px-1">
              <label class="block text-xs font-black text-gray-500 uppercase tracking-widest">Descrição Comercial</label>
            </div>
            <textarea 
              v-model="form.description" 
              rows="4" 
              class="w-full px-6 py-5 bg-white border-2 border-gray-100 rounded-[1.5rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-gray-900 shadow-inner"
              placeholder="Descreva o que está incluído..."
            ></textarea>
          </div>
        </div>
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
            {{ isSubmitting ? 'Salvando...' : (itemToEdit ? 'Atualizar Item' : 'Salvar no Catálogo') }}
          </BaseButton>
        </template>
      </template>
    </BaseDialog>


  </div>
</template>

<style scoped>
.cropper { height: 400px; background: #f3f4f6; }
</style>
