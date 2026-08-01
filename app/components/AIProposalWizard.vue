<!-- app/components/AIProposalWizard.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  DialogRoot, 
  DialogPortal, 
  DialogOverlay, 
  DialogContent, 
  DialogTitle, 
  DialogClose 
} from 'radix-vue'
import { 
  Sparkles, 
  Loader2, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  X,
  Database,
  Globe,
  PlusCircle,
  HelpCircle,
  TrendingUp,
  Bookmark
} from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:open', val: boolean): void
  (e: 'success', items: any[]): void
}>()

const step = ref<'prompt' | 'loading' | 'results'>('prompt')
const promptText = ref('')
const results = ref<any>(null)
const { notify } = useAlerts()
const { creditLabel } = useCreditCosts()
const { 
  isCreditConfirmOpen, 
  confirmTitle, 
  confirmDescription, 
  executeWithCreditCheck, 
  handleCreditConfirm, 
  handleCreditCancel 
} = useConfirmCreditAction()

function handleGenerateRequest() {
  if (!promptText.value) return notify('Aviso', 'Digite o que você precisa no orçamento.')
  executeWithCreditCheck('proposalSuggest', () => generate(), {
    title: 'Gerar Orçamento com IA',
    customDescription: 'A análise e criação do orçamento por IA consumirá créditos do seu saldo. Deseja continuar?'
  })
}

