<script setup lang="ts">
import { useSettingsIntegrations } from './index'

const props = defineProps<{
  hasGoogleScope: (scope: string) => boolean
  googleCalendarScope: string
  googleDriveScope: string
  isConnecting?: boolean
  isDisconnecting?: boolean
  isSaving?: boolean
}>()

const emit = defineEmits<{
  (e: 'connect', target: 'calendar' | 'drive'): void
  (e: 'disconnect'): void
  (e: 'openWizard'): void
  (e: 'save'): void
}>()

const { ShieldCheck, CheckCircle2, Globe, Target, HardDriveDownload, KeyRound } = useSettingsIntegrations()
</script>

<template>
  <BaseCard
    id="integracoes"
    data-tour="config-integracoes"
    title="Integrações Automáticas"
    :icon="Globe"
    icon-bg-class="bg-sky-50 dark:bg-sky-950/50"
    icon-color-class="text-sky-600 dark:text-sky-400"
  >
    <div class="space-y-6 settings-integrations-container">
      <!-- Segurança — benefício claro p/ confiança -->
      <div class="p-4 rounded-[.5rem] border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/30 flex items-start gap-3">
        <div class="w-8 h-8 rounded-[.5rem] bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
          <ShieldCheck class="w-4 h-4" />
        </div>
        <p class="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
          O Orcei Fácil acessa <strong>apenas os arquivos e eventos que ele mesmo cria</strong>. Seu Google pessoal permanece 100% privado.
        </p>
      </div>

      <!-- Google Calendar -->
      <div data-tour="config-integ-calendar" class="rounded-[.5rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 p-5">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-[.5rem] bg-white dark:bg-gray-900 border border-line dark:border-gray-800 flex items-center justify-center shrink-0">
              <img src="https://www.gstatic.com/images/branding/product/2x/calendar_2020q4_48dp.png" class="w-7 h-7 object-contain" alt="Google Calendar" loading="lazy">
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-50">Google Calendar</h3>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">Opcional</span>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Agenda a execução de orçamentos aceitos automaticamente.</p>
            </div>
          </div>
          <div class="sm:ml-auto shrink-0 flex items-center gap-2">
            <BaseBadge v-if="hasGoogleScope(googleCalendarScope)" variant="success" light>
              <CheckCircle2 class="w-3.5 h-3.5 mr-1" /> Ativo
            </BaseBadge>
            <BaseButton
              v-if="!hasGoogleScope(googleCalendarScope)"
              variant="outline"
              size="sm"
              :loading="isConnecting"
              @click="emit('connect', 'calendar')"
            >
              Conectar com Google
            </BaseButton>
            <BaseButton
              v-else
              variant="ghost"
              size="sm"
              class="text-red-400 hover:text-red-600"
              :loading="isDisconnecting"
              @click="emit('disconnect')"
            >
              Desconectar
            </BaseButton>
          </div>
        </div>

        <div class="h-px bg-gray-100 dark:bg-gray-800" />

        <div class="grid grid-cols-1 md:grid-cols-2">
          <div class="p-4">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <Target class="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> Como funciona
            </span>
            <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Orçamento aceito com data de execução vira um compromisso na sua agenda, com cliente e valor.</p>
          </div>
          <div class="p-4 md:border-l border-gray-100 dark:border-gray-800">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <ShieldCheck class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Privacidade
            </span>
            <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Seus eventos pessoais não são lidos nem alterados — só os compromissos criados pelo app.</p>
          </div>
        </div>
      </div>

      <!-- Google Drive -->
      <div data-tour="config-integ-drive" class="rounded-[.5rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 p-5">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-[.5rem] bg-white dark:bg-gray-900 border border-line dark:border-gray-800 flex items-center justify-center shrink-0">
              <img src="https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png" class="w-7 h-7 object-contain" alt="Google Drive" loading="lazy">
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-50">Google Drive</h3>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">Obrigatório</span>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Arquiva o PDF de cada orçamento em pasta própria por cliente.</p>
            </div>
          </div>
          <div class="sm:ml-auto shrink-0 flex items-center gap-2">
            <BaseBadge v-if="hasGoogleScope(googleDriveScope)" variant="success" light>
              <CheckCircle2 class="w-3.5 h-3.5 mr-1" /> Ativo
            </BaseBadge>
            <BaseButton
              v-if="!hasGoogleScope(googleDriveScope)"
              variant="outline"
              size="sm"
              :loading="isConnecting"
              @click="emit('connect', 'drive')"
            >
              Conectar com Google
            </BaseButton>
            <BaseButton
              v-else
              variant="ghost"
              size="sm"
              class="text-red-400 hover:text-red-600"
              :loading="isDisconnecting"
              @click="emit('disconnect')"
            >
              Desconectar
            </BaseButton>
          </div>
        </div>

        <div class="h-px bg-gray-100 dark:bg-gray-800" />

        <div class="grid grid-cols-1 md:grid-cols-2">
          <div class="p-4">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <HardDriveDownload class="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> Como funciona
            </span>
            <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Orçamento aceito gera PDF em <code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px] text-blue-600 dark:text-blue-400 font-mono">Orcei Fácil / Propostas / Cliente</code>.</p>
          </div>
          <div class="p-4 md:border-l border-gray-100 dark:border-gray-800">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <KeyRound class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Segurança
            </span>
            <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Permissão <code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">drive.file</code>: o app só vê e acessa os arquivos que ele próprio criou.</p>
          </div>
        </div>
      </div>
    </div>

  </BaseCard>
</template>

<style scoped src="./index.css"></style>