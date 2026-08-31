import { ref, type Component } from 'vue'
import { Info, CheckCircle2, AlertTriangle, AlertCircle, Sparkles } from 'lucide-vue-next'

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'violet' | string
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'

export interface ToastOptions {
  id?: string
  title?: string
  description?: string
  delay?: number
  variant?: ToastVariant
  icon?: Component | string | boolean
  position?: ToastPosition
}

export interface ToastItem extends ToastOptions {
  id: string
  title: string
  delay: number
  variant: ToastVariant
  position: ToastPosition
  createdAt: number
}

const activeToasts = ref<ToastItem[]>([])

export function useToast() {
  function show(options: ToastOptions | string): string {
    const id = options && typeof options === 'object' && options.id ? options.id : `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    
    let item: ToastItem
    if (typeof options === 'string') {
      item = {
        id,
        title: options,
        description: undefined,
        delay: 5000,
        variant: 'info',
        icon: true,
        position: 'top-right',
        createdAt: Date.now()
      }
    } else {
      item = {
        id,
        title: options.title || '',
        description: options.description,
        delay: options.delay ?? 4000,
        variant: options.variant || 'info',
        icon: options.icon ?? true,
        position: options.position || 'top-right',
        createdAt: Date.now()
      }
    }

    activeToasts.value.push(item)
    return id
  }

  function dismiss(id: string) {
    const index = activeToasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      activeToasts.value.splice(index, 1)
    }
  }

  function clear() {
    activeToasts.value = []
  }

  function success(title: string, description?: string, options?: Omit<ToastOptions, 'title' | 'description' | 'variant'>) {
    return show({ title, description, variant: 'success', ...options })
  }

  function error(title: string, description?: string, options?: Omit<ToastOptions, 'title' | 'description' | 'variant'>) {
    return show({ title, description, variant: 'danger', ...options })
  }

  function warning(title: string, description?: string, options?: Omit<ToastOptions, 'title' | 'description' | 'variant'>) {
    return show({ title, description, variant: 'warning', ...options })
  }

  function info(title: string, description?: string, options?: Omit<ToastOptions, 'title' | 'description' | 'variant'>) {
    return show({ title, description, variant: 'info', ...options })
  }

  return {
    toasts: activeToasts,
    show,
    dismiss,
    clear,
    success,
    error,
    warning,
    info
  }
}
