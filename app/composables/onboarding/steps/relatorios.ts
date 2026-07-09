import type { TourStep } from '../types'

export const steps: TourStep[] = [
  {
    element: '[data-tour="relatorios-gerar-btn"]',
    popover: {
      title: 'Gerar Novo Relatório',
      description: 'Acesse o dashboard para gerar um novo relatório estratégico com IA baseado nos seus dados comerciais.',
      side: 'bottom'
    }
  },
  {
    element: '[data-tour="relatorios-lista"]',
    popover: {
      title: 'Seus Relatórios',
      description: 'Aqui ficam todos os relatórios gerados. Você pode visualizar o conteúdo completo ou baixar em PDF.',
      side: 'top'
    }
  }
]
