import type { TourId, TourStep } from './types'

const loaders: Record<TourId, () => Promise<{ steps: TourStep[] }>> = {
  dashboard: () => import('./steps/dashboard'),
  clientes: () => import('./steps/clientes'),
  catalogo: () => import('./steps/catalogo'),
  orcamentos: () => import('./steps/orcamentos'),
  relatorios: () => import('./steps/relatorios'),
  configuracoes: () => import('./steps/configuracoes'),
  agenda: () => import('./steps/agenda')
}

export async function loadTourSteps(tourId: TourId): Promise<TourStep[]> {
  const mod = await loaders[tourId]()
  return mod.steps
}
