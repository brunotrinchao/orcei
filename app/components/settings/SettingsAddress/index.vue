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
  isSaving?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:address', val: any): void
  (e: 'save'): void
}>()

const { localAddress, isSearchingCep, handleCepInput, MapPin } = useSettingsAddress(props, emit)
</script>

<template>
  <BaseCard title="Endereço Comercial" data-tour="config-endereco">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 settings-address-container">
      <BaseInput
        v-model="localAddress.zip"
        label="CEP"
        mask="cep"
        placeholder="00000-000"
        :loading="isSearchingCep"
        @update:model-value="handleCepInput"
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
     <template #footer>
      <BaseButton type="button" size="md" class="shrink-0" :disabled="isSaving" :loading="isSaving" @click="emit('save')">
        {{ isSaving ? 'Salvando...' : 'Salvar' }}
      </BaseButton>
    </template>
  </BaseCard>
</template>

<style scoped src="./index.css"></style>
