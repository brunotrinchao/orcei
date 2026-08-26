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
  Building2,
  UserPlus,
  BookOpen,
  ClipboardCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Palette,
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
                          class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs"
                        >
                          <component
                            :is="steps[currentStep - 1]?.icon"
                            class="w-5 h-5"
                          />
                        </div>
                        <span
                          class="text-xs font-bold text-gray-500 dark:text-gray-400"
                        >
                          Etapa {{ currentStep }} de {{ steps.length }}
                        </span>
                      </div>

                      <div class="space-y-1.5">
                        <h1
                          class="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight"
                        >
                          {{ steps[currentStep - 1]?.title }}
                        </h1>
                        <p
                          class="text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium"
                        >
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

                        <!-- Cor da Marca -->
                        <div
                          v-if="localProfile.brandConfig"
                          class="space-y-2 pt-2"
                        >
                          <label
                            class="block text-xs font-black text-slate-700 dark:text-gray-400 uppercase tracking-widest ml-1"
                          >
                            Cor Primária da Organização
                          </label>
                          <div class="flex items-center gap-3">
                            <BaseColorInput
                              v-model="localProfile.brandConfig.primaryColor"
                            />
                            <span
                              class="text-xs font-mono font-bold text-gray-500 dark:text-gray-400"
                            >
                              {{ localProfile.brandConfig.primaryColor }}
                            </span>
                          </div>
                        </div>
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

                      <!-- Step 4: Revisão dos Dados -->
                      <div v-else-if="currentStep === 4" class="space-y-6">
                        <div
                          class="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4 shadow-sm"
                        >
                          <div
                            class="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-800"
                          >
                            <Building2 class="w-5 h-5 text-blue-600" />
                            <h3
                              class="text-sm font-bold text-gray-900 dark:text-white"
                            >
                              Organização & Empresa
                            </h3>
                          </div>
                          <div
                            class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs"
                          >
                            <div>
                              <span class="text-gray-400 font-medium block"
                                >Nome do Projeto:</span
                              >
                              <strong
                                class="text-gray-900 dark:text-gray-100"
                                >{{
                                  localProfile.company?.tradeName ||
                                  "Não informado"
                                }}</strong
                              >
                            </div>
                            <div>
                              <span class="text-gray-400 font-medium block"
                                >Documento:</span
                              >
                              <strong
                                class="text-gray-900 dark:text-gray-100"
                                >{{
                                  localProfile.company?.taxId || "Não informado"
                                }}</strong
                              >
                            </div>
                          </div>
                        </div>

                        <!-- Resumo Cliente -->
                        <div
                          class="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4 shadow-sm"
                        >
                          <div
                            class="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-800"
                          >
                            <UserPlus class="w-5 h-5 text-blue-600" />
                            <h3
                              class="text-sm font-bold text-gray-900 dark:text-white"
                            >
                              Primeiro Cliente
                            </h3>
                          </div>
                          <div
                            class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs"
                          >
                            <div>
                              <span class="text-gray-400 font-medium block"
                                >Nome:</span
                              >
                              <strong
                                class="text-gray-900 dark:text-gray-100"
                                >{{
                                  clientData.name || "Não adicionado"
                                }}</strong
                              >
                            </div>
                            <div v-if="clientData.email">
                              <span class="text-gray-400 font-medium block"
                                >E-mail:</span
                              >
                              <strong
                                class="text-gray-900 dark:text-gray-100"
                                >{{ clientData.email }}</strong
                              >
                            </div>
                          </div>
                        </div>

                        <!-- Resumo Produto -->
                        <div
                          class="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4 shadow-sm"
                        >
                          <div
                            class="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-800"
                          >
                            <BookOpen class="w-5 h-5 text-blue-600" />
                            <h3
                              class="text-sm font-bold text-gray-900 dark:text-white"
                            >
                              Primeiro Item do Catálogo
                            </h3>
                          </div>
                          <div
                            class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs"
                          >
                            <div>
                              <span class="text-gray-400 font-medium block"
                                >Item:</span
                              >
                              <strong
                                class="text-gray-900 dark:text-gray-100"
                                >{{
                                  productData.name || "Não adicionado"
                                }}</strong
                              >
                            </div>
                            <div v-if="productData.price">
                              <span class="text-gray-400 font-medium block"
                                >Valor Base:</span
                              >
                              <strong class="text-gray-900 dark:text-gray-100"
                                >R$ {{ productData.price }}</strong
                              >
                            </div>
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
                  <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
                  <CheckCircle2 v-else class="w-4 h-4" />
                  {{ isSaving ? "Salvando..." : "Concluir →" }}
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
