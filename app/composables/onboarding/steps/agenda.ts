import type { TourStep } from '../types'

export const steps: TourStep[] = [
  {
    element: '[data-tour="agenda-novo-evento-btn"]',
    popover: {
      title: 'Novo Compromisso',
      description: 'Crie eventos e vincule a orçamentos existentes. Ideal para agendar reuniões, entregas e visitas a clientes.',
      side: 'bottom'
    }
  },
  {
    element: '[data-tour="agenda-calendario"]',
    popover: {
      title: 'Calendário',
      description: 'Visualize todos os seus compromissos no calendário. Arraste eventos para remarcar e clique para editar detalhes.',
      side: 'top'
    }
  }
]
