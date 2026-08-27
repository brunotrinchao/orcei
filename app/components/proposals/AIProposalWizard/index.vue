<script setup lang="ts">
import { useAIProposalWizard } from './index'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:open', val: boolean): void
  (e: 'success', items: any[]): void
}>()

const {
  step,
  promptText,
  results,
  maxPromptLength,
  creditLabel,
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
  Bookmark
} = useAIProposalWizard(props, emit)
</script>

<template>
  <DialogRoot :open="open" @update:open="close">
    <DialogPortal>
      <!-- Overlay com efeito Glassmorphism Refinado -->
      <DialogOverlay 
        class="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md dialog-overlay" 
      />
      
      <!-- Slide-over Premium Lateral -->
      <DialogContent 
        class="fixed inset-y-0 right-0 z-50 h-full w-full sm:max-w-xl bg-slate-900/80 border-l border-slate-800/50 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.15)] flex flex-col ease-out-back dialog-content"
      >
        <!-- Glowing Background Aura (Efeito de Respiração IA) -->
        <div class="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-tr from-violet-500/20 via-fuchsia-500/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse duration-[8000ms]" />
        <div class="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <!-- Header do Slide-over -->
        <div class="relative px-6 py-5 border-b border-slate-800/80 flex items-center justify-between z-10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-[0.75rem] bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles class="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <DialogTitle class="text-base font-black text-white uppercase tracking-tight leading-none mb-1">
                Assistente de IA
              </DialogTitle>
              <span class="text-[10px] font-black text-violet-400 uppercase tracking-widest">Orçamento Inteligente</span>
            </div>
          </div>
          
          <DialogClose type="button" @click="close" class="p-2 text-slate-400 hover:text-white rounded-[0.75rem] hover:bg-slate-800 transition-all cursor-pointer">
            <X class="w-5 h-5" />
          </DialogClose>
        </div>

        <!-- Conteúdo do Slide-over -->
        <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6 z-10 custom-scrollbar">
          
          <!-- STEP 1: PROMPT -->
          <div v-if="step === 'prompt'" class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div class="p-6 bg-gradient-to-br from-violet-950/20 to-fuchsia-950/10 border border-violet-900/30 rounded-[0.75rem] space-y-3">
              <div class="flex items-center gap-2 text-violet-300">
                <Sparkles class="w-5 h-5 shrink-0" />
                <span class="text-xs font-black uppercase tracking-wider">Criação Instantânea</span>
              </div>
              <p class="text-xs text-slate-400 font-medium leading-relaxed">
                Descreva livremente o escopo do serviço. Nossa IA buscará serviços idênticos em seu <strong class="text-emerald-600 text-emerald-400">Catálogo</strong> ou sugerirá preços de <strong class="text-amber-500">Mercado</strong> para criar novas propostas.
              </p>
            </div>

            <div class="relative group space-y-2">
              <div class="flex justify-between items-center px-1">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição do Serviço</span>
              </div>

              <textarea
                v-model="promptText"
                rows="6"
                :maxlength="maxPromptLength"
                aria-label="Descrição do serviço para a IA gerar a proposta"
                placeholder="Ex: Landing Page Premium com alta conversão, incluindo Copywriting estratégico e protótipo UI/UX responsivo em Figma..."
                class="relative w-full px-6 py-5 bg-slate-950 border border-slate-800/80 rounded-[0.75rem] focus:ring-0 focus:border-slate-700 transition-all outline-none font-bold text-slate-200 placeholder:text-slate-700 resize-none"
                @keydown.enter.ctrl="handleGenerateRequest"
              ></textarea>

              <span class="block text-[10px] font-bold text-right" :class="promptText.length >= maxPromptLength ? 'text-red-400 font-black' : 'text-slate-400'">
                {{ promptText.length }}/{{ maxPromptLength }}
              </span>
            </div>
            
            <div class="flex justify-between items-center pt-2">
              <span class="hidden sm:inline text-[10px] font-black text-slate-600 uppercase tracking-widest">Pressione Ctrl + Enter para gerar</span>
              <button 
                @click="handleGenerateRequest" 
                :disabled="!promptText || promptText.length > maxPromptLength"
                class="px-6 py-3 rounded-[0.75rem] bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-violet-500/20 active:scale-98 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
              >
                {{ creditLabel('proposalSuggest', 'Analisar com IA') }}
                <ArrowRight class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- STEP 2: LOADING (Glowing Waves) -->
          <div v-if="step === 'loading'" class="h-[60vh] flex flex-col items-center justify-center gap-8 animate-in fade-in duration-300">
            <div class="relative flex items-center justify-center">
              <!-- Círculos de Ondas Pulsantes -->
              <div class="absolute w-28 h-28 border border-violet-500/30 rounded-full animate-ping duration-1000" />
              <div class="absolute w-36 h-36 border border-fuchsia-500/20 rounded-full animate-ping duration-1500" />
              
              <div class="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-pink-500 flex items-center justify-center shadow-xl shadow-violet-500/30 animate-pulse">
                <Sparkles class="w-8 h-8 text-white" />
              </div>
            </div>
            
            <div class="text-center space-y-3 max-w-sm">
              <p class="text-sm font-black text-white uppercase tracking-tight leading-none">
                Processando Inteligência
              </p>
              <p class="text-xs text-slate-600 font-bold uppercase tracking-widest leading-relaxed">
                Consultando o catálogo e buscando tendências e tabelas de mercado...
              </p>
            </div>
          </div>

          <!-- STEP 3: RESULTS -->
          <div v-if="step === 'results' && results" class="space-y-6 animate-in fade-in duration-300">
            
            <!-- Resumo Inteligente -->
            <div class="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-violet-950/40 flex items-center justify-center">
                  <TrendingUp class="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <p class="text-xs font-black text-white leading-none mb-1">
                    Sugestão de Composição
                  </p>
                  <p class="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    {{ results.items.length }} serviços mapeados
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">IA Pronta</span>
              </div>
            </div>

            <!-- Listagem de Itens -->
            <div class="space-y-4">
              <TransitionGroup 
                name="list" 
                tag="div" 
                class="space-y-4"
              >
                <div 
                  v-for="(item, idx) in results.items" 
                  :key="item._uid || idx" 
                  class="relative overflow-hidden bg-slate-950/40 p-5 rounded-[2rem] border transition-all duration-300 hover:shadow-md flex flex-col gap-4 group"
                  :class="[
                    item.isCatalog 
                      ? 'border-emerald-950/50 border-l-4 border-l-emerald-600 bg-emerald-500/[0.01]' 
                      : 'border-amber-950/50 border-l-4 border-l-amber-600 bg-amber-500/[0.01]'
                  ]"
                >
                  <!-- Badge e Ações -->
                  <div class="flex justify-between items-center">
                    <div class="flex items-center gap-2">
                      <span 
                        v-if="item.isCatalog"
                        class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 bg-emerald-950/30 text-emerald-400 border-emerald-900/30"
                      >
                        <Database class="w-3 h-3" />
                        No Catálogo
                      </span>
                      <span 
                        v-else
                        class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 bg-amber-950/30 text-amber-400 border border-amber-900/30"
                      >
                        <Globe class="w-3 h-3" />
                        Sugestão Mercado
                      </span>
                    </div>

                    <div class="flex items-center gap-1">
                      <button 
                        v-if="!item.isCatalog"
                        @click="saveToCatalog(item)"
                        :disabled="item.isSaving"
                        class="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-1"
                        title="Salvar no catálogo para orçamentos futuros"
                      >
                        <Loader2 v-if="item.isSaving" class="w-3.5 h-3.5 animate-spin" />
                        <Bookmark v-else class="w-3.5 h-3.5" />
                        <span class="text-[9px] font-black uppercase tracking-wider pr-1">Salvar</span>
                      </button>
                      
                      <button 
                        @click="removeItem(idx)" 
                        class="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-950/20 transition-colors"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <!-- Campos de Nome e Descrição -->
                  <div class="space-y-2">
                    <input 
                      v-model="item.name" 
                      class="w-full text-sm font-black text-white bg-transparent border-none focus:ring-0 p-0 placeholder:text-slate-700" 
                      placeholder="Nome do Serviço"
                    >
                    <textarea 
                      v-model="item.description" 
                      rows="2" 
                      class="w-full text-xs font-semibold text-slate-400 bg-slate-900/30 p-3 rounded-2xl border border-slate-800/50 focus:ring-1 focus:ring-violet-500/10 focus:border-violet-500/30 outline-none resize-none transition-all" 
                      placeholder="Descrição detalhada do escopo..."
                    ></textarea>
                  </div>
                  
                  <!-- Controles de Preços e Unidade -->
                  <div class="flex items-center justify-between gap-4 pt-3 border-t border-slate-900">
                    <div class="flex items-center gap-2">
                      <span class="text-[9px] font-black text-slate-600 uppercase tracking-widest">Preço R$</span>
                      <input 
                        v-model.number="item.price" 
                        type="number" 
                        class="w-24 bg-slate-950 text-white px-3 py-1.5 rounded-xl font-black text-xs border border-slate-800 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                      >
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-[9px] font-black text-slate-600 uppercase tracking-widest">Unidade</span>
                      <select 
                        v-model="item.unit" 
                        class="bg-slate-950 text-white px-3 py-1.5 rounded-xl font-black text-[10px] border border-slate-800 focus:ring-2 focus:ring-violet-500/20 outline-none cursor-pointer"
                      >
                        <option value="UN">UN</option>
                        <option value="H">H</option>
                        <option value="DIA">DIA</option>
                        <option value="MES">MES</option>
                      </select>
                    </div>
                  </div>
                </div>
              </TransitionGroup>
            </div>

            <!-- Botões de Rodapé -->
            <div class="flex gap-3 pt-4">
              <button 
                class="flex-1 px-5 py-3 rounded-2xl border border-slate-800 hover:bg-slate-950 font-black text-xs uppercase tracking-wider ttext-slate-300 transition-colors"
                @click="step = 'prompt'"
              >
                Voltar
              </button>
              <button 
                class="flex-[2] px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-violet-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
                @click="handleFinish"
              >
                Importar Serviços
                <ArrowRight class="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>

  <ConfirmCreditDialog
    v-model:open="isCreditConfirmOpen"
    :title="confirmTitle"
    :description="confirmDescription"
    @confirm="handleCreditConfirm"
    @cancel="handleCreditCancel"
  />
</template>

<style scoped src="./index.css"></style>
