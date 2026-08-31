import { ref, computed } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import * as LucideIcons from 'lucide-vue-next'
import { Plus, Search, Image, Pencil, Trash2, Sparkles, RefreshCcw, Package, ShoppingBag, HelpCircle, MoreVertical, Upload, Eye, DollarSign } from 'lucide-vue-next'
import { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuContent, DropdownMenuItem } from 'radix-vue'
import type { CatalogItemDTO } from '~/types'

export function useCatalogoPage() {
  const { notify, confirm: confirmAlert } = useAlerts()

  const searchQuery = ref('')
  const itemsPerPage = 10
  const query = computed(() => ({ search: searchQuery.value }))
  const {
    items,
    total: totalItems,
    pending,
    loadingMore,
    hasMore,
    loadMore,
    reset: refresh,
  } = useInfiniteList('/api/catalog', query, { itemsPerPage })

  const mobileSentinelRef = ref<HTMLElement | null>(null)
  useIntersectionObserver(mobileSentinelRef, ([entry]) => {
    if (entry?.isIntersecting && hasMore.value && !loadingMore.value) {
      loadMore()
    }
  }, { threshold: 0.1 })

  const showForm = ref(false)
  const showInfo = ref(false)
  const selectedItem = ref<CatalogItemDTO | null>(null)

  function openModal(item: CatalogItemDTO | null = null) {
    selectedItem.value = item
    showForm.value = true
  }

  function openInfoModal(item: CatalogItemDTO) {
    selectedItem.value = item
    showInfo.value = true
  }

  function handleItemSaved() {
    refresh()
  }

  async function deleteItem(id: string) {
    confirmAlert({
      title: 'Excluir Item',
      description: 'Tem certeza que deseja excluir este item?',
      variant: 'destructive',
      actionText: 'Excluir',
      onConfirm: async () => {
        try {
          await $fetch(`/api/catalog/${id}`, { method: 'DELETE' as any })
          notify('Sucesso', 'Item do catálogo removido com sucesso')
          refresh()
        } catch (e: any) {
          if (e?.statusCode === 404 || e?.response?.status === 404) {
            notify('Sucesso', 'Item do catálogo removido com sucesso')
            refresh()
            return
          }
          notify('Erro', 'Erro ao excluir item')
        }
      }
    })
  }

  function getIcon(name: string) {
    return (LucideIcons as any)[name] || HelpCircle
  }

  const activeFiltersCount = computed(() => {
    return searchQuery.value ? 1 : 0
  })

  function clearFilters() {
    searchQuery.value = ''
  }

  return {
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
    DollarSign,
    DropdownMenuRoot,
    DropdownMenuTrigger,
    DropdownMenuPortal,
    DropdownMenuContent,
    DropdownMenuItem,
  }
}
