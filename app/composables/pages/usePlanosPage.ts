import { ref, computed, onMounted } from 'vue'
import { 
  Zap, CheckCircle2, Loader2, ArrowRight, Download, 
  ShieldAlert, ShieldCheck, Award, MessageSquare, AlertCircle, ShoppingBag, Coins,
  Sparkles, FileText, UserPlus, Wand2, BookOpen, ReceiptText, ChevronRight, Info
} from 'lucide-vue-next'
import type { ProfileDTO } from '~/types'

export function usePlanosPage() {
  const { data: profile, refresh: refreshProfile, pending: pendingProfile } = useLazyFetch<ProfileDTO>('/api/profile', { key: 'profile' })
  const { notify } = useAlerts()
  const { getCost } = useCreditCosts()

  function costText(action: string): string {
    const cost = getCost(action)
    return cost === 0 ? 'Grátis' : `${cost} ${cost === 1 ? 'crédito' : 'créditos'}`
  }

  const isLoading = ref<string | null>(null)
  const isCostTableModalOpen = ref(false)

  const { packages, refresh: refreshPackages, pending: pendingPackages } = useCreditPackages()

  const couponCode = ref('')
  const couponLoading = ref(false)
  const couponError = ref('')

  async function redeemCoupon() {
    couponError.value = ''
    couponLoading.value = true
    try {
      const res: any = await $fetch('/api/stripe/coupon/redeem', { method: 'POST', body: { code: couponCode.value } })
      notify('Sucesso', `${res.creditsAdded} créditos adicionados! Novo saldo: ${res.newBalance}`)
      couponCode.value = ''
      refreshProfile()
    } catch (e: any) {
      couponError.value = e.data?.statusMessage || 'Erro ao validar cupom'
    } finally {
      couponLoading.value = false
    }
  }

  async function handleAction(tier: string) {
    isLoading.value = tier
    try {
      const { url } = await $fetch<any>('/api/stripe/checkout', {
        method: 'POST',
        body: { tier, type: 'credits' }
      })
      if (url) window.location.href = url
    } catch (e: any) {
      notify('Erro', e.data?.statusMessage || 'Erro ao iniciar checkout')
    } finally {
      isLoading.value = null
    }
  }

  const route = useRoute()
  const success = computed(() => route.query.success === 'true')
  const canceled = computed(() => route.query.canceled === 'true')

  const { data: history, refresh: refreshInvoices, pending: pendingHistory } = useLazyFetch<any[]>('/api/stripe/invoices')

  const actionCostsList = computed(() => [
    {
      key: 'proposalSend',
      name: 'Envio de Proposta Comercial',
      description: 'Notificação por e-mail e disponibilização de link público rastreável com notificações em tempo real',
      icon: FileText,
      badge: 'Comercial',
      badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-100 dark:border-blue-900/40'
    },
    {
      key: 'proposalSuggest',
      name: 'Assistente de Orçamentos IA',
      description: 'Criação assistida de propostas comerciais completas e personalizadas a partir de texto livre',
      icon: Sparkles,
      badge: 'Inteligência Artificial',
      badgeColor: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-violet-100 dark:border-violet-900/40'
    },
    {
      key: 'clientExtract',
      name: 'Extração de Leads / Clientes',
      description: 'Identificação e cadastro automático de dados de contatos a partir de mensagens brutas de clientes',
      icon: UserPlus,
      badge: 'Inteligência Artificial',
      badgeColor: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-violet-100 dark:border-violet-900/40'
    },
    {
      key: 'generate',
      name: 'Gerador de Descrições de Itens',
      description: 'Redação profissional de escopos e descrições técnicas detalhadas para produtos ou serviços',
      icon: Wand2,
      badge: 'Inteligência Artificial',
      badgeColor: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-violet-100 dark:border-violet-900/40'
    },
    {
      key: 'catalogSuggest',
      name: 'Sugestão para Catálogo por IA',
      description: 'Enriquecimento de itens e sugestão inteligente de precificação para seu catálogo de serviços',
      icon: BookOpen,
      badge: 'Inteligência Artificial',
      badgeColor: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-violet-100 dark:border-violet-900/40'
    },
    {
      key: 'analyzeReport',
      name: 'Relatório Estratégico de IA',
      description: 'Análise avançada de métricas do funil comercial, projeções de receita e recomendações acionáveis',
      icon: ReceiptText,
      badge: 'Análise Estratégica',
      badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40'
    }
  ])

  onMounted(() => {
    refreshProfile()
    refreshPackages()
    refreshInvoices()

    if (import.meta.client && (success.value || canceled.value)) {
      setTimeout(() => {
        navigateTo('/planos', { replace: true })
      }, 5000)
    }
  })

  return {
    profile,
    refreshProfile,
    pendingProfile,
    getCost,
    costText,
    isLoading,
    isCostTableModalOpen,
    packages,
    refreshPackages,
    pendingPackages,
    couponCode,
    couponLoading,
    couponError,
    redeemCoupon,
    handleAction,
    success,
    canceled,
    history,
    refreshInvoices,
    pendingHistory,
    actionCostsList,
    Zap,
    CheckCircle2,
    Loader2,
    ArrowRight,
    Download,
    ShieldAlert,
    ShieldCheck,
    Award,
    MessageSquare,
    AlertCircle,
    ShoppingBag,
    Coins,
    Sparkles,
    FileText,
    UserPlus,
    Wand2,
    BookOpen,
    ReceiptText,
    ChevronRight,
    Info,
  }
}
