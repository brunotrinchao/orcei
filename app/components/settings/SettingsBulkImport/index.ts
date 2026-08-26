import { ref } from 'vue'
import { Upload, Download } from 'lucide-vue-next'

export function useSettingsBulkImport() {
  const modalOpen = ref(false)
  const modalType = ref<'client' | 'catalog'>('client')

  function openModal(type: 'client' | 'catalog') {
    modalType.value = type
    modalOpen.value = true
  }

  const cards = [
    {
      type: 'client' as const,
      title: 'Clientes',
      description: 'Importe vários clientes de uma vez a partir de um arquivo CSV.',
      templateHref: '/templates/modelo-clientes.csv'
    },
    {
      type: 'catalog' as const,
      title: 'Catálogo',
      description: 'Importe vários produtos ou serviços de uma vez a partir de um arquivo CSV.',
      templateHref: '/templates/modelo-catalogo.csv'
    }
  ]

  return {
    modalOpen,
    modalType,
    openModal,
    cards,
    Upload,
    Download
  }
}
