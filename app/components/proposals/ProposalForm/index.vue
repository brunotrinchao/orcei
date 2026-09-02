<script setup lang="ts">
import { computed } from 'vue'
import type { ProposalDTO } from '../../../../types'
import { ProposalStatus } from '../../../../types/enums'
import ProposalStepClient from '../ProposalStepClient/index.vue'
import ProposalStepScope from '../ProposalStepScope/index.vue'
import ProposalStepPayment from '../ProposalStepPayment/index.vue'
import ProposalStepSummary from '../ProposalStepSummary/index.vue'
import { useProposalForm } from './index'

const props = defineProps<{
  initialData?: ProposalDTO
  prefilledItems?: any[]
  isEditing?: boolean
  isSubmitting?: boolean
}>()

const emit = defineEmits(['submit'])

const {
  currentStep,
  stepClientRef,
  stepScopeRef,
  steps,
  clientSearch,
  clients,
  pendingClients,
  catalogSearch,
  catalogItems,
  totalCatalogItems,
  selectedClientId,
  form,
  profile,
  isGenerating,
  isCreditConfirmOpen,
  confirmTitle,
  confirmDescription,
  generateDescription,
  refreshCatalog,
  itemsSubtotal,
  upsellSubtotal,
  scopeTotal,
  baseTotal,
  finalTotal,
  setPrefilledClientAndStep,
  prevStep,
  nextStep,
  submit,
  handleCreditConfirm,
  handleCreditCancel,
  Check,
  Loader2,
  ArrowRight,
  ArrowLeft,
  StepperRoot,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperTitle,
  StepperSeparator
} = useProposalForm(props, emit)

const progress = computed(() => {
  if (!steps.length) return 0
  return Math.round((currentStep.value / steps.length) * 100)
})

const currentStepInfo = computed(() => {
  return steps.find((s) => s.step === currentStep.value) || steps[0]
})

defineExpose({
  submit,
  currentStep,
  prevStep,
  nextStep,
  setPrefilledClientAndStep,
  totalSteps: steps.length,
  isEditingNonDraft: computed(() => props.isEditing && props.initialData?.status !== ProposalStatus.DRAFT),
  itemsSubtotal,
  upsellSubtotal,
  scopeTotal,
  baseTotal,
  finalTotal
})
</script>

<template>
  <div class="flex flex-col gap-6 proposal-form-container">
    <!-- Header da etapa -->
    <div class="md:hidden">
      <div class="flex items-center justify-between mb-1">
        <h2 class="text-base font-black text-gray-900 dark:text-gray-50">{{ currentStepInfo.title }}</h2>
        <span class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest shrink-0 ml-3">
          Etapa {{ currentStep }} de {{ steps.length }}
        </span>
      </div>
      <p class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ currentStepInfo.subtitle }}</p>
      <div class="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-3">
        <div
          class="h-full bg-brand rounded-full transition-all duration-300"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
    </div>

    <!-- Stepper principal (todas as resoluções) -->
    <div class="rounded-[.5rem] border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 px-4 py-3">
      <StepperRoot v-model="currentStep" class="flex w-full gap-1 sm:gap-2">
        <StepperItem
          v-for="(step, idx) in steps"
          :key="step.step"
          class="relative flex flex-1 items-center justify-center min-w-0"
          :step="step.step"
          :disabled="step.step > currentStep"
        >
          <StepperSeparator
            v-if="idx !== 0"
            class="absolute left-[calc(50%+18px)] sm:left-[calc(50%+20px)] right-[calc(50%-18px)] sm:right-[calc(50%-20px)] top-[18px] sm:top-5 h-[2px] shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 data-[state=completed]:bg-brand transition-colors"
          />

          <StepperTrigger
            as="button"
            class="flex flex-col items-center text-center gap-1.5 rounded-[.5rem] outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer"
          >
            <StepperIndicator
              :class="[
                'flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-sm font-black border-2 transition-all',
                currentStep === step.step ? 'border-brand bg-brand text-white shadow-md shadow-brand/20' :
                currentStep > step.step ? 'border-brand bg-brand text-white' : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900'
              ]"
            >
              <Check v-if="currentStep > step.step" class="w-5 h-5" />
              <span v-else>{{ step.step }}</span>
            </StepperIndicator>
            <StepperTitle
              :class="[
                'text-[9px] sm:text-xs font-black uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis max-w-full px-1',
                currentStep >= step.step ? 'text-gray-900 dark:text-gray-50' : 'text-gray-400 dark:text-gray-500'
              ]"
            >
              {{ step.title }}
            </StepperTitle>
          </StepperTrigger>
        </StepperItem>
      </StepperRoot>
    </div>

    <!-- Conteúdo -->
    <form @submit.prevent="submit(ProposalStatus.DRAFT)" class="pb-2">
      <div class="min-h-[40vh]">
        <ProposalStepClient
          ref="stepClientRef"
          v-show="currentStep === 1"
          :form="form"
          :clients="clients"
          :pending="pendingClients"
          v-model:selectedClientId="selectedClientId"
          v-model:clientSearch="clientSearch"
        />

        <ProposalStepScope
          ref="stepScopeRef"
          v-show="currentStep === 2"
          :form="form"
          :catalog-items="catalogItems"
          :total-catalog-items="totalCatalogItems"
          v-model:catalogSearch="catalogSearch"
          :is-generating="isGenerating"
          @generate-description="generateDescription"
          @catalog-updated="refreshCatalog"
        />

        <ProposalStepPayment
          v-show="currentStep === 3"
          :form="form"
          :final-total="finalTotal"
        />

        <ProposalStepSummary
          v-show="currentStep === 4"
          :form="form"
          :final-total="finalTotal"
          :clients="clients"
          :initial-expires-at="props.initialData?.expiresAt || null"
          :validity-days="profile?.defaultValidityDays || 7"
        />
      </div>
    </form>

    <ConfirmCreditDialog
      v-model:open="isCreditConfirmOpen"
      :title="confirmTitle"
      :description="confirmDescription"
      @confirm="handleCreditConfirm"
      @cancel="handleCreditCancel"
    />
  </div>
</template>

<style scoped src="./index.css"></style>