import type { TourStep } from '../types'

export const steps: TourStep[] = [
  {
    element: '[data-tour="catalogo-novo-item-btn"]',
    popover: {
      title: 'Novo Item do Catálogo',
      description: 'Adicione produtos ou serviços ao seu catálogo. Itens cadastrados aqui podem ser reutilizados nos orçamentos.',
      side: 'bottom'
    }
  },
  {
    element: '[data-tour="catalogo-busca"]',
    popover: {
      title: 'Busca no Catálogo',
      description: 'Pesquise por nome, descrição ou SKU para encontrar rapidamente itens do seu catálogo.',
      side: 'bottom'
    }
  }
]
