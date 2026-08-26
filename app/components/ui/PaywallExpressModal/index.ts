import { ref, computed, watch } from 'vue'
import { Sparkles, Zap, ShieldCheck, CheckCircle2, Loader2, CreditCard, Banknote, ArrowRight } from 'lucide-vue-next'

export function usePaywallExpressModal(
  props: { open: boolean; reason?: string },
  emits: (e: 'update:open', val: boolean) => void
) {
  const isOpen = computed({
    get: () => props.open,
    set: (val) => emits('update:open', val)
  })

  const isLoading = ref<string | null>(null)
  const { notify } = useAlerts()

  const { packages: allPackages } = useCreditPackages()

  const discountByBadge: Record<string, string> = {
    'Popular para Iniciantes': '52%',
    'Melhor Valor': '62%',
    'Uso Comercial Elevado': '75%'
  }

  const packages = computed(() =>
    allPackages.value
      .filter(p => p.credits >= 10)
      .map(p => ({
        ...p,
        discount: discountByBadge[p.badge] || '0%'
      }))
  )

  const selectedPack = ref<string | null>(null)
  const activePack = computed(() => {
    if (selectedPack.value) {
      return packages.value.find(p => p.id === selectedPack.value) || packages.value[1]
    }
    return packages.value.find(p => p.highlight) || packages.value[1] || packages.value[0]
  })

  watch(isOpen, (val) => {
    if (val && !selectedPack.value && packages.value.length > 0) {
      selectedPack.value = (packages.value.find(p => p.highlight) || packages.value[1] || packages.value[0]).id
    }
  })

  async function handleCheckout() {
    if (!activePack.value?.id) return
    isLoading.value = activePack.value.id
    try {
      const { url } = await $fetch<any>('/api/stripe/checkout', {
        method: 'POST',
        body: { tier: activePack.value.id, type: 'credits' }
      })
      if (url) window.location.href = url
    } catch (e: any) {
      notify('Erro', e.data?.statusMessage || 'Erro ao iniciar checkout')
    } finally {
      isLoading.value = null
    }
  }

  return {
    isOpen,
    isLoading,
    packages,
    selectedPack,
    activePack,
    handleCheckout,
    Sparkles,
    Zap,
    ShieldCheck,
    CheckCircle2,
    Loader2,
    CreditCard,
    Banknote,
    ArrowRight
  }
}
