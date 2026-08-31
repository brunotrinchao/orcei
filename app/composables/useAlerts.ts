import { useToast, type ToastVariant } from './useToast'

interface AlertOptions {
  title: string
  description?: string
  actionText?: string
  cancelText?: string
  variant?: 'primary' | 'destructive'
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
}

export interface NotifyOptions {
  isBackground?: boolean
  variant?: ToastVariant
  delay?: number
}

export const useAlerts = () => {
  const isOpen = useState('alert-open', () => false)
  const options = useState<AlertOptions>('alert-options', () => ({
    title: '',
    description: ''
  }))

  const showAlert = (opt: AlertOptions) => {
    options.value = {
      variant: 'primary',
      actionText: 'Confirmar',
      cancelText: 'Cancelar',
      ...opt
    }
    isOpen.value = true
  }

  // Helper para notificações via Toast (substitui o modal dialog simples para notificação)
  const notify = (title: string, description?: string, opts?: NotifyOptions | boolean) => {
    const { show } = useToast()

    let isBackground = false
    let customVariant: ToastVariant | undefined = undefined
    let delay = 4000

    if (typeof opts === 'boolean') {
      isBackground = opts
    } else if (opts && typeof opts === 'object') {
      isBackground = !!opts.isBackground
      customVariant = opts.variant
      if (opts.delay) delay = opts.delay
    }

    // Se for uma requisição em segundo plano, a variante DEVE ser obrigatoriamente 'info'
    if (isBackground) {
      show({
        title,
        description,
        variant: 'info',
        delay
      })
      return
    }

    // Se forneceu variante customizada, utiliza-a
    if (customVariant) {
      show({
        title,
        description,
        variant: customVariant,
        delay
      })
      return
    }

    // Determina a variante automaticamente com base na ação de submit/salvar
    const lowerTitle = (title || '').toLowerCase()
    let variant: ToastVariant = 'info'

    if (
      lowerTitle.includes('sucesso') ||
      lowerTitle.includes('salv') ||
      lowerTitle.includes('cadastr') ||
      lowerTitle.includes('conclu') ||
      lowerTitle.includes('criad') ||
      lowerTitle.includes('atualiz') ||
      lowerTitle.includes('enviad') ||
      lowerTitle.includes('copiad')
    ) {
      variant = 'success'
    } else if (
      lowerTitle.includes('erro') ||
      lowerTitle.includes('falha') ||
      lowerTitle.includes('inval') ||
      lowerTitle.includes('recus') ||
      lowerTitle.includes('exclu') ||
      lowerTitle.includes('delet')
    ) {
      variant = 'danger'
    } else if (
      lowerTitle.includes('aviso') ||
      lowerTitle.includes('atencao') ||
      lowerTitle.includes('atenção') ||
      lowerTitle.includes('limite')
    ) {
      variant = 'warning'
    } else {
      variant = 'info'
    }

    show({
      title,
      description,
      variant,
      delay
    })
  }

  // Helper para confirmações modais (substitui confirm())
  const confirm = (opt: AlertOptions) => {
    showAlert({
      cancelText: 'Cancelar',
      ...opt
    })
  }

  return {
    isOpen,
    options,
    showAlert,
    notify,
    confirm
  }
}
