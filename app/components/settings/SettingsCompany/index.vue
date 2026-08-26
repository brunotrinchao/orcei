<script setup lang="ts">
import { useSettingsCompany } from './index'

const props = defineProps<{
  company: {
    taxId?: string
    legalName?: string
    tradeName?: string
    stateRegistration?: string
    municipalRegistration?: string
    titleCard?: string
  }
}>()

const emit = defineEmits<{
  (e: 'update:company', val: any): void
}>()

const { localCompany, isSearchingCnpj, handleCnpjInput, Building2 } = useSettingsCompany(props, emit)
</script>

<template>
  <BaseSectionCard id="empresa" data-tour="config-empresa" title="Dados da Empresa" :icon="Building2" icon-bg-class="bg-blue-50 dark:bg-blue-950/50" icon-color-class="text-blue-600 dark:text-blue-400">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 settings-company-container">
      <BaseInput
        v-model="localCompany.titleCard"
        label="Título do Perfil"
        placeholder="Ex: Minha Empresa / Meu Perfil"
        class="md:col-span-2"
      />

      <BaseInput
        v-model="localCompany.taxId"
        label="CNPJ / CPF"
        mask="document"
        placeholder="00.000.000/0000-00"
        :loading="isSearchingCnpj"
        @input="handleCnpjInput"
      />

      <BaseInput
        v-model="localCompany.tradeName"
        label="Nome Fantasia"
        placeholder="Ex: Orcei Fácil"
      />

      <BaseInput
        v-model="localCompany.legalName"
        label="Razão Social"
        placeholder="Ex: Orcei Tecnologia LTDA"
      />

      <BaseInput
        v-model="localCompany.stateRegistration"
        label="Inscrição Estadual"
        placeholder="Isento ou nº"
      />

      <BaseInput
        v-model="localCompany.municipalRegistration"
        label="Inscrição Municipal"
        placeholder="Nº da inscrição"
      />
    </div>
  </BaseSectionCard>
</template>

<style scoped src="./index.css"></style>
