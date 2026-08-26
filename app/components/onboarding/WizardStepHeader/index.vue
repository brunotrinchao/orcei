<script setup lang="ts">
import { useWizardStepHeader, type StepItem } from './index'

defineProps<{
  steps: StepItem[]
  currentStep: number
}>()

const emit = defineEmits<{
  (e: 'select-step', stepId: number): void
}>()

const { Check } = useWizardStepHeader()
</script>

<template>
  <header class="w-full bg-white dark:bg-gray-950 border-b border-gray-200/80 dark:border-gray-800 shrink-0">
    <div class="max-w-5xl mx-auto px-4 md:px-8">
      <nav class="flex items-center justify-center gap-8 md:gap-16 overflow-x-auto scrollbar-hide">
        <div 
          v-for="step in steps" 
          :key="step.id"
          class="flex flex-col items-center py-4 relative shrink-0 cursor-pointer group select-none"
          @click="step.id < currentStep ? emit('select-step', step.id) : null"
        >
          <div class="flex items-center gap-2.5 px-2">
            <!-- Step Circle Number -->
            <div 
              :class="[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300',
                currentStep > step.id
                  ? 'bg-emerald-500 text-white'
                  : currentStep === step.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
              ]"
            >
              <Check v-if="currentStep > step.id" class="w-4 h-4 stroke-[3]" />
              <span v-else>{{ step.id }}</span>
            </div>

            <!-- Step Label -->
            <span 
              :class="[
                'text-xs md:text-sm font-bold transition-colors whitespace-nowrap',
                currentStep === step.id
                  ? 'text-gray-900 dark:text-white font-extrabold'
                  : currentStep > step.id
                    ? 'text-gray-700 dark:text-gray-300 group-hover:text-blue-600'
                    : 'text-gray-400 dark:text-gray-500'
              ]"
            >
              {{ step.label }}
            </span>
          </div>

          <!-- Active Indicator Bar -->
          <div 
            class="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full transition-all duration-300"
            :class="currentStep === step.id ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'"
          ></div>
        </div>
      </nav>
    </div>
  </header>
</template>

<style scoped src="./index.css"></style>
