import { ref, computed } from 'vue'
import { 
  DialogRoot, 
  DialogPortal, 
  DialogOverlay, 
  DialogContent, 
  DialogTitle, 
  DialogClose 
} from 'radix-vue'
import { 
  Sparkles, 
  Loader2, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  X,
  Database,
  Globe,
  PlusCircle,
  HelpCircle,
  TrendingUp,
  Bookmark
} from 'lucide-vue-next'

export function useAIProposalWizard(
  props: { open: boolean },
  emit: { (e: 'close'): void; (e: 'update:open', val: boolean): void; (e: 'success', items: any[]): void }
) {
  const step = ref<'prompt' | 'loading' | 'results'>('prompt')
  const promptText = ref('')
  const results = ref<any>(null)
  const { notify } = useAlerts()
  const { creditLabel } = useCreditCosts()
  const { 
    isCreditConfirmOpen, 
    confirmTitle, 
    confirmDescription, 
    executeWithCreditCheck, 
    handleCreditConfirm, 
    handleCreditCancel 
  } = useConfirmCreditAction()
  const config = useRuntimeConfig()
  const maxPromptLength = computed(() => Number(config.public.aiMaxProposalWizardPrompt) || 1500)

  function handleGenerateRequest() {
    if (!promptText.value) return notify('Aviso', 'Digite o que você precisa no orçamento.')
    if (promptText.value.length > maxPromptLength.value) {
      return notify('Aviso', `O texto ultrapassou o limite máximo de ${maxPromptLength.value} caracteres.`)
    }
    executeWithCreditCheck('proposalSuggest', () => generate(), {
      title: 'Gerar Orçamento com IA',
      customDescription: 'A análise e criação do orçamento por IA consumirá créditos do seu saldo. Deseja continuar?'
    })
  }

  async function generate() {
    step.value = 'loading'
    try {
      const data: any = await $fetch('/api/ai/proposal-suggest', {
        method: 'POST',
        body: { prompt: promptText.value }
      })
      
      results.value = {
        ...data,
        items: data.items.map((item: any, idx: number) => ({
          ...item,
          _uid: item._uid || `ai_item_${idx}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          isCatalog: !!item.catalogItemId,
          isSaving: false
        }))
      }
      step.value = 'results'
    } catch (e: any) {
      notify('Erro', e.data?.statusMessage || 'Erro ao processar com IA')
      step.value = 'prompt'
    }
  }

  async function saveToCatalog(item: any) {
    if (item.isCatalog) return
    item.isSaving = true
    
    try {
      const createdItem: any = await $fetch('/api/catalog', {
        method: 'POST',
        body: {
          type: 'service',
          name: item.name,
          description: item.description,
          price: item.price,
          unit: item.unit || 'UN',
          aiAssisted: true
        }
      })
      
      item.isCatalog = true
      item.catalogItemId = createdItem._id || createdItem.id
      notify('Catálogo Atualizado', `"${item.name}" foi salvo com sucesso!`)
    } catch (e) {
      notify('Erro', 'Erro ao salvar serviço no catálogo')
    } finally {
      item.isSaving = false
    }
  }

  async function handleFinish() {
    if (!results.value || !results.value.items.length) return
    
    try {
      const itemsToSave = results.value.items.filter((item: any) => !item.isCatalog)
      const itemsInCatalog = results.value.items.filter((item: any) => item.isCatalog)
      
      const savedNewItems = await Promise.all(
        itemsToSave.map((item: any) => 
          $fetch('/api/catalog', {
            method: 'POST',
            body: {
              type: 'service',
              name: item.name,
              description: item.description,
              price: item.price,
              unit: item.unit || 'UN',
              aiAssisted: true
            }
          })
        )
      )
      
      const allFinalItems = [
        ...itemsInCatalog.map((item: any) => ({ ...item, id: item.catalogItemId || item.id || item._id })),
        ...savedNewItems.map((item: any) => ({ ...item, id: item._id || item.id }))
      ]
      emit('success', allFinalItems)
      close()
    } catch (e) {
      notify('Erro', 'Erro ao processar e salvar os serviços')
    }
  }

  function close() {
    step.value = 'prompt'
    promptText.value = ''
    results.value = null
    emit('close')
    emit('update:open', false)
  }

  function removeItem(idx: number) {
    results.value.items.splice(idx, 1)
    if (results.value.items.length === 0) {
      step.value = 'prompt'
    }
  }

  return {
    step,
    promptText,
    results,
    maxPromptLength,
    creditLabel,
    isCreditConfirmOpen,
    confirmTitle,
    confirmDescription,
    handleGenerateRequest,
    saveToCatalog,
    handleFinish,
    close,
    removeItem,
    handleCreditConfirm,
    handleCreditCancel,
    DialogRoot,
    DialogPortal,
    DialogOverlay,
    DialogContent,
    DialogTitle,
    DialogClose,
    Sparkles,
    Loader2,
    Search,
    Plus,
    Trash2,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    X,
    Database,
    Globe,
    PlusCircle,
    HelpCircle,
    TrendingUp,
    Bookmark
  }
}
