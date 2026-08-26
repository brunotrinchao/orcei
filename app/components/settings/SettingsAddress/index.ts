import { ref, computed } from 'vue'
import { MapPin, RefreshCcw } from 'lucide-vue-next'

export function useSettingsAddress(
  props: { address: { street: string; number: string; neighborhood: string; city: string; state: string; zip: string } },
  emit: (e: 'update:address', val: any) => void
) {
  const localAddress = computed({
    get: () => props.address,
    set: (val) => emit('update:address', val)
  })

  const isSearchingCEP = ref(false)

  async function searchCEP() {
    const cep = localAddress.value.zip?.replace(/\D/g, '')
    if (!cep || cep.length !== 8) return
    isSearchingCEP.value = true
    try {
      const data: any = await $fetch(`https://viacep.com.br/ws/${cep}/json/`)
      if (!data.erro) {
        localAddress.value.street = data.logradouro
        localAddress.value.neighborhood = data.bairro
        localAddress.value.city = data.localidade
        localAddress.value.state = data.uf
      }
    } catch (e) {
      console.error('Erro ao buscar CEP:', e)
    } finally {
      isSearchingCEP.value = false
    }
  }

  return {
    localAddress,
    isSearchingCEP,
    searchCEP,
    MapPin,
    RefreshCcw
  }
}
