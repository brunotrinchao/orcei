interface AlertOptions {
  title: string
  description?: string
  actionText?: string
  cancelText?: string
  variant?: 'primary' | 'destructive'
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
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

  // Helper para alertas simples (substitui alert())
  const notify = (title: string, description?: string) => {
    showAlert({ 
      title, 
      description, 
      actionText: 'OK', 
      cancelText: '' // Remove cancel button for simple notification
    })
  }

  // Helper para confirmações (substitui confirm())
  const confirm = (opt: AlertOptions) => {
    showAlert(opt)
  }

  return {
    isOpen,
    options,
    showAlert,
    notify,
    confirm
  }
}
