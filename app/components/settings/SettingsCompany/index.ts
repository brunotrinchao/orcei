import { ref, computed } from 'vue'
import { Building2, Briefcase } from 'lucide-vue-next'

export function useSettingsCompany(
  props: {
    company?: {
      taxId?: string
      legalName?: string
      tradeName?: string
      stateRegistration?: string
      municipalRegistration?: string
      titleCard?: string
    }
  },
  emit: (e: 'update:company', val: any) => void
) {
  const localCompany = computed({
    get: () => props.company || {
      taxId: '',
      legalName: '',
      tradeName: '',
      stateRegistration: '',
      municipalRegistration: '',
      titleCard: ''
    },
    set: (val) => emit('update:company', val)
  })

  const isSearchingCnpj = ref(false)

  async function handleCnpjInput() {
    const rawTax = localCompany.value.taxId || ''
    const cnpj = rawTax.replace(/\D/g, '')
    if (cnpj.length !== 14 || isSearchingCnpj.value) return

    isSearchingCnpj.value = true
    try {
      const data: any = await $fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`).catch(() => null)
      if (data) {
        localCompany.value = {
          ...localCompany.value,
          legalName: data.razao_social || localCompany.value.legalName,
          tradeName: data.nome_fantasia || data.razao_social || localCompany.value.tradeName
        }
      }
    } catch {
      // Ignore network errors
    } finally {
      isSearchingCnpj.value = false
    }
  }

  return {
    localCompany,
    isSearchingCnpj,
    handleCnpjInput,
    Building2,
    Briefcase
  }
}
