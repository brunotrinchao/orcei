import { Package, Layers, DollarSign, FileText, CheckCircle2 } from 'lucide-vue-next'

export interface WizardProductData {
  type: 'service' | 'product'
  name: string
  price: number | string
  unit: string
  description: string
}

export function useWizardProductStep() {
  const typeOptions = [
    { label: 'Serviço', value: 'service' },
    { label: 'Produto', value: 'product' }
  ]

  const unitOptions = [
    { label: 'Unidade (UN)', value: 'UN' },
    { label: 'Hora (H)', value: 'H' },
    { label: 'Dia (DIA)', value: 'DIA' },
    { label: 'Mês (MES)', value: 'MES' },
    { label: 'Projeto (PROJ)', value: 'PROJ' }
  ]

  return {
    typeOptions,
    unitOptions,
    Package,
    Layers,
    DollarSign,
    FileText,
    CheckCircle2
  }
}
