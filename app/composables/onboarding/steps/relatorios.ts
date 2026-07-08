import type { TourStep } from '../types'

export const steps: TourStep[] = [
  {
    element: '[data-tour="relatorios-gerar-btn"]',
    popover: {
      title: 'Gerar Novo Relatorio',
      description: 'Acesse o dashboard para gerar um novo relatorio estrategico com IA baseado nos seus dados comerciais.',
      side: 'bottom'
    }
  },
  {
    element: '[data-tour="relatorios-lista"]',
    popover: {
      title: 'Seus Relatorios',
      description: 'Aqui ficam todos os relatorios gerados. Voce pode visualizar o conteudo completo ou baixar em PDF.',
      side: 'top'
    }
  }
]
