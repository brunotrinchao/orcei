<script setup lang="ts">
import { useConfiguracoesPage } from '~/composables/pages/useConfiguracoesPage'
import SettingsVisual from '../../components/settings/SettingsVisual/index.vue'
import SettingsCompany from '../../components/settings/SettingsCompany/index.vue'
import SettingsAddress from '../../components/settings/SettingsAddress/index.vue'
import SettingsContact from '../../components/settings/SettingsContact/index.vue'
import SettingsTemplates from '../../components/settings/SettingsTemplates/index.vue'
import SettingsBulkImport from '../../components/settings/SettingsBulkImport/index.vue'
import SettingsIntegrations from '../../components/settings/SettingsIntegrations/index.vue'
import SettingsBusinessRules from '../../components/settings/SettingsBusinessRules/index.vue'
import SettingsPrivacy from '../../components/settings/SettingsPrivacy/index.vue'

const {
  profile,
  refresh,
  openSetupWizard,
  integrationGoogleDriveCalendarStatus,
  localProfile,
  isSaving,
  GOOGLE_CALENDAR_SCOPE,
  GOOGLE_DRIVE_SCOPE,
  hasGoogleScope,
  isDisconnecting,
  isConnecting,
  handleConnect,
  disconnectGoogle,
  updateProfile,
  sections,
  isExporting,
  isDeleting,
  exportData,
  isResetting,
  resetData,
  deleteAccount,
  activeSection,
  activeSectionData,
  selectSection,
} = useConfiguracoesPage()
</script>

<template>
  <div class="space-y-6 relative">
    <div v-if="localProfile">

      <!-- Mobile nav pills (acima do conteúdo para telas pequenas) -->
      <div class="lg:hidden flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        <button v-for="s in sections" :key="s.id" @click="selectSection(s.id)"
          :class="activeSection === s.id ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'"
          class="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-[0.75rem] text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer">
          <component :is="s.icon" class="w-3 h-3" />
          {{ s.label }}
        </button>
      </div>

      <!-- Callout com Descrição da Seção Ativa -->
      <BaseCallout :key="'callout-' + activeSection" variant="info" 
        :description="activeSectionData.description" :icon="activeSectionData.icon" class="mb-6" />

      <!-- Container da Seção Ativa com Transição Suave -->
      <div class="w-full">
        <Transition mode="out-in" enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 translate-y-2" enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in" leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2">
          <div :key="activeSection">
            <!-- Identidade Visual -->
            <SettingsVisual v-if="activeSection === 'visual' && localProfile.brandConfig"
              v-model:logoUrl="localProfile.brandConfig.logoUrl"
              v-model:primaryColor="localProfile.brandConfig.primaryColor" :isSaving="isSaving" @save="updateProfile" />

            <!-- Dados da Empresa -->
            <SettingsCompany v-else-if="activeSection === 'empresa'" v-model:company="localProfile.company"
              :isSaving="isSaving" @save="updateProfile" />

            <!-- Endereço -->
            <SettingsAddress v-else-if="activeSection === 'endereco'" v-model:address="localProfile.address"
              :isSaving="isSaving" @save="updateProfile" />

            <!-- Contato -->
            <SettingsContact v-else-if="activeSection === 'contato'" v-model:contact="localProfile.contact"
              :isSaving="isSaving" @save="updateProfile" />

            <!-- Integrações -->
            <SettingsIntegrations v-else-if="activeSection === 'integracoes'" :hasGoogleScope="hasGoogleScope"
              :googleCalendarScope="GOOGLE_CALENDAR_SCOPE" :googleDriveScope="GOOGLE_DRIVE_SCOPE"
              :isConnecting="isConnecting" :isDisconnecting="isDisconnecting" :isSaving="isSaving"
              @connect="handleConnect" @disconnect="disconnectGoogle" @openWizard="openSetupWizard"
              @save="updateProfile" />

            <!-- Regras de Negócio -->
            <SettingsBusinessRules v-else-if="activeSection === 'negocio'" v-model:profile="localProfile"
              :isSaving="isSaving" @save="updateProfile" />

            <!-- Modelos Legais -->
            <SettingsTemplates v-else-if="activeSection === 'modelos'"
              v-model:contractTemplate="localProfile.defaultContractTemplate"
              v-model:termsAndConditions="localProfile.defaultTermsAndConditions" :isSaving="isSaving"
              @save="updateProfile" />

            <!-- Privacidade e Dados -->
            <SettingsPrivacy v-else-if="activeSection === 'privacidade'" :isExporting="isExporting"
              :isResetting="isResetting" :isDeleting="isDeleting" :isSaving="isSaving" @export="exportData"
              @reset="resetData" @delete="deleteAccount" @save="updateProfile" />

            <!-- Múltiplos Cadastros -->
            <SettingsBulkImport v-else-if="activeSection === 'multiplos-cadastros'" />
          </div>
        </Transition>
      </div>

    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
