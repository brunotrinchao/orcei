import type { TourStep } from '../types'

export const steps: TourStep[] = [
  {
    element: '[data-tour="orcamentos-novo-btn"]',
    popover: {
      title: 'Novo Orçamento',
      description: 'Crie um orçamento manualmente para gerar uma proposta comercial completa em segundos.',
      side: 'bottom'
    }
  },
  {
    element: '[data-tour="orcamentos-novo-btn-ia"]',
    popover: {
      title: 'Criar Orçamento com IA',
      description: 'Crie um orçamento usando a IA.',
      side: 'bottom'
    }
  },
  {
    element: '[data-tour="orcamentos-filtros"]',
    popover: {
      title: 'Filtros e Busca',
      description: 'Filtre seus orçamentos por período, status ou busque por título e cliente. Use o filtro "Chat Pendente" para ver propostas com mensagens não lidas.',
      side: 'bottom'
    }
  }
]
