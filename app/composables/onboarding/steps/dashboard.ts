import type { TourStep } from '../types'

export const steps: TourStep[] = [
  {
    element: '[data-tour="dashboard-period-filter"]',
    popover: {
      title: 'Filtro de Período',
      description: 'Selecione o período que deseja analisar: últimos 7, 30, 90 dias ou o ano inteiro. Todos os dados do painel se atualizam automaticamente.',
      side: 'bottom'
    }
  },
  {
    element: '[data-tour="dashboard-revenue-chart"]',
    popover: {
      title: 'Evolução do Faturamento',
      description: 'Acompanhe visualmente como seu faturamento evolui ao longo do tempo. O gráfico se ajusta ao período selecionado acima.',
      side: 'top'
    }
  },
  {
    element: '[data-tour="dashboard-ai-report"]',
    popover: {
      title: 'Relatório Estratégico com IA',
      description: 'Gere uma análise estratégica completa dos seus dados comerciais usando inteligência artificial. Consome 1 crédito por relatório.',
      side: 'left'
    }
  }
]
