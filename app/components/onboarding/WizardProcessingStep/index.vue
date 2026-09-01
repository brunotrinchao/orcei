<script setup lang="ts">
import { useWizardProcessingStep } from './index'

defineProps<{
  progress: number
  statusText: string
  isComplete: boolean
}>()

const { Sparkles, Loader2, CheckCircle2 } = useWizardProcessingStep()
</script>

<template>
  <div class="flex flex-col items-center justify-center text-center px-6 py-12 max-w-lg mx-auto space-y-8 animate-fade-in processing-step-container">
    <!-- Ícone Central Animado -->
    <div class="relative group">
      <div class="w-20 h-20 md:w-24 md:h-24 rounded-[.5rem] bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-lg border border-blue-200/50 dark:border-blue-900/40">
        <CheckCircle2 v-if="isComplete" class="w-10 h-10 md:w-12 md:h-12 text-emerald-500 animate-bounce" />
        <Sparkles v-else class="w-10 h-10 md:w-12 md:h-12 animate-pulse text-blue-600 dark:text-blue-400" />
      </div>
    </div>

    <!-- Título & Subtítulo dinâmicos -->
    <div class="space-y-3">
      <h1 class="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
        {{ isComplete ? 'Seu espaço está pronto' : 'Estamos preparando seu espaço' }}
      </h1>
      <p class="text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium max-w-md mx-auto leading-relaxed">
        {{ isComplete ? 'Tudo pronto! Levaremos você ao painel em instantes.' : 'Aplicamos o plano inicial, as permissões e a configuração padrão do template.' }}
      </p>
    </div>

    <!-- Progress Bar e Status -->
    <div class="w-full max-w-md space-y-3">
      <div class="w-full bg-gray-200/80 dark:bg-gray-800/80 h-2.5 rounded-full overflow-hidden p-0.5">
        <div 
          class="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out shadow-xs"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>

      <div class="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 px-1">
        <span class="flex items-center gap-2">
          <CheckCircle2 v-if="isComplete" class="w-3.5 h-3.5 text-emerald-500" />
          <Loader2 v-else class="w-3.5 h-3.5 animate-spin text-blue-600" />
          {{ statusText }}
        </span>
        <span class="font-mono font-black text-gray-700 dark:text-gray-300">{{ progress }}%</span>
      </div>
    </div>

    <!-- Nota de rodapé -->
    <p class="text-xs text-gray-400 dark:text-gray-500 font-medium max-w-xs mx-auto pt-4 leading-relaxed">
      Você pode manter esta página aberta. Assim que terminarmos, levaremos você ao painel.
    </p>
  </div>
</template>

<style scoped src="./index.css"></style>
