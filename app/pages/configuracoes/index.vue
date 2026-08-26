<script setup lang="ts">
import { useConfiguracoesPage } from '~/composables/pages/useConfiguracoesPage'
import SettingsVisual from '../../components/settings/SettingsVisual/index.vue'
import SettingsCompany from '../../components/settings/SettingsCompany/index.vue'
import SettingsAddress from '../../components/settings/SettingsAddress/index.vue'
import SettingsContact from '../../components/settings/SettingsContact/index.vue'
import SettingsTemplates from '../../components/settings/SettingsTemplates/index.vue'
import SettingsBulkImport from '../../components/settings/SettingsBulkImport/index.vue'

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
  selectSection,
  SwatchBook,
  MapPin,
  Briefcase,
  FileText,
  Phone,
  RefreshCcw,
  Shield,
  Globe,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Wand2,
  Upload,
} = useConfiguracoesPage()
</script>

<template>
  <div class="space-y-10 relative">
    <PageHeader title="Configurações" subtitle="Personalize sua identidade corporativa e regras de negócio." />

    <div v-if="localProfile">

      <!-- Mobile nav pills (acima do conteúdo) -->
      <div class="lg:hidden flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        <button
          v-for="s in sections"
          :key="s.id"
          @click="selectSection(s.id)"
          :class="activeSection === s.id ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'"
          class="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-[0.75rem] text-[10px] font-black uppercase tracking-widest transition-all"
        >
          <component :is="s.icon" class="w-3 h-3" />
          {{ s.label }}
        </button>
      </div>

      <!-- Layout desktop: sidebar + conteúdo -->
      <div class="flex gap-8 items-start">

        <!-- Sidebar (desktop only) -->
        <aside class="hidden lg:flex flex-col gap-1 w-44 shrink-0 sticky top-24">
          <button
            v-for="s in sections"
            :key="s.id"
            @click="selectSection(s.id)"
            :class="activeSection === s.id
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100'"
            class="flex items-center gap-2.5 px-4 py-3 rounded-[0.75rem] text-xs font-black uppercase tracking-widest transition-all text-left"
          >
            <component :is="s.icon" class="w-4 h-4 shrink-0" />
            {{ s.label }}
          </button>
          <div class="pt-4 mt-2 border-t border-gray-100 dark:border-gray-800">
            <BaseButton type="button" size="sm" :disabled="isSaving" :loading="isSaving" @click="updateProfile" class="w-full">
              {{ isSaving ? 'Salvando...' : 'Salvar' }}
            </BaseButton>
          </div>
        </aside>

        <!-- Container da Seção Ativa com Transição Suave -->
        <div class="flex-1 min-w-0">
          <Transition
            mode="out-in"
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-2"
          >
            <div :key="activeSection">
              <!-- Identidade Visual -->
              <SettingsVisual
                v-if="activeSection === 'visual'"
                v-model:logoUrl="localProfile.brandConfig.logoUrl"
                v-model:primaryColor="localProfile.brandConfig.primaryColor"
              />

              <!-- Dados da Empresa -->
              <SettingsCompany
                v-else-if="activeSection === 'empresa'"
                v-model:company="localProfile.company"
              />

              <!-- Endereço -->
              <SettingsAddress
                v-else-if="activeSection === 'endereco'"
                v-model:address="localProfile.address"
              />

              <!-- Contato -->
              <SettingsContact
                v-else-if="activeSection === 'contato'"
                v-model:contact="localProfile.contact"
              />

              <!-- Integrações -->
              <BaseSectionCard 
                v-else-if="activeSection === 'integracoes'" 
                id="integracoes" 
                data-tour="config-integracoes" 
                title="Integrações Automáticas" 
                :icon="Globe" 
                icon-bg-class="bg-sky-50 dark:bg-sky-950/50" 
                icon-color-class="text-sky-600 dark:text-sky-400"
              >
                <div class="space-y-6">

                  <!-- Banner de Segurança e Privacidade -->
                  <div class="p-5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-[0.75rem] border border-emerald-200/60 dark:border-emerald-900/40 flex items-start gap-4">
                    <div class="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-[0.75rem] flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5">
                      <ShieldCheck class="w-6 h-6" />
                    </div>
                    <div class="space-y-1">
                      <h4 class="text-xs font-black text-emerald-950 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-2">
                        <span>Conexão Segura e Homologada pelo Google</span>
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-200/50 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[9px] font-bold rounded-full normal-case">
                          <Lock class="w-2.5 h-2.5" /> 100% Protegido
                        </span>
                      </h4>
                      <p class="text-xs text-emerald-800/80 dark:text-emerald-300/80 font-medium leading-relaxed">
                        Suas integrações são configuradas separadamente do login, respeitando sua privacidade. Utilizamos <strong>escopos restritos</strong> pré-aprovados pelo Google. O aplicativo interage exclusivamente com os arquivos e eventos que ele mesmo cria — <strong>sua privacidade e dados pessoais estão 100% protegidos.</strong>
                      </p>
                    </div>
                  </div>

                  <!-- Refazer configuração inicial -->
                  <div class="p-5 bg-gray-50/50 dark:bg-gray-950/50 rounded-[0.75rem] border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 bg-white dark:bg-gray-900 rounded-[0.75rem] shadow-sm flex items-center justify-center shrink-0 border border-gray-100 dark:border-gray-800 text-sky-600 dark:text-sky-400">
                        <Wand2 class="w-5 h-5" />
                      </div>
                      <div>
                        <h3 class="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest">Assistente de Configuração Inicial</h3>
                        <p class="text-xs text-gray-500 dark:text-gray-400 font-bold mt-0.5">Refaça o passo a passo de empresa, endereço, contatos, marca e integrações.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-[10px] font-black uppercase tracking-widest rounded-[0.75rem] border border-gray-200 dark:border-gray-700 hover:border-sky-400 hover:text-sky-600 transition-all"
                      @click="openSetupWizard"
                    >
                      Refazer configuração inicial
                    </button>
                  </div>

                  <!-- Card 1: Google Calendar -->
                  <div class="p-6 bg-gray-50/50 dark:bg-gray-950/50 rounded-[0.75rem] border border-gray-100 dark:border-gray-800 space-y-4">
                    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-white dark:bg-gray-900 rounded-[0.75rem] shadow-sm flex items-center justify-center shrink-0 border border-gray-100 dark:border-gray-800">
                          <img src="https://www.gstatic.com/images/branding/product/2x/calendar_2020q4_48dp.png" class="w-8 h-8 object-contain" alt="Google Calendar" loading="lazy">
                        </div>
                        <div>
                          <h3 class="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest flex items-center gap-2">
                            Google Calendar
                          </h3>
                          <p class="text-xs text-gray-500 dark:text-gray-400 font-bold mt-0.5">Agendamento automático de execuções de orçamentos.</p>
                        </div>
                      </div>
                      <div class="shrink-0 flex items-center gap-2">
                        <span v-if="hasGoogleScope(GOOGLE_CALENDAR_SCOPE)" class="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-200/50 dark:border-green-900/50">
                          <CheckCircle2 class="w-3 h-3 text-green-600 dark:text-green-400" /> Ativo
                        </span>
                        <BaseButton
                          v-if="!hasGoogleScope(GOOGLE_CALENDAR_SCOPE)"
                          variant="outline"
                          size="sm"
                          class="text-[10px]"
                          :loading="isConnecting"
                          @click="handleConnect('calendar')"
                        >
                          Conectar com Google
                        </BaseButton>
                        <BaseButton
                          v-else
                          variant="ghost"
                          size="sm"
                          class="text-[10px] text-red-400 hover:text-red-600"
                          :loading="isDisconnecting"
                          @click="disconnectGoogle"
                        >
                          Desconectar
                        </BaseButton>
                      </div>
                    </div>

                    <div class="pt-3 border-t border-gray-100 dark:border-gray-900 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div class="p-3 bg-white dark:bg-gray-900 rounded-[0.75rem] border border-gray-100 dark:border-gray-800/80">
                        <span class="font-black text-gray-700 dark:text-gray-300 block mb-1">🎯 Como é utilizado:</span>
                        <p class="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                          Ao criar ou aceitar um orçamento que possua data de execução definida, o compromisso é adicionado na sua agenda com os dados do cliente e valor.
                        </p>
                      </div>
                      <div class="p-3 bg-white dark:bg-gray-900 rounded-[0.75rem] border border-gray-100 dark:border-gray-800/80">
                        <span class="font-black text-gray-700 dark:text-gray-300 block mb-1">🛡️ Garantia de Privacidade:</span>
                        <p class="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                          Não lemos, não alteramos e não temos acesso aos seus eventos e compromissos pessoais. Apenas inserimos as execuções dos orçamentos do app.
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Card 2: Google Drive -->
                  <div class="p-6 bg-gray-50/50 dark:bg-gray-950/50 rounded-[0.75rem] border border-gray-100 dark:border-gray-800 space-y-4">
                    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-white dark:bg-gray-900 rounded-[0.75rem] shadow-sm flex items-center justify-center shrink-0 border border-gray-100 dark:border-gray-800">
                          <img src="https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png" class="w-8 h-8 object-contain" alt="Google Drive" loading="lazy">
                        </div>
                        <div>
                          <h3 class="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest flex items-center gap-2">
                            Google Drive
                          </h3>
                          <p class="text-xs text-gray-500 dark:text-gray-400 font-bold mt-0.5">Arquivamento automático dos PDFs dos seus orçamentos.</p>
                        </div>
                      </div>
                      <div class="shrink-0 flex items-center gap-2">
                        <span v-if="hasGoogleScope(GOOGLE_DRIVE_SCOPE)" class="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-200/50 dark:border-green-900/50">
                          <CheckCircle2 class="w-3 h-3 text-green-600 dark:text-green-400" /> Ativo
                        </span>
                        <BaseButton
                          v-if="!hasGoogleScope(GOOGLE_DRIVE_SCOPE)"
                          variant="outline"
                          size="sm"
                          class="text-[10px]"
                          :loading="isConnecting"
                          @click="handleConnect('drive')"
                        >
                          Conectar com Google
                        </BaseButton>
                        <BaseButton
                          v-else
                          variant="ghost"
                          size="sm"
                          class="text-[10px] text-red-400 hover:text-red-600"
                          :loading="isDisconnecting"
                          @click="disconnectGoogle"
                        >
                          Desconectar
                        </BaseButton>
                      </div>
                    </div>

                    <div class="pt-3 border-t border-gray-100 dark:border-gray-900 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div class="p-3 bg-white dark:bg-gray-900 rounded-[0.75rem] border border-gray-100 dark:border-gray-800/80">
                        <span class="font-black text-gray-700 dark:text-gray-300 block mb-1">📁 Como é utilizado:</span>
                        <p class="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                          Salva automaticamente uma cópia em PDF dos orçamentos aceitos na estrutura de pastas <code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px] text-blue-600 dark:text-blue-400 font-mono">Orcei Fácil / Propostas / Nome do Cliente</code>.
                        </p>
                      </div>
                      <div class="p-3 bg-white dark:bg-gray-900 rounded-[0.75rem] border border-gray-100 dark:border-gray-800/80">
                        <span class="font-black text-gray-700 dark:text-gray-300 block mb-1">🔒 Escopo Restrito de Segurança:</span>
                        <p class="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                          O aplicativo utiliza a permissão <code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">drive.file</code>. Isso garante que o app <strong>só consegue ver e acessar os arquivos criados por ele próprio</strong>. Nenhum outro arquivo do seu Google Drive pode ser visto ou acessado.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </BaseSectionCard>

              <!-- Regras de Negócio -->
              <BaseSectionCard 
                v-else-if="activeSection === 'negocio'" 
                id="negocio" 
                data-tour="config-regras-negocio" 
                title="Regras de Negócio" 
                :icon="Briefcase" 
                icon-bg-class="bg-emerald-50 dark:bg-emerald-950/50" 
                icon-color-class="text-emerald-600 dark:text-emerald-400"
              >
                <div class="space-y-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <BaseInput
                      v-model.number="localProfile.defaultValidityDays"
                      label="Validade Padrão"
                      type="number"
                      suffix="dias"
                    />
                    <BaseInput
                      v-model.number="localProfile.defaultCashDiscount"
                      label="Desconto (À Vista)"
                      type="number"
                      suffix="%"
                    />
                  </div>

                  <!-- Opção de Aceitar Cartão de Crédito -->
                  <div class="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 space-y-4">
                    <div class="flex items-center justify-between">
                      <div>
                        <label class="text-xs font-bold text-gray-900 dark:text-white block">Aceitar Cartão de Crédito</label>
                        <p class="text-[11px] text-gray-500">Habilita a opção de pagamento via cartão de crédito por padrão em novas propostas</p>
                      </div>
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" v-model="localProfile.defaultAcceptCreditCard" class="sr-only peer">
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    <div v-if="localProfile.defaultAcceptCreditCard" class="pt-3 border-t border-gray-200 dark:border-gray-800 max-w-xs">
                      <BaseInput
                        v-model.number="localProfile.defaultInstallments"
                        label="Parcelamento Máximo (Cartão)"
                        type="number"
                        suffix="x"
                      />
                    </div>
                  </div>
                </div>
              </BaseSectionCard>

              <!-- Modelos Legais -->
              <SettingsTemplates
                v-else-if="activeSection === 'modelos'"
                v-model:contractTemplate="localProfile.defaultContractTemplate"
                v-model:termsAndConditions="localProfile.defaultTermsAndConditions"
              />

              <!-- Privacidade e Dados -->
              <BaseSectionCard 
                v-else-if="activeSection === 'privacidade'" 
                id="privacidade" 
                data-tour="config-privacidade" 
                title="Privacidade e Dados" 
                :icon="Shield" 
                icon-bg-class="bg-red-50 dark:bg-red-950/50" 
                icon-color-class="text-red-600 dark:text-red-400"
              >
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div class="p-8 bg-gray-50/50 dark:bg-gray-950/50 rounded-[0.75rem] border border-gray-100 dark:border-gray-800 space-y-4">
                    <h3 class="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest">Backup Completo</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                      Exporte todos os seus dados cadastrados (Clientes, Catálogo, Orçamentos e Agenda) em formato JSON. O arquivo será enviado para o seu e-mail.
                    </p>
                    <BaseButton 
                      variant="secondary" 
                      size="sm" 
                      class="w-full sm:w-auto" 
                      :disabled="isExporting" 
                      :loading="isExporting"
                      @click="exportData"
                    >
                      {{ isExporting ? 'Processando...' : 'Exportar Meus Dados' }}
                    </BaseButton>
                  </div>

                  <div class="p-8 bg-orange-50/30 dark:bg-orange-950/20 rounded-[0.75rem] border border-orange-100 dark:border-orange-900/30 space-y-4">
                    <h3 class="text-sm font-black text-orange-900 dark:text-orange-300 uppercase tracking-widest">Resetar Dados</h3>
                    <p class="text-sm text-orange-700/70 dark:text-orange-400/80 font-medium leading-relaxed">
                      Apaga Clientes, Catálogo, Orçamentos e Relatórios. Sua conta, plano e créditos permanecem intactos. Ação irreversível.
                    </p>
                    <BaseButton
                      variant="outline"
                      size="sm"
                      class="w-full sm:w-auto text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/50 hover:bg-orange-50 dark:hover:bg-orange-950/40"
                      :disabled="isResetting"
                      :loading="isResetting"
                      @click="resetData"
                    >
                      {{ isResetting ? 'Resetando...' : 'Resetar Dados' }}
                    </BaseButton>
                  </div>

                  <div class="p-8 bg-red-50/30 dark:bg-red-950/20 rounded-[0.75rem] border border-red-100 dark:border-red-900/30 space-y-4">
                    <h3 class="text-sm font-black text-red-900 dark:text-red-300 uppercase tracking-widest">Encerrar Conta</h3>
                    <p class="text-sm text-red-700/70 dark:text-red-400/80 font-medium leading-relaxed">
                      Ao excluir sua conta, todos os seus dados serão apagados permanentemente. Esta ação não pode ser desfeita.
                    </p>
                    <BaseButton 
                      variant="outline" 
                      size="sm" 
                      class="w-full sm:w-auto text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40" 
                      :disabled="isDeleting" 
                      :loading="isDeleting"
                      @click="deleteAccount"
                    >
                      {{ isDeleting ? 'Excluindo...' : 'Excluir Minha Conta' }}
                    </BaseButton>
                  </div>
                </div>
              </BaseSectionCard>

              <!-- Múltiplos Cadastros -->
              <SettingsBulkImport
                v-else-if="activeSection === 'multiplos-cadastros'"
              />
            </div>
          </Transition>
        </div> <!-- end sections -->
      </div> <!-- end desktop flex -->

      <!-- Salvar (mobile) -->
      <div class="lg:hidden pt-6">
        <BaseButton type="button" :disabled="isSaving" :loading="isSaving" @click="updateProfile" class="w-full">
          {{ isSaving ? 'Salvando...' : 'Salvar Configurações' }}
        </BaseButton>
      </div>

    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