// Simula a chamada da IA e o processamento de itens híbridos (Catálogo vs Mercado)
async function generate() {
  step.value = 'loading'
  try {
    const data: any = await $fetch('/api/ai/proposal-suggest', {
      method: 'POST',
      body: { prompt: promptText.value }
    })
    
    // Mapeamos os itens para garantir que possuam estados locais de interação e chaves estáveis
    results.value = {
      ...data,
      items: data.items.map((item: any, idx: number) => ({
        ...item,
        _uid: item._uid || `ai_item_${idx}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        // Define se o item é do catálogo ou sugerido baseado no retorno do backend
        isCatalog: !!item.catalogItemId,
        isSaving: false
      }))
    }
    step.value = 'results'
  } catch (e: any) {
    notify('Erro', e.data?.statusMessage || 'Erro ao processar com IA')
    step.value = 'prompt'
  }
}

// Salva um item individualmente no catálogo (Transição Laranja -> Verde)
async function saveToCatalog(item: any) {
  if (item.isCatalog) return
  item.isSaving = true
  
  try {
    const createdItem: any = await $fetch('/api/catalog', {
      method: 'POST',
      body: {
        type: 'service',
        name: item.name,
        description: item.description,
        price: item.price,
        unit: item.unit || 'UN',
        aiAssisted: true
      }
    })
    
    // Sucesso: Atualiza o item localmente para refletir o status de "No Catálogo" (Gira visualmente para Verde)
    item.isCatalog = true
    item.catalogItemId = createdItem._id || createdItem.id
    notify('Catálogo Atualizado', `"${item.name}" foi salvo com sucesso!`)
  } catch (e) {
    notify('Erro', 'Erro ao salvar serviço no catálogo')
  } finally {
    item.isSaving = false
  }
}

async function handleFinish() {
  if (!results.value || !results.value.items.length) return
  
  try {
    // Para todos os itens que ainda não estão no catálogo (Laranja), nós os criamos
    const itemsToSave = results.value.items.filter((item: any) => !item.isCatalog)
    const itemsInCatalog = results.value.items.filter((item: any) => item.isCatalog)
    
    const savedNewItems = await Promise.all(
      itemsToSave.map((item: any) => 
        $fetch('/api/catalog', {
          method: 'POST',
          body: {
            type: 'service',
            name: item.name,
            description: item.description,
            price: item.price,
            unit: item.unit || 'UN',
            aiAssisted: true
          }
        })
      )
    )
    
    // Consolida todos os itens e envia com sucesso para o orçamento principal, garantindo mapeamento de id/catalogItemId
    const allFinalItems = [
      ...itemsInCatalog.map((item: any) => ({ ...item, id: item.catalogItemId || item.id || item._id })),
      ...savedNewItems.map((item: any) => ({ ...item, id: item._id || item.id }))
    ]
    emit('success', allFinalItems)
    close()
  } catch (e) {
    notify('Erro', 'Erro ao processar e salvar os serviços')
  }
}

function close() {
  step.value = 'prompt'
  promptText.value = ''
  results.value = null
  emit('close')
  emit('update:open', false)
}

function removeItem(idx: number) {
  results.value.items.splice(idx, 1)
  if (results.value.items.length === 0) {
    step.value = 'prompt'
  }
}
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
        class="fixed inset-y-0 right-0 z-50 h-full w-full sm:max-w-xl bg-white/80 dark:bg-slate-900/80 border-l border-white/20 dark:border-slate-800/50 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.15)] flex flex-col ease-out-back dialog-content"
      >
        <!-- Glowing Background Aura (Efeito de Respiração IA) -->
        <div class="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-tr from-violet-500/20 via-fuchsia-500/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse duration-[8000ms]" />
        <div class="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <!-- Header do Slide-over -->
        <div class="relative px-6 py-5 border-b border-gray-100 dark:border-slate-800/80 flex items-center justify-between z-10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles class="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <DialogTitle class="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">
                Assistente de IA
              </DialogTitle>
              <span class="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest">Orçamento Inteligente</span>
            </div>
          </div>
          
          <DialogClose type="button" @click="close" class="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer">
            <X class="w-5 h-5" />
          </DialogClose>
        </div>

        <!-- Conteúdo do Slide-over -->
        <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6 z-10 custom-scrollbar">
          
          <!-- STEP 1: PROMPT -->
          <div v-if="step === 'prompt'" class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div class="p-6 bg-gradient-to-br from-violet-50 to-fuchsia-50/50 dark:from-violet-950/20 dark:to-fuchsia-950/10 border border-violet-100/50 dark:border-violet-900/30 rounded-3xl space-y-3">
              <div class="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                <Sparkles class="w-5 h-5 shrink-0" />
                <span class="text-xs font-black uppercase tracking-wider">Criação Instantânea</span>
              </div>
              <p class="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Descreva livremente o escopo do serviço. Nossa IA buscará serviços idênticos em seu <strong class="text-emerald-600 dark:text-emerald-400">Catálogo</strong> ou sugerirá preços de <strong class="text-amber-600 dark:text-amber-500">Mercado</strong> para criar novas propostas.
              </p>
            </div>

            <div class="relative group">
              <!-- Borda com Gradiente Glowing Neon -->
              <div class="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-[2rem] blur opacity-15 group-focus-within:opacity-30 transition duration-300" />
              
              <textarea
                v-model="promptText"
                rows="6"
                aria-label="Descrição do serviço para a IA gerar a proposta"
                placeholder="Ex: Landing Page Premium com alta conversão, incluindo Copywriting estratégico e protótipo UI/UX responsivo em Figma..."
                class="relative w-full px-6 py-5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-[2rem] focus:ring-0 focus:border-slate-200 dark:focus:border-slate-700 transition-all outline-none font-bold text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-sm resize-none"
                @keydown.enter.ctrl="handleGenerateRequest"
              ></textarea>
            </div>
            
            <div class="flex justify-between items-center pt-2">
              <span class="hidden sm:inline text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Pressione Ctrl + Enter para gerar</span>
              <button 
                @click="handleGenerateRequest" 
                :disabled="!promptText"
                class="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-violet-500/20 active:scale-98 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
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
              <p class="text-sm font-black text-slate-950 dark:text-white uppercase tracking-tight leading-none">
                Processando Inteligência
              </p>
              <p class="text-xs text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest leading-relaxed">
                Consultando o catálogo e buscando tendências e tabelas de mercado...
              </p>
            </div>
          </div>

          <!-- STEP 3: RESULTS (Híbridos com Marcações Cromáticas Premium) -->
          <div v-if="step === 'results' && results" class="space-y-6 animate-in fade-in duration-300">
            
            <!-- Resumo Inteligente -->
            <div class="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
                  <TrendingUp class="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p class="text-xs font-black text-slate-900 dark:text-white leading-none mb-1">
                    Sugestão de Composição
                  </p>
                  <p class="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider">
                    {{ results.items.length }} serviços mapeados
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">IA Pronta</span>
              </div>
            </div>

            <!-- Listagem de Itens (Transição Suave de Altura e Movimento) -->
            <div class="space-y-4">
              <TransitionGroup 
                name="list" 
                tag="div" 
                class="space-y-4"
              >
                <div 
                  v-for="(item, idx) in results.items" 
                  :key="item._uid || idx" 
                  class="relative overflow-hidden bg-white dark:bg-slate-950/40 p-5 rounded-[2rem] border transition-all duration-300 hover:shadow-md flex flex-col gap-4 group"
                  :class="[
                    item.isCatalog 
                      ? 'border-emerald-100 dark:border-emerald-950/50 border-l-4 border-l-emerald-500 dark:border-l-emerald-600 bg-emerald-500/[0.01]' 
                      : 'border-amber-100 dark:border-amber-950/50 border-l-4 border-l-amber-500 dark:border-l-amber-600 bg-amber-500/[0.01]'
                  ]"
                >
                  <!-- Badge e Ações -->
                  <div class="flex justify-between items-center">
                    <div class="flex items-center gap-2">
                      <!-- Badge Catálogo -->
                      <span 
                        v-if="item.isCatalog"
                        class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30"
                      >
                        <Database class="w-3 h-3" />
                        No Catálogo
                      </span>
                      <!-- Badge Sugestão de Mercado -->
                      <span 
                        v-else
                        class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30"
                      >
                        <Globe class="w-3 h-3" />
                        Sugestão Mercado
                      </span>
                    </div>

                    <!-- Botão de Ação Rápida: Salvar no Catálogo ou Excluir -->
                    <div class="flex items-center gap-1">
                      <!-- Transmutar Sugestão para Catálogo -->
                      <button 
                        v-if="!item.isCatalog"
                        @click="saveToCatalog(item)"
                        :disabled="item.isSaving"
                        class="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-1"
                        title="Salvar no catálogo para orçamentos futuros"
                      >
                        <Loader2 v-if="item.isSaving" class="w-3.5 h-3.5 animate-spin" />
                        <Bookmark v-else class="w-3.5 h-3.5" />
                        <span class="text-[9px] font-black uppercase tracking-wider pr-1">Salvar</span>
                      </button>
                      
                      <!-- Remover Item -->
                      <button 
                        @click="removeItem(idx)" 
                        class="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <!-- Campos de Nome e Descrição -->
                  <div class="space-y-2">
                    <input 
                      v-model="item.name" 
                      class="w-full text-sm font-black text-slate-900 dark:text-white bg-transparent border-none focus:ring-0 p-0 placeholder:text-slate-300 dark:placeholder:text-slate-700" 
                      placeholder="Nome do Serviço"
                    >
                    <textarea 
                      v-model="item.description" 
                      rows="2" 
                      class="w-full text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-800/50 focus:ring-1 focus:ring-violet-500/10 focus:border-violet-500/30 outline-none resize-none transition-all" 
                      placeholder="Descrição detalhada do escopo..."
                    ></textarea>
                  </div>
                  
                  <!-- Controles de Preços e Unidade -->
                  <div class="flex items-center justify-between gap-4 pt-3 border-t border-slate-50 dark:border-slate-900">
                    <div class="flex items-center gap-2">
                      <span class="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Preço R$</span>
                      <input 
                        v-model.number="item.price" 
                        type="number" 
                        class="w-24 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-1.5 rounded-xl font-black text-xs border border-slate-100 dark:border-slate-800 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                      >
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Unidade</span>
                      <select 
                        v-model="item.unit" 
                        class="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-1.5 rounded-xl font-black text-[10px] border border-slate-100 dark:border-slate-800 focus:ring-2 focus:ring-violet-500/20 outline-none cursor-pointer"
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
                class="flex-1 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 transition-colors"
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

<style scoped>
/* Transições Customizadas com Vue TransitionGroup (Microinterações) */
.list-enter-active,
.list-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.list-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.9);
}

/* Garante o reposicionamento suave da lista enquanto outros itens saem */
.list-move {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Animações nativas para o modal Slide-over do Radix Vue */
.dialog-overlay[data-state="open"] {
  animation: fadeIn 350ms cubic-bezier(0.16, 1, 0.3, 1);
}
.dialog-overlay[data-state="closed"] {
  animation: fadeOut 250ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dialog-content[data-state="open"] {
  animation: slideIn 600ms cubic-bezier(0.34, 1.56, 0.64, 1); /* Efeito elástico spring */
}
.dialog-content[data-state="closed"] {
  animation: slideOut 450ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from { opacity: 0; backdrop-filter: blur(0px); }
  to { opacity: 1; backdrop-filter: blur(12px); }
}
@keyframes fadeOut {
  from { opacity: 1; backdrop-filter: blur(12px); }
  to { opacity: 0; backdrop-filter: blur(0px); }
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
@keyframes slideOut {
  from { transform: translateX(0); }
  to { transform: translateX(100%); }
}
</style>
