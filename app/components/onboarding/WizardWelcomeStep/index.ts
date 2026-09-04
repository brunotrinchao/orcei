import { Check, ArrowRight, Sparkles } from 'lucide-vue-next'

export function useWizardWelcomeStep() {
  const stepsPreview = [
    'Configurar a identidade do seu negócio',
    'Cadastrar o seu primeiro cliente',
    'Adicionar o primeiro produto ou serviço ao catálogo',
    'Conectar Google Drive e Calendar (PDFs e agenda)'
  ]

  return {
    stepsPreview,
    Check,
    ArrowRight,
    Sparkles
  }
}
