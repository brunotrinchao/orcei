<script setup lang="ts">
import { ref, computed } from 'vue'
import { MapPin, RefreshCcw } from 'lucide-vue-next'

const props = defineProps<{
  address: {
    street: string
    number: string
    neighborhood: string
    city: string
    state: string
    zip: string
  }
}>()

const emit = defineEmits<{
  (e: 'update:address', val: any): void
}>()

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
</script>

<template>
  <section id="endereco" data-tour="config-endereco" class="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-200 dark:border-gray-700 shadow-sm scroll-mt-8">
    <div class="flex items-center gap-3 mb-8">
      <div class="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
        <MapPin class="w-5 h-5 text-orange-600" />
      </div>
      <h2 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Endereço Comercial</h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="space-y-3">
        <label for="address-zip" class="block text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest ml-1">CEP *</label>
        <div class="relative">
          <input
            id="address-zip"
            v-model="localAddress.zip"
            @blur="searchCEP"
            type="text"
            placeholder="00000-000"
            class="w-full px-5 py-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-gray-800 dark:text-gray-100 focus-visible:ring-2 focus-visible:ring-blue-600"
          >
          <div v-if="isSearchingCEP" class="absolute right-4 top-1/2 -translate-y-1/2">
            <RefreshCcw class="w-5 h-5 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
      <div class="md:col-span-2 space-y-3">
        <label for="address-street" class="block text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest ml-1">Rua / Logradouro *</label>
        <input
          id="address-street"
          v-model="localAddress.street"
          type="text"
          class="w-full px-5 py-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-gray-800 dark:text-gray-100 focus-visible:ring-2 focus-visible:ring-blue-600"
        >
      </div>
      <BaseInput v-model="(localAddress.number as any)" label="Número" />
      <BaseInput v-model="localAddress.neighborhood" label="Bairro *" required />
      <BaseInput v-model="localAddress.city" label="Cidade *" required />
      <BaseInput v-model="localAddress.state" label="Estado (UF) *" required />
    </div>
  </section>
</template>
