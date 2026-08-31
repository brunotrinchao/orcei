<script setup lang="ts">
import { useAIProposalWizard } from './index'

const props = defineProps<{
  open: boolean
}>()

import { Plus, Search, Image, Pencil, Trash2, Sparkles, RefreshCcw, Package, ShoppingBag, HelpCircle, MoreVertical, Upload } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:open', val: boolean): void
  (e: 'success', payload: { client?: any; items: any[] }): void
}>()

const {
  step,
  promptText,
  results,
  extractedClients,
  selectedClientIndex,
  currentSelectedClient,
  currentMatchedClient,
  matchedClientsMap,
  isSearchingClient,
  importClientEnabled,
  isExistingClientModalOpen,
  existingClientFound,
  confirmUseExistingClient,
  maxPromptLength,
  creditLabel,
  LOADING_STEPS,
  loadingStepIndex,
  currentLoadingMessage,
  isCreditConfirmOpen,
  confirmTitle,
  confirmDescription,
  handleGenerateRequest,
  saveToCatalog,
  handleFinish,
  close,
  removeItem,
  handleCreditConfirm,
  handleCreditCancel,
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
  Sparkles,
  Loader2,
  Trash2,
  ArrowRight,
  X,
  Database,
  Globe,
  TrendingUp,
  Bookmark,
  UserCheck,
  UserPlus,
  User,
  Mail,
  Phone,
  Check,
  AlertCircle
} = useAIProposalWizard(props, emit)
</script>

<template>

  <!-- BaseDrawer substituindo a estrutura manual de Dialog -->
  <BaseDrawer :open="open" @update:open="close" position="right" size="xl" title="Assistente de IA"
    description="Leitor de Conversas & Orçamentos">
    <!-- 2. Conteúdo Principal (Corpo Rolável Automaticamente pelo BaseDrawer) -->
    <div class="space-y-6">
      <!-- ETAPA 1: Prompt do Usuário -->
      <div v-if="step === 'prompt'" class="space-y-6">
        <BaseCard compact color="ia">
          <template #header>
            <div class="flex items-center gap-2 text-violet-300">
              <Sparkles class="w-5 h-5 shrink-0" />
              <span class="text-xs font-semibold tracking-wide">Extração Inteligente</span>
            </div>
          </template>
          <p class="text-xs font-base leading-relaxed text-white">
            Cole qualquer texto: conversa do WhatsApp, e-mail, notas ou solicitação de orçamento. A IA entenderá os
            <strong class="text-violet-400">dados dos clientes</strong> e os <strong
              class="text-emerald-400">serviços/produtos</strong> desejados.
          </p>
        </BaseCard>

        <BaseTextarea v-model="promptText" :rows="9" :maxLength="maxPromptLength" :maxlength="maxPromptLength"
          label="Texto da Conversa ou Solicitação" aria-label="Texto da conversa ou solicitação para a IA extrair dados"
          placeholder="Ex: Oi, sou o Carlos da Empresa Tecno, meu e-mail é carlos@tecno.com.br e WhatsApp (11) 99999-8888. Preciso de um orçamento de 1 site corporativo por R$ 2.500 e 1 logotipo por R$ 800..."
          @keydown.enter.ctrl="handleGenerateRequest" background="" size="md" />
      </div>
      <!-- ETAPA 2: Loading Animado -->
      <div v-if="step === 'loading'" class="h-[60vh] flex flex-col items-center justify-center">
        <!-- Animações de IA -->
      </div>
      <!-- ETAPA 3: Resultados Encontrados -->
      <div v-if="step === 'results' && results" class="space-y-6">
        <!-- Clientes e Serviços Mapeados -->
      </div>
    </div>
    <!-- 3. Rodapé Fixo (Footer) -->
    <template #footer>
      <template v-if="step === 'prompt'">
        <BaseButton @click="close" variant="ghost">
          Cancelar
        </BaseButton>
        <BaseButton @click="handleGenerateRequest" variant="ia" :disabled="!promptText">
          <Sparkles class="w-3.5 h-3.5 mr-1" />
          Analisar com IA
        </BaseButton>
      </template>
      <template v-else-if="step === 'results' && results">
        <BaseButton @click="step = 'prompt'" variant="ghost">
          Voltar
        </BaseButton>
        <BaseButton @click="handleFinish" variant="ia">
          Importar Serviços
        </BaseButton>
      </template>
    </template>
  </BaseDrawer>

  <ConfirmCreditDialog v-model:open="isCreditConfirmOpen" :title="confirmTitle" :description="confirmDescription"
    @confirm="handleCreditConfirm" @cancel="handleCreditCancel" />

  <!-- Modal de Alerta: Cliente Já Cadastrado -->
  <DialogRoot :open="isExistingClientModalOpen" @update:open="isExistingClientModalOpen = false">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-md" />
      <DialogContent
        class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[61] w-[90vw] max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 text-white">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <UserCheck class="w-5 h-5" />
          </div>
          <div>
            <DialogTitle class="text-base font-black uppercase tracking-tight">
              Cliente já cadastrado
            </DialogTitle>
            <p class="text-xs text-slate-400">
              Encontramos um cliente no seu sistema com estes dados:
            </p>
          </div>
        </div>

        <!-- Card do Cliente Encontrado -->
        <div v-if="existingClientFound" class="p-4 bg-slate-800/80 border border-slate-700/60 rounded-xl space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm font-black text-white">{{ existingClientFound.name }}</span>
            <BaseBadge varaint="info">Cadastrado</BaseBadge>
          </div>
          <div v-if="existingClientFound.email" class="text-xs text-slate-300 flex items-center gap-2">
            <Mail class="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{{ existingClientFound.email }}</span>
          </div>
          <div v-if="existingClientFound.phone" class="text-xs text-slate-300 flex items-center gap-2">
            <Phone class="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{{ existingClientFound.phone }}</span>
          </div>
        </div>

        <p class="text-xs text-slate-300 leading-relaxed font-medium">
          Deseja utilizar este cliente já cadastrado para a proposta?
        </p>

        <div class="flex items-center justify-end gap-3 pt-2">
          <BaseButton variant="ghost" size="md" @click="isExistingClientModalOpen = false">
            Não
          </BaseButton>
          <BaseButton variant="primary" size="md" @click="confirmUseExistingClient">
            Usar este cliente
          </BaseButton>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped src="./index.css"></style>
