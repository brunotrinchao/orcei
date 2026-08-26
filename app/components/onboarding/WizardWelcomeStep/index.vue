<script setup lang="ts">
import { useWizardWelcomeStep } from './index'

defineProps<{
  userName?: string
}>()

const emit = defineEmits<{
  (e: 'start'): void
  (e: 'skip'): void
}>()

const { stepsPreview, Check, ArrowRight, Sparkles } = useWizardWelcomeStep()
</script>

<template>
  <div class="flex flex-col items-center justify-center text-center px-4 py-8 md:py-12 max-w-lg mx-auto space-y-8 animate-fade-in">
    <!-- Ícone / Logo do App com Elevação e Glow -->
    <div class="relative group mb-3">
      <div class="absolute -inset-1 "></div>
      <div class="relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
        <AppLogo size="lg" :loading="false" :icon-only="false" />
      </div>
    </div>

    <!-- Título & Subtítulo -->
    <div class="space-y-3">
      <h1 class="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
        Bem-vindo<template v-if="userName">, {{ userName }}</template>!
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 font-medium max-w-md mx-auto leading-relaxed">
        Vamos dar a sua cara para o sistema!<br/>
        <span class="text-xs">Vamos configurar o essencial para o seu negócio começar a rodar. Se quiser mudar algo mais tarde, é só ajustar nas configurações. Vamos lá?</span>
      </p>
    </div>

    <!-- Card de Passos Previsão -->
    <div class="w-full bg-slate-50/80 dark:bg-gray-900/60 p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 text-left space-y-4 shadow-sm wizard-welcome-preview">
      <p class="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 flex items-center gap-2">
        <Sparkles class="w-4 h-4 text-blue-600 dark:text-blue-400" />
        Em poucos passos, vamos:
      </p>

      <ul class="space-y-3">
        <li 
          v-for="(item, idx) in stepsPreview" 
          :key="idx"
          class="flex items-start gap-3 text-xs font-semibold text-gray-650 dark:text-gray-300"
        >
          <div class="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-200 dark:border-blue-800/40">
            <Check class="w-2.5 h-2.5 stroke-[3]" />
          </div>
          <span>{{ item }}</span>
        </li>
      </ul>
    </div>

    <!-- Ações de Rodapé -->
    <div class="w-full pt-2">
       <BaseButton 
          type="button" 
          variant="primary" 
          @click.prevent="emit('start')"
        >
         Começar
          <ArrowRight class="w-4 h-4" />
        </BaseButton>
    </div>
  </div>
</template>

<style scoped src="./index.css"></style>
