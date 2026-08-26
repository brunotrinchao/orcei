import { Check } from 'lucide-vue-next'

export interface StepItem {
  id: number
  label: string
  title: string
  subtitle: string
  icon?: any
}

export function useWizardStepHeader() {
  return {
    Check
  }
}
