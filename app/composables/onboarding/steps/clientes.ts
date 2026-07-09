import type { TourStep } from '../types'

export const steps: TourStep[] = [
  {
    element: '[data-tour="clientes-novo-btn"]',
    popover: {
      title: 'Cadastrar Novo Cliente',
      description: 'Clique aqui para adicionar um novo cliente. Os dados do cliente ficam salvos para uso rápido ao criar orçamentos.',
      side: 'bottom'
    }
  },
  {
    element: '[data-tour="clientes-busca"]',
    popover: {
      title: 'Busca de Clientes',
      description: 'Encontre rapidamente qualquer cliente pelo nome, e-mail ou documento. A busca filtra em tempo real.',
      side: 'bottom'
    }
  }
]
