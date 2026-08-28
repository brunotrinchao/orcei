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
  <DialogRoot :open="open" @update:open="close">
    <DialogPortal>
      <!-- Overlay com efeito Glassmorphism Refinado -->
      <DialogOverlay class="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md dialog-overlay" />

      <!-- Slide-over Premium Lateral -->
      <DialogContent
        class="fixed inset-y-0 right-0 z-50 h-full w-full sm:max-w-xl bg-[#1D1C2E] border-l border-slate-800/50 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.15)] flex flex-col ease-out-back dialog-content">


        <!-- Header do Slide-over -->
        <div class="relative px-6 py-5 border-b border-slate-800/80 flex items-center justify-between z-10">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-[0.75rem] bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles class="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <DialogTitle class="text-base font-black text-white uppercase tracking-tight leading-none mb-1">
                Assistente de IA Universal
              </DialogTitle>
              <span class="text-[10px] font-black text-violet-400 uppercase tracking-widest">Leitor de Conversas &
                Orçamentos</span>
            </div>
          </div>

          <DialogClose type="button" @click="close"
            class="p-2 text-slate-400 hover:text-white rounded-[0.75rem] hover:bg-slate-800 transition-all cursor-pointer">
            <X class="w-5 h-5" />
          </DialogClose>
        </div>

        <!-- Conteúdo do Slide-over -->
        <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6 z-10 custom-scrollbar">

          <!-- STEP 1: PROMPT -->
          <div v-if="step === 'prompt'" class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div
              class="p-6 bg-gradient-to-br from-violet-950/20 to-fuchsia-950/10 border border-violet-900/30 rounded-[0.75rem] space-y-3">
              <div class="flex items-center gap-2 text-violet-300">
                <Sparkles class="w-5 h-5 shrink-0" />
                <span class="text-xs font-black uppercase tracking-wider">Extração Inteligente</span>
              </div>
              <p class="text-xs text-slate-400 font-medium leading-relaxed">
                Cole qualquer texto: conversa do WhatsApp, e-mail, notas ou solicitação de orçamento. A IA entenderá os
                <strong class="text-violet-400">dados dos clientes</strong> e os <strong
                  class="text-emerald-400">serviços/produtos</strong> desejados.
              </p>
            </div>

            <div class="relative group space-y-2">

              <BaseTextarea v-model="promptText" :rows="9" :maxLength="maxPromptLength" :maxlength="maxPromptLength"
                label="Texto da Conversa ou Solicitação"
                aria-label="Texto da conversa ou solicitação para a IA extrair dados"
                placeholder="Ex: Oi, sou o Carlos da Empresa Tecno, meu e-mail é carlos@tecno.com.br e WhatsApp (11) 99999-8888. Preciso de um orçamento de 1 site corporativo por R$ 2.500 e 1 logotipo por R$ 800..."
                @keydown.enter.ctrl="handleGenerateRequest" background="slate" size="md" :border="false" />

            </div>

          </div>

          <!-- STEP 2: LOADING (Glowing Waves & Dynamic Steps) -->
          <div v-if="step === 'loading'"
            class="h-[60vh] flex flex-col items-center justify-center gap-8 animate-in fade-in duration-300">
            <div class="relative flex items-center justify-center">
              <!-- Círculos de Ondas Pulsantes -->
              <div class="absolute w-28 h-28 border border-violet-500/30 rounded-full animate-ping duration-1000" />
              <div class="absolute w-36 h-36 border border-fuchsia-500/20 rounded-full animate-ping duration-1500" />

              <div
                class="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-pink-500 flex items-center justify-center shadow-xl shadow-violet-500/30 animate-pulse">
                <Sparkles class="w-8 h-8 text-white" />
              </div>
            </div>

            <div class="text-center space-y-4 max-w-sm px-4">
              <p class="text-sm font-black text-white uppercase tracking-tight leading-none">
                Analisando Texto com IA
              </p>

              <!-- Mensagem Dinâmica da Etapa Atual -->
              <div class="min-h-[2.5rem] flex items-center justify-center">
                <p
                  class="text-xs text-violet-300 font-bold uppercase tracking-widest leading-relaxed transition-all duration-300">
                  {{ currentLoadingMessage }}
                </p>
              </div>

              <!-- Indicadores de Progresso das 5 Etapas -->
              <div class="flex items-center justify-center gap-1.5 pt-2">
                <div v-for="(sMsg, idx) in LOADING_STEPS" :key="idx"
                  class="h-1.5 rounded-full transition-all duration-500" :class="[
                    idx === loadingStepIndex
                      ? 'w-6 bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-md shadow-violet-500/40'
                      : (idx < loadingStepIndex ? 'w-2 bg-violet-600/60' : 'w-2 bg-slate-800')
                  ]" />
              </div>
            </div>
          </div>

          <!-- STEP 3: RESULTS -->
          <div v-if="step === 'results' && results" class="space-y-6 animate-in fade-in duration-300">

            <!-- SEÇÃO 1: DADOS DO CLIENTE -->
            <div v-if="extractedClients.length > 0 || isSearchingClient"
              class="p-5 bg-slate-950/70 rounded-[1.5rem] border border-violet-900/30 space-y-4 transition-all">
              <!-- Cabeçalho do Cliente + Toggle de Ativação -->
              <div class="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div class="flex items-center gap-2.5">
                  <div
                    class="w-8 h-8 rounded-xl bg-violet-950/60 border border-violet-800/40 flex items-center justify-center text-violet-400">
                    <User class="w-4 h-4" />
                  </div>
                  <div>
                    <h4 class="text-xs font-black text-white uppercase tracking-tight">Dados do Cliente</h4>
                    <p class="text-[10px] text-slate-400 font-medium">
                      {{ extractedClients.length > 1 ? `${extractedClients.length} contatos encontrados (Selecione 1)` :
                        'Informações identificadas na conversa' }}
                    </p>
                  </div>
                </div>

                <!-- Toggle de Importação de Cliente -->
                <label class="flex items-center gap-2 cursor-pointer select-none">
                  <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Importar Cliente</span>
                  <div class="relative">
                    <input type="checkbox" v-model="importClientEnabled" class="sr-only peer" />
                    <div
                      class="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600">
                    </div>
                  </div>
                </label>
              </div>

              <!-- Seletor de Contatos se houver mais de 1 contato no texto -->
              <div v-if="extractedClients.length > 1 && importClientEnabled" class="space-y-2 pt-1">
                <span class="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Selecione o contato
                  que deseja vincular:</span>
                <div class="flex flex-wrap gap-2">
                  <button v-for="(cItem, idx) in extractedClients" :key="idx" type="button"
                    @click="selectedClientIndex = idx" :class="[
                      selectedClientIndex === idx
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20 border-violet-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    ]"
                    class="px-3 py-1.5 rounded-xl font-bold text-xs border transition-all flex items-center gap-1.5">
                    <Check v-if="selectedClientIndex === idx" class="w-3.5 h-3.5 shrink-0" />
                    <span class="truncate max-w-[150px]">{{ cItem.name || cItem.email || 'Contato ' + (idx + 1)
                      }}</span>
                  </button>
                </div>
              </div>

              <!-- Conteúdo dos Dados do Cliente Selecionado (com opacidade se toggle desativado) -->
              <div :class="{ 'opacity-40 grayscale pointer-events-none': !importClientEnabled }"
                class="space-y-3 transition-all">

                <!-- State 1: Carregando Busca -->
                <div v-if="isSearchingClient" class="flex items-center gap-2 py-2 text-xs text-violet-400 font-bold">
                  <Loader2 class="w-4 h-4 animate-spin" />
                  <span>Buscando se o cliente já está cadastrado...</span>
                </div>

                <!-- State 2: Cliente Encontrado no Sistema -->
                <div v-else-if="currentMatchedClient" class="space-y-2">
                  <div class="flex items-center gap-2">
                    <span
                      class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
                      <UserCheck class="w-3.5 h-3.5" />
                      Cliente Encontrado no Sistema
                    </span>
                  </div>

                  <div class="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p class="text-xs font-black text-white">{{ currentMatchedClient.name }}</p>
                      <p class="text-[10px] text-slate-400 font-medium flex items-center gap-3 mt-0.5">
                        <span v-if="currentMatchedClient.email" class="inline-flex items-center gap-1">
                          <Mail class="w-3 h-3 text-slate-500" /> {{ currentMatchedClient.email }}
                        </span>
                        <span v-if="currentMatchedClient.phone" class="inline-flex items-center gap-1">
                          <Phone class="w-3 h-3 text-slate-500" /> {{ currentMatchedClient.phone }}
                        </span>
                      </p>
                    </div>
                    <span class="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Carregado</span>
                  </div>
                </div>

                <!-- State 3: Novo Cliente Extraído da IA -->
                <div v-else-if="currentSelectedClient" class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span
                      class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 bg-violet-950/50 text-violet-400 border border-violet-800/40">
                      <UserPlus class="w-3.5 h-3.5" />
                      Novo Cliente Extraído
                    </span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div class="sm:col-span-2">
                      <BaseInput v-model="currentSelectedClient.name" label="Nome do Cliente" background="slate"
                        size="md" placeholder="Nome completo ou empresa"
                        :error="importClientEnabled && !currentSelectedClient.name?.trim() ? 'Informe o nome do cliente.' : ''"
                        required :border="false" />
                    </div>
                    <div class="col-span-1">
                      <BaseInput v-model="currentSelectedClient.email" label="E-mail doCliente" background="slate"
                        size="md" placeholder="email@cliente.com"
                        :error="importClientEnabled && !currentSelectedClient.email?.trim() ? 'Informe o e-mail do cliente.' : ''"
                        required :border="false" />
                    </div>
                    <div class="col-span-1">
                      <BaseInput v-model="currentSelectedClient.phone" label="WhatsApp / Tel" background="slate"
                        size="md" mask="phone" placeholder="(00) 00000-0000" :border="false" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card Informativo se NÃO houver cliente no texto -->
            <div v-else
              class="p-4 bg-slate-950/40 rounded-xl border border-slate-800/60 flex items-center justify-between text-slate-400">
              <span class="text-xs font-bold">Nenhum dado de cliente identificado na mensagem.</span>
              <span class="text-[10px] font-black uppercase text-slate-500 tracking-wider">Apenas Serviços</span>
            </div>

            <!-- SEÇÃO 2: SERVIÇOS & PRODUTOS MAPEADOS -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <TrendingUp class="w-4 h-4 text-violet-400" />
                  <h4 class="text-xs font-black text-white uppercase tracking-tight">Serviços Identificados ({{
                    results.items.length }})</h4>
                </div>
              </div>

              <TransitionGroup name="list" tag="div" class="space-y-4">
                <div v-for="(item, idx) in results.items" :key="item._uid || idx"
                  class="relative overflow-hidden bg-slate-950/40 p-5 rounded-[1rem] transition-all duration-300 hover:shadow-md flex flex-col gap-4 group">
                  <!-- Badge e Ações -->
                  <div class="flex justify-between items-center">
                    <div class="flex items-center gap-2">
                      <span v-if="item.isCatalog"
                        class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 bg-emerald-950/30 text-emerald-400 border-emerald-900/30">
                        <Database class="w-3 h-3" />
                        No Catálogo
                      </span>
                      <span v-else
                        class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 bg-amber-950/30 text-amber-400 border border-amber-900/30">
                        <Globe class="w-3 h-3" />
                        Sugestão
                      </span>
                    </div>

                    <div class="flex items-center gap-1">

                      <BaseButton v-if="!item.isCatalog" @click="saveToCatalog(item)" :disabled="item.isSaving"
                        variant="ghost">
                        <Loader2 v-if="item.isSaving" class="w-3.5 h-3.5 animate-spin" />
                        <Bookmark v-else class="w-3.5 h-3.5 mr-2" />
                        Salvar
                      </BaseButton>

                      <BaseButton @click="removeItem(idx)" iconOnly>
                        <Trash2 class="w-3.5 h-3.5" />
                      </BaseButton>
                    </div>
                  </div>

                  <!-- Campos de Nome e Descrição -->
                  <div class="space-y-2">

                    <BaseInput v-model="item.name" background="slate" size="md" placeholder="Nome do Serviço"
                      :border="false" />

                    <BaseTextarea v-model="item.description" :rows="3" placeholder="Descrição detalhada do escopo.."
                      background="slate" size="md" :border="false" />

                  </div>

                  <!-- Controles de Preços e Unidade -->
                  <div class="flex items-center justify-between gap-4 pt-3 border-t border-slate-900">
                    <div class="flex items-center gap-2">

                      <BaseInput v-model.number="item.price" background="gray-900" class="w-auto" size="xs" prefix="R$"
                        mask="currency" required :border="false" />
                    </div>
                    <div class="flex items-center gap-2">
                      <BaseSelect v-model="item.unit" class="w-auto"
                        placeholder="Selecione um orçamento para importar os dados..." :options="[
                          { label: 'Unidade', value: 'UN' },
                          { label: 'Hora', value: 'H' },
                          { label: 'Dia', value: 'DIA' },
                          { label: 'Mês', value: 'MES' },
                        ]" required size="xs" background="gray-900" :border="false" />
                    </div>
                  </div>
                </div>
              </TransitionGroup>
            </div>

          </div>

        </div>

        <!-- Footer Fixo do Modal -->
        <div v-if="step !== 'loading'"
          class="relative px-6 py-4 border-t border-slate-800/80 flex items-center justify-between z-20">
          <!-- STEP 1: PROMPT FOOTER -->
          <template v-if="step === 'prompt'">
            <span class="hidden sm:inline text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Ctrl + Enter
            </span>
            <div class="flex items-center gap-3 ml-auto w-full sm:w-auto justify-end">
              <BaseButton @click="close" variant="ghost">
                Cancelar
              </BaseButton>

              <BaseButton @click="handleGenerateRequest" variant="ia"
                :disabled="!promptText || promptText.length > maxPromptLength" :tooltip="creditLabel('proposalSuggest')">
                <Sparkles class="w-3.5 h-3.5 mr-1"/>
                Analisar com IA
              </BaseButton>

            </div>
          </template>

          <!-- STEP 3: RESULTS FOOTER -->
          <template v-else-if="step === 'results' && results">
            <BaseButton @click="step = 'prompt'" variant="ghost">
              Voltar
            </BaseButton>

            <BaseButton @click="handleFinish" variant="ia"
              :disabled="!promptText || promptText.length > maxPromptLength">
              {{ (currentSelectedClient || currentMatchedClient) && importClientEnabled ? 'Importar Cliente e Serviços'
                : 'Importar Serviços' }}
            </BaseButton>
          </template>
        </div>

      </DialogContent>
    </DialogPortal>
  </DialogRoot>

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
