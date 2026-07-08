export const TOUR_IDS = ['dashboard', 'clientes', 'catalogo', 'orcamentos', 'relatorios', 'configuracoes', 'agenda'] as const

export type TourId = typeof TOUR_IDS[number]

export interface TourStep {
  element: string
  popover: {
    title: string
    description: string
    side?: 'top' | 'bottom' | 'left' | 'right'
  }
}

export const ROUTE_TOUR_MAP: Record<string, TourId> = {
  '/dashboard': 'dashboard',
  '/clientes': 'clientes',
  '/catalogo': 'catalogo',
  '/orcamentos': 'orcamentos',
  '/relatorios': 'relatorios',
  '/configuracoes': 'configuracoes',
  '/agenda': 'agenda'
}
