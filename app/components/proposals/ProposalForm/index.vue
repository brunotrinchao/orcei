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

const currentStepTitle = computed(() => {
  return steps.find((s) => s.step === currentStep.value)?.title || ''
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
  <div class="flex flex-col gap-8 proposal-form-container">
    <!-- Mobile: etapa atual + barra de progresso + contador -->
    <div class="md:hidden">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ currentStepTitle }}</span>
        <span class="text-xs font-medium text-muted shrink-0 ml-3">
          {{ currentStep }} de {{ steps.length }}
        </span>
      </div>
      <div class="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          class="h-full bg-brand rounded-full transition-all duration-300"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
    </div>

    <!-- Radix Vue Stepper (desktop) -->
    <StepperRoot v-model="currentStep" class="hidden md:flex w-full gap-2 mt-2">
      <StepperItem
        v-for="step in steps"
        :key="step.step"
        class="relative flex w-full items-center justify-center"
        :step="step.step"
        :disabled="step.step > currentStep"
      >
        <StepperSeparator
          v-if="step.step !== steps.length"
          class="absolute left-[calc(50%+20px)] right-[calc(-50%+10px)] top-5 block h-[2px] shrink-0 rounded-full bg-gray-100 dark:bg-gray-800 data-[state=completed]:bg-brand dark:data-[state=completed]:bg-brand transition-colors"
        />

        <StepperTrigger as="button" class="flex flex-col items-center text-center gap-2 rounded-[.5rem] outline-none focus-visible:ring-2 focus-visible:ring-brand">
          <StepperIndicator
            :class="[
              'flex h-10 w-10 items-center justify-center rounded-full text-sm font-black border-2 transition-all',
              currentStep === step.step ? 'border-brand bg-brand text-white' :
              currentStep > step.step ? 'border-brand bg-brand text-white' : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900'
            ]"
          >
            <Check v-if="currentStep > step.step" class="w-5 h-5" />
            <span v-else>{{ step.step }}</span>
          </StepperIndicator>
          <div class="space-y-0.5">
            <StepperTitle :class="['text-xs font-black uppercase tracking-widest', currentStep >= step.step ? 'text-gray-900 dark:text-gray-50' : 'text-gray-400 dark:text-gray-500']">
              {{ step.title }}
            </StepperTitle>
          </div>
        </StepperTrigger>
      </StepperItem>
    </StepperRoot>

    <!-- Content Area -->
    <form @submit.prevent="submit(ProposalStatus.DRAFT)" class="pb-6">
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
