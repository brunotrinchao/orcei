import { Sparkles, Loader2, CheckCircle2 } from 'lucide-vue-next'

export interface ProcessingStepState {
  progress: number
  statusText: string
  isComplete: boolean
}

export function useWizardProcessingStep() {
  return {
    Sparkles,
    Loader2,
    CheckCircle2
  }
}
