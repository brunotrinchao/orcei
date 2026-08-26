import { ref, computed } from 'vue'
import { Plus, Trash2, ArrowDown, Search, ChevronDown, ChevronUp, GripVertical } from 'lucide-vue-next'
import { useFormValidation } from '~/composables/useFormValidation'

export function useProposalStepScope(
  props: { form: any; catalogItems: any[]; totalCatalogItems: number; catalogSearch: string; isGenerating: boolean },
  emit: (e: string, ...args: any[]) => void
) {
  const internalSearch = computed({
    get: () => props.catalogSearch,
    set: (val) => emit('update:catalogSearch', val)
  })

  const { validate: validateRegisteredFields, reset, submitAttempted } = useFormValidation()

  function validateStep(): boolean {
    const registeredOk = validateRegisteredFields()
    const allItems = [...props.form.items, ...props.form.upsellItems]
    const itemsOk = props.form.items.length > 0 &&
      allItems.every((item: any) => item.name?.trim() && item.price >= 0 && item.quantity > 0)
    return registeredOk && itemsOk
  }

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

  return {
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
    selectCatalogItem,
    onCatalogItemSelect,
    moveToUpsell,
    moveToItems,
    isItemSelected,
    Plus,
    Trash2,
    ArrowDown,
    Search,
    ChevronDown,
    ChevronUp,
    GripVertical
  }
}
