import type { TourStep } from '../types'

export const steps: TourStep[] = [
  {
    element: '[data-tour="agenda-novo-evento-btn"]',
    popover: {
      title: 'Novo Compromisso',
      description: 'Crie eventos e vincule a orcamentos existentes. Ideal para agendar reunioes, entregas e visitas a clientes.',
      side: 'bottom'
    }
  },
  {
    element: '[data-tour="agenda-calendario"]',
    popover: {
      title: 'Calendario',
      description: 'Visualize todos os seus compromissos no calendario. Arraste eventos para remarcar e clique para editar detalhes.',
      side: 'top'
    }
  }
]
