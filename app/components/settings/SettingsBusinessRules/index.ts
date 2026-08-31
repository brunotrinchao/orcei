import { Briefcase } from 'lucide-vue-next'
import { computed } from 'vue'

export function useSettingsBusinessRules(
  props: {
    profile?: {
      defaultValidityDays?: number
      defaultCashDiscount?: number
      defaultAcceptCreditCard?: boolean
      defaultInstallments?: number
    }
  },
  emit: (e: 'update:profile', val: any) => void
) {
  const localProfile = computed({
    get: () => props.profile || {},
    set: (val) => emit('update:profile', val)
  })

  return {
    localProfile,
    Briefcase
  }
}
