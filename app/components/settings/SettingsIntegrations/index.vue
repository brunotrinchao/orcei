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

const { ShieldCheck, Lock, Wand2, CheckCircle2, Globe } = useSettingsIntegrations()
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
          class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-[10px] font-black uppercase tracking-widest rounded-[0.75rem] border border-gray-200 dark:border-gray-700 hover:border-sky-400 hover:text-sky-600 transition-all cursor-pointer"
          @click="emit('openWizard')"
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
            <span v-if="hasGoogleScope(googleCalendarScope)" class="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-200/50 dark:border-green-900/50">
              <CheckCircle2 class="w-3 h-3 text-green-600 dark:text-green-400" /> Ativo
            </span>
            <BaseButton
              v-if="!hasGoogleScope(googleCalendarScope)"
              variant="outline"
              size="sm"
              class="text-[10px]"
              :loading="isConnecting"
              @click="emit('connect', 'calendar')"
            >
              Conectar com Google
            </BaseButton>
            <BaseButton
              v-else
              variant="ghost"
              size="sm"
              class="text-[10px] text-red-400 hover:text-red-600"
              :loading="isDisconnecting"
              @click="emit('disconnect')"
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
            <span v-if="hasGoogleScope(googleDriveScope)" class="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-200/50 dark:border-green-900/50">
              <CheckCircle2 class="w-3 h-3 text-green-600 dark:text-green-400" /> Ativo
            </span>
            <BaseButton
              v-if="!hasGoogleScope(googleDriveScope)"
              variant="outline"
              size="sm"
              class="text-[10px]"
              :loading="isConnecting"
              @click="emit('connect', 'drive')"
            >
              Conectar com Google
            </BaseButton>
            <BaseButton
              v-else
              variant="ghost"
              size="sm"
              class="text-[10px] text-red-400 hover:text-red-600"
              :loading="isDisconnecting"
              @click="emit('disconnect')"
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

    <template #footer>
      <BaseButton type="button" size="md" class="shrink-0" :disabled="isSaving" :loading="isSaving" @click="emit('save')">
        {{ isSaving ? 'Salvando...' : 'Salvar' }}
      </BaseButton>
    </template>
  </BaseCard>
</template>

<style scoped src="./index.css"></style>
