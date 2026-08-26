import { Check, ArrowRight, Sparkles } from 'lucide-vue-next'

export function useWizardWelcomeStep() {
  const stepsPreview = [
    'Configurar a identidade do seu negócio',
    'Cadastrar o seu primeiro cliente',
    'Adicionar o primeiro produto ou serviço ao catálogo',
    'Preparar seu painel para emitir propostas'
  ]

  return {
    stepsPreview,
    Check,
    ArrowRight,
    Sparkles
  }
}
