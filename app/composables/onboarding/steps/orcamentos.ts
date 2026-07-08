import type { TourStep } from '../types'

export const steps: TourStep[] = [
  {
    element: '[data-tour="orcamentos-novo-btn"]',
    popover: {
      title: 'Novo Orcamento',
      description: 'Crie um orcamento manualmente ou use a IA para gerar uma proposta comercial completa em segundos.',
      side: 'bottom'
    }
  },
  {
    element: '[data-tour="orcamentos-filtros"]',
    popover: {
      title: 'Filtros e Busca',
      description: 'Filtre seus orcamentos por periodo, status ou busque por titulo e cliente. Use o filtro "Chat Pendente" para ver propostas com mensagens nao lidas.',
      side: 'bottom'
    }
  }
]
