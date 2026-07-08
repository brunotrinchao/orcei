import type { TourStep } from '../types'

export const steps: TourStep[] = [
  {
    element: '[data-tour="catalogo-novo-item-btn"]',
    popover: {
      title: 'Novo Item do Catalogo',
      description: 'Adicione produtos ou servicos ao seu catalogo. Itens cadastrados aqui podem ser reutilizados nos orcamentos.',
      side: 'bottom'
    }
  },
  {
    element: '[data-tour="catalogo-busca"]',
    popover: {
      title: 'Busca no Catalogo',
      description: 'Pesquise por nome, descricao ou SKU para encontrar rapidamente itens do seu catalogo.',
      side: 'bottom'
    }
  }
]
