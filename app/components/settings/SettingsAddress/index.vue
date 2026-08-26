<script setup lang="ts">
import { useSettingsAddress } from './index'

const props = defineProps<{
  address: {
    zip?: string
    street?: string
    number?: string
    complement?: string
    neighborhood?: string
    city?: string
    state?: string
  }
}>()

const emit = defineEmits<{
  (e: 'update:address', val: any): void
}>()

const { localAddress, isSearchingCep, handleCepInput, MapPin } = useSettingsAddress(props, emit)
</script>

<template>
  <BaseSectionCard id="endereco" data-tour="config-endereco" title="Endereço Comercial" :icon="MapPin" icon-bg-class="bg-blue-50 dark:bg-blue-950/50" icon-color-class="text-blue-600 dark:text-blue-400">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 settings-address-container">
      <BaseInput
        v-model="localAddress.zip"
        label="CEP"
        mask="cep"
        placeholder="00000-000"
        :loading="isSearchingCep"
        @input="handleCepInput"
      />

      <BaseInput
        v-model="localAddress.street"
        label="Logradouro / Rua"
        placeholder="Ex: Av. Paulista"
        class="md:col-span-2"
      />

      <BaseInput
        v-model="localAddress.number"
        label="Número"
        placeholder="Ex: 1000"
      />

      <BaseInput
        v-model="localAddress.complement"
        label="Complemento"
        placeholder="Ex: Sala 42"
      />

      <BaseInput
        v-model="localAddress.neighborhood"
        label="Bairro"
        placeholder="Ex: Bela Vista"
      />

      <BaseInput
        v-model="localAddress.city"
        label="Cidade"
        placeholder="Ex: São Paulo"
        class="md:col-span-2"
      />

      <BaseInput
        v-model="localAddress.state"
        label="Estado (UF)"
        placeholder="Ex: SP"
      />
    </div>
  </BaseSectionCard>
</template>

<style scoped src="./index.css"></style>
