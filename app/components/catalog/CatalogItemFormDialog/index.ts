import { ref, watch, computed } from 'vue'
import { Pencil, Trash2, RefreshCcw, Sparkles, Loader2, Package, Tag, Layers, DollarSign } from 'lucide-vue-next'
import type { CatalogItemDTO } from '../../../../types'

export function useCatalogItemFormDialog(
  props: { open: boolean; itemToEdit?: CatalogItemDTO | null },
  emit: { (e: 'update:open', val: boolean): void; (e: 'saved', item: any): void }
) {
  const { notify } = useAlerts()
  const { creditLabel } = useCreditCosts()
  const { Cropper, showCropper, rawImage, cropperRef, onFileChange, resetCropper } = useCropper()

  const isPhotoType = ref(false)

  const showForm = computed({
    get: () => props.open,
    set: (val) => emit('update:open', val)
  })

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

  const typeLabel = computed(() => {
    const found = typeOptions.find((x) => x.value === form.value.type)
    return found ? found.label : ''
  })

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

  const config = useRuntimeConfig()
  const maxCatalogSuggestName = computed(() => Number(config.public.aiMaxCatalogSuggestName) || 150)
  const maxCatalogSuggestContext = computed(() => Number(config.public.aiMaxCatalogSuggestContext) || 1000)

  const {
    isCreditConfirmOpen,
    confirmTitle,
    confirmDescription,
    executeWithCreditCheck,
    handleCreditConfirm,
    handleCreditCancel
  } = useConfirmCreditAction()

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

  async function suggestWithAI() {
    if (!form.value.name.trim()) {
      notify('Aviso', 'Digite o nome do item antes de pedir sugestão à IA.')
      return
    }
    if (form.value.name.length > maxCatalogSuggestName.value) {
      notify('Aviso', `O nome do item ultrapassou o limite máximo de ${maxCatalogSuggestName.value} caracteres.`)
      return
    }
    if (form.value.description && form.value.description.length > maxCatalogSuggestContext.value) {
      notify('Aviso', `A descrição/contexto ultrapassou o limite máximo de ${maxCatalogSuggestContext.value} caracteres.`)
      return
    }

    executeWithCreditCheck('catalogSuggest', async () => {
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
    }, { title: 'Gerar Descrição do Catálogo com IA' })
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
      emit('update:open', false)
      notify('Sucesso', `Item ${props.itemToEdit ? 'atualizado' : 'cadastrado'} com sucesso!`)
    } catch (e: any) {
      notify('Erro', e.data?.statusMessage || 'Erro ao salvar item no catálogo.')
    } finally {
      isSubmitting.value = false
    }
  }

  return {
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
  }
}
