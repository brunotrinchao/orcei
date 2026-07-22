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
  <BaseSectionCard id="endereco" data-tour="config-endereco" title="Endereço Comercial" :icon="MapPin" icon-bg-class="bg-orange-50 dark:bg-orange-950/50" icon-color-class="text-orange-600 dark:text-orange-400">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <BaseInput
        v-model="localAddress.zip"
        label="CEP *"
        mask="cep"
        placeholder="00000-000"
        :loading="isSearchingCEP"
        @blur="searchCEP"
      />
      <div class="md:col-span-2">
        <BaseInput
          v-model="localAddress.street"
          label="Rua / Logradouro *"
          required
        />
      </div>
      <BaseInput v-model="(localAddress.number as any)" label="Número" />
      <BaseInput v-model="localAddress.neighborhood" label="Bairro *" required />
      <BaseInput v-model="localAddress.city" label="Cidade *" required />
      <BaseInput v-model="localAddress.state" label="Estado (UF) *" required />
    </div>
  </BaseSectionCard>
</template>
