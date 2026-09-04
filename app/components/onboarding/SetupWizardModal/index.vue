<script setup lang="ts">
import WizardWelcomeStep from "../WizardWelcomeStep/index.vue";
import WizardStepHeader from "../WizardStepHeader/index.vue";
import WizardClientStep from "../WizardClientStep/index.vue";
import WizardProductStep from "../WizardProductStep/index.vue";
import WizardProcessingStep from "../WizardProcessingStep/index.vue";
import { useSetupWizardModal } from "./index";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const {
  isWelcome,
  currentStep,
  totalSteps,
  isSaving,
  isProcessing,
  processingProgress,
  processingStatusText,
  isProcessingComplete,
  slideDirection,
  userName,
  localProfile,
  clientData,
  productData,
  steps,
  startWizard,
  nextStep,
  prevStep,
  goToStep,
  handleFinish,
  GOOGLE_CALENDAR_SCOPE,
  GOOGLE_DRIVE_SCOPE,
  isConnecting,
  hasGoogleScope,
  handleConnect,
  Building2,
  UserPlus,
  BookOpen,
  ClipboardCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Palette,
  Plug,
  Calendar,
  HardDrive,
} = useSetupWizardModal(props, emit);
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[100] bg-slate-50 dark:bg-gray-950 flex flex-col justify-between overflow-hidden h-screen h-[100dvh] setup-wizard-container"
      >
        <Transition name="wizard-phase" mode="out-in">
          <!-- 0. Tela de Processamento / Carregamento Final -->
          <div
            v-if="isProcessing"
            key="processing"
            class="flex-1 min-h-0 overflow-y-auto flex items-center justify-center p-4"
          >
            <WizardProcessingStep
              :progress="processingProgress"
              :status-text="processingStatusText"
              :is-complete="isProcessingComplete"
            />
          </div>

          <!-- 1. Tela de Boas-Vindas Inicial -->
          <div
            v-else-if="isWelcome"
            key="welcome"
            class="flex-1 min-h-0 overflow-y-auto flex items-center justify-center p-4"
          >
            <WizardWelcomeStep :user-name="userName" @start="startWizard" />
          </div>

          <!-- 2. Tela de Etapas do Wizard -->
          <div
            v-else
            key="steps"
            class="flex-1 min-h-0 flex flex-col justify-between overflow-hidden relative"
          >
            <!-- Barra Superior de Etapas -->
            <WizardStepHeader
              :steps="steps"
              :current-step="currentStep"
              @select-step="goToStep"
              class="shrink-0"
            />

            <!-- Área Central de Conteúdo -->
            <main
              class="flex-1 min-h-0 overflow-y-auto px-4 md:px-12 py-6 md:py-10 pb-28 md:pb-12"
            >
              <div class="max-w-2xl mx-auto space-y-8">
                <Transition
                  mode="out-in"
                  :name="
                    slideDirection === 'forward'
                      ? 'wizard-slide-next'
                      : 'wizard-slide-prev'
                  "
                >
                  <div :key="currentStep" class="space-y-8">
                    <!-- Cabeçalho da Etapa -->
                    <div class="space-y-4">
                      <div class="flex items-center gap-3">
                        <div
                          class="w-10 h-10 rounded-[.5rem] bg-brand-soft dark:bg-blue-950/60 text-brand dark:text-blue-400 flex items-center justify-center"
                        >
                          <component
                            :is="steps[currentStep - 1]?.icon"
                            class="w-5 h-5"
                          />
                        </div>
                        <span class="text-xs font-medium text-muted">
                          Etapa {{ currentStep }} de {{ steps.length }}
                        </span>
                      </div>

                      <div class="space-y-1.5">
                        <h1
                          class="text-2xl md:text-3xl font-bold text-ink dark:text-white tracking-tight"
                        >
                          {{ steps[currentStep - 1]?.title }}
                        </h1>
                        <p class="text-sm md:text-base text-muted">
                          {{ steps[currentStep - 1]?.subtitle }}
                        </p>
                      </div>
                    </div>

                    <!-- Formulário da Etapa -->
                    <div class="pt-2">
                      <!-- Step 1: Negócio / Organização -->
                      <div
                        v-if="currentStep === 1 && localProfile"
                        class="space-y-6"
                      >
                        <BaseInput
                          v-if="localProfile.company"
                          v-model="localProfile.company.tradeName"
                          label="Nome da organização"
                          placeholder="Ex: João Silva's Organization"
                          :required="true"
                        />

                        <BaseInput
                          v-if="localProfile.company"
                          v-model="localProfile.company.taxId"
                          label="CNPJ ou CPF da organização"
                          mask="document"
                          placeholder="00.000.000/0000-00"
                        />

                        <BaseInput
                          v-if="localProfile.company"
                          v-model="localProfile.company.legalName"
                          label="Razão Social"
                          placeholder="Ex: João Silva Serviços LTDA"
                        />
                      </div>

                      <!-- Step 2: Cadastrar Primeiro Cliente -->
                      <WizardClientStep
                        v-else-if="currentStep === 2"
                        v-model="clientData"
                      />

                      <!-- Step 3: Cadastrar Primeiro Produto/Serviço -->
                      <WizardProductStep
                        v-else-if="currentStep === 3"
                        v-model="productData"
                      />

                      <!-- Step 4: Integrações -->
                      <div v-else-if="currentStep === 4" class="space-y-5">
                        <div class="rounded-[.5rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                          <!-- Drive -->
                          <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-5">
                            <div class="w-10 h-10 rounded-[.5rem] bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                              <HardDrive class="w-5 h-5" />
                            </div>
                            <div class="flex-1 min-w-0">
                              <div class="flex items-center gap-2 flex-wrap">
                                <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-50">Google Drive</h3>
                              </div>
                              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Salva os PDFs dos orçamentos automaticamente.</p>
                            </div>
                            <BaseBadge v-if="hasGoogleScope(GOOGLE_DRIVE_SCOPE)" variant="success" light class="shrink-0">Conectado</BaseBadge>
                            <BaseButton v-else type="button" variant="outline" size="sm" class="shrink-0" @click="handleConnect('drive')">
                              Conectar
                            </BaseButton>
                          </div>
                          <div class="h-px bg-gray-100 dark:bg-gray-800" />
                          <!-- Calendar -->
                          <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-5">
                            <div class="w-10 h-10 rounded-[.5rem] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                              <Calendar class="w-5 h-5" />
                            </div>
                            <div class="flex-1 min-w-0">
                              <div class="flex items-center gap-2 flex-wrap">
                                <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-50">Google Calendar</h3>
                              </div>
                              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Sincroniza as execuções dos orçamentos aceitos na agenda.</p>
                            </div>
                            <BaseBadge v-if="hasGoogleScope(GOOGLE_CALENDAR_SCOPE)" variant="success" light class="shrink-0">Conectado</BaseBadge>
                            <BaseButton v-else type="button" variant="outline" size="sm" class="shrink-0" @click="handleConnect('calendar')">
                              Conectar
                            </BaseButton>
                          </div>
                        </div>
                        <p class="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5 px-1">
                          <Plug class="w-3.5 h-3.5" />
                          Você pode conectar novamente depois em Configurações → Integrações.
                        </p>
                      </div>

                      <!-- Step 5: Revisão dos Dados -->
                      <div v-else-if="currentStep === 5" class="space-y-5">
                        <div
                          class="rounded-[.5rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
                        >
                          <!-- Organização & Empresa -->
                          <div class="p-5 sm:p-6">
                            <div class="flex items-center gap-2.5 mb-4">
                              <span class="w-8 h-8 rounded-[.5rem] bg-brand-soft dark:bg-blue-950/60 text-brand dark:text-blue-400 flex items-center justify-center shrink-0">
                                <Building2 class="w-4 h-4" />
                              </span>
                              <h3 class="text-sm font-bold text-gray-900 dark:text-white">Organização & Empresa</h3>
                              <CheckCircle2 v-if="localProfile.company?.tradeName" class="w-4 h-4 ml-auto text-emerald-500 shrink-0" />
                            </div>
                            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                              <div>
                                <dt class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nome do Projeto</dt>
                                <dd class="mt-1 font-semibold text-gray-900 dark:text-gray-100 truncate">{{ localProfile.company?.tradeName || "Não informado" }}</dd>
                              </div>
                              <div>
                                <dt class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Documento</dt>
                                <dd class="mt-1 font-semibold text-gray-900 dark:text-gray-100 truncate">{{ localProfile.company?.taxId || "Não informado" }}</dd>
                              </div>
                            </dl>
                          </div>
                          <div class="h-px bg-gray-100 dark:bg-gray-800" />

                          <!-- Primeiro Cliente -->
                          <div class="p-5 sm:p-6">
                            <div class="flex items-center gap-2.5 mb-4">
                              <span class="w-8 h-8 rounded-[.5rem] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <UserPlus class="w-4 h-4" />
                              </span>
                              <h3 class="text-sm font-bold text-gray-900 dark:text-white">Primeiro Cliente</h3>
                              <CheckCircle2 v-if="clientData.name" class="w-4 h-4 ml-auto text-emerald-500 shrink-0" />
                            </div>
                            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                              <div>
                                <dt class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nome</dt>
                                <dd class="mt-1 font-semibold text-gray-900 dark:text-gray-100 truncate">{{ clientData.name || "Não adicionado" }}</dd>
                              </div>
                              <div v-if="clientData.email">
                                <dt class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">E-mail</dt>
                                <dd class="mt-1 font-semibold text-gray-900 dark:text-gray-100 truncate">{{ clientData.email }}</dd>
                              </div>
                              <div v-if="!clientData.name" class="sm:col-span-2">
                                <p class="text-xs text-gray-400 dark:text-gray-500 italic">Você pode adicionar clientes depois em Clientes.</p>
                              </div>
                            </dl>
                          </div>
                          <div class="h-px bg-gray-100 dark:bg-gray-800" />

                        <!-- Primeiro Item do Catálogo -->
                          <div class="p-5 sm:p-6">
                            <div class="flex items-center gap-2.5 mb-4">
                              <span class="w-8 h-8 rounded-[.5rem] bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                                <BookOpen class="w-4 h-4" />
                              </span>
                              <h3 class="text-sm font-bold text-gray-900 dark:text-white">Primeiro Item do Catálogo</h3>
                              <CheckCircle2 v-if="productData.name" class="w-4 h-4 ml-auto text-emerald-500 shrink-0" />
                            </div>
                            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                              <div>
                                <dt class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Item</dt>
                                <dd class="mt-1 font-semibold text-gray-900 dark:text-gray-100 truncate">{{ productData.name || "Não adicionado" }}</dd>
                              </div>
                              <div v-if="productData.price">
                                <dt class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valor Base</dt>
                                <dd class="mt-1 font-semibold text-gray-900 dark:text-gray-100">R$ {{ productData.price }}</dd>
                              </div>
                            </dl>
                          </div>
                          <div class="h-px bg-gray-100 dark:bg-gray-800" />

                          <!-- Integrações -->
                          <div class="p-5 sm:p-6">
                            <div class="flex items-center gap-2.5 mb-4">
                              <span class="w-8 h-8 rounded-[.5rem] bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <Plug class="w-4 h-4" />
                              </span>
                              <h3 class="text-sm font-bold text-gray-900 dark:text-white">Integrações</h3>
                              <CheckCircle2 v-if="hasGoogleScope(GOOGLE_DRIVE_SCOPE)" class="w-4 h-4 ml-auto text-emerald-500 shrink-0" />
                            </div>
                            <div class="space-y-2">
                              <div class="flex items-center justify-between gap-3 rounded-[.5rem] border border-gray-100 dark:border-gray-800 px-4 py-3">
                                <span class="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                  <HardDrive class="w-4 h-4 text-blue-500 shrink-0" /> Google Drive
                                </span>
                                <BaseBadge v-if="hasGoogleScope(GOOGLE_DRIVE_SCOPE)" variant="success" light>Conectado</BaseBadge>
                                <BaseBadge v-else variant="error" light>Não conectado</BaseBadge>
                              </div>
                              <div class="flex items-center justify-between gap-3 rounded-[.5rem] border border-gray-100 dark:border-gray-800 px-4 py-3">
                                <span class="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                  <Calendar class="w-4 h-4 text-indigo-500 shrink-0" /> Google Calendar
                                </span>
                                <BaseBadge v-if="hasGoogleScope(GOOGLE_CALENDAR_SCOPE)" variant="success" light>Conectado</BaseBadge>
                                <BaseBadge v-else variant="error" light>Não conectado</BaseBadge>
                              </div>
                            </div>
                            <p v-if="!hasGoogleScope(GOOGLE_DRIVE_SCOPE)" class="mt-3 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                              <CheckCircle2 class="w-3.5 h-3.5 shrink-0" />
                              Conecte o Google Drive na etapa anterior para salvar os PDFs dos orçamentos.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>
            </main>

            <!-- Barra de Rodapé Fixa no Rodapé -->
            <footer
              class="w-full bg-white dark:bg-gray-900 border-t border-gray-200/80 dark:border-gray-800/80 px-4 md:px-12 py-3.5 md:py-4 flex items-center justify-between shadow-2xl shrink-0 z-30 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))]"
            >
              <div>
                <BaseButton
                  variant="ghost"
                  type="button"
                  @click="prevStep"
                >
                  <ArrowLeft class="w-4 h-4 mr-1" />
                  Voltar
                </BaseButton>
              </div>

              <div class="flex items-center gap-3">
                <BaseButton
                  variant="primary"
                  v-if="currentStep < totalSteps"
                  type="button"
                  @click="nextStep"
                >
                  Próximo
                  <ArrowRight class="w-4 h-4" />
                </BaseButton>

                <BaseButton
                  v-else
                  type="button"
                  variant="primary"
                  :disabled="isSaving"
                  @click="handleFinish"
                >
                  <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin mr-2" />
                  <CheckCircle2 v-else class="w-4 h-4 mr-2" />
                  {{ isSaving ? "Salvando..." : "Concluir" }}
                </BaseButton>
              </div>
            </footer>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped src="./index.css"></style>
