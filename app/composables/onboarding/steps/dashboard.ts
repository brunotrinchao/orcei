import type { TourStep } from '../types'

export const steps: TourStep[] = [
  {
    element: '[data-tour="dashboard-period-filter"]',
    popover: {
      title: 'Filtro de Periodo',
      description: 'Selecione o periodo que deseja analisar: ultimos 7, 30, 90 dias ou o ano inteiro. Todos os dados do painel se atualizam automaticamente.',
      side: 'bottom'
    }
  },
  {
    element: '[data-tour="dashboard-revenue-chart"]',
    popover: {
      title: 'Evolucao do Faturamento',
      description: 'Acompanhe visualmente como seu faturamento evolui ao longo do tempo. O grafico se ajusta ao periodo selecionado acima.',
      side: 'top'
    }
  },
  {
    element: '[data-tour="dashboard-ai-report"]',
    popover: {
      title: 'Relatorio Estrategico com IA',
      description: 'Gere uma analise estrategica completa dos seus dados comerciais usando inteligencia artificial. Consome 1 credito por relatorio.',
      side: 'left'
    }
  }
]
