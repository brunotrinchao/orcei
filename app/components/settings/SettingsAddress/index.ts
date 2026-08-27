import { ref, computed, watch } from 'vue'
import { MapPin, RefreshCcw } from 'lucide-vue-next'

export function useSettingsAddress(
  props: {
    address: {
      street?: string
      number?: string
      neighborhood?: string
      city?: string
      state?: string
      zip?: string
      complement?: string
    }
  },
  emit: (e: 'update:address', val: any) => void
) {
  const localAddress = computed({
    get: () => props.address || {},
    set: (val) => emit('update:address', val)
  })

  const isSearchingCep = ref(false)

  async function searchCEP() {
    const rawZip = localAddress.value.zip || ''
    const cep = rawZip.replace(/\D/g, '')
    if (!cep || cep.length !== 8) return

    isSearchingCep.value = true
    try {
      const data: any = await $fetch(`/api/cep/${cep}`)
      if (data) {
        localAddress.value = {
          ...localAddress.value,
          street: data.street || '',
          neighborhood: data.neighborhood || '',
          city: data.city || '',
          state: data.state || ''
        }
      }
    } catch (e) {
      console.error('Erro ao buscar CEP:', e)
    } finally {
      isSearchingCep.value = false
    }
  }

  function handleCepInput(val?: any) {
    const zipVal = typeof val === 'string' ? val : localAddress.value.zip || ''
    const cep = zipVal.replace(/\D/g, '')
    if (cep.length === 8 && !isSearchingCep.value) {
      searchCEP()
    }
  }

  watch(
    () => localAddress.value.zip,
    (newZip) => {
      if (newZip) {
        const cep = newZip.replace(/\D/g, '')
        if (cep.length === 8 && !isSearchingCep.value) {
          searchCEP()
        }
      }
    }
  )

  return {
    localAddress,
    isSearchingCep,
    searchCEP,
    handleCepInput,
    MapPin,
    RefreshCcw
  }
}
