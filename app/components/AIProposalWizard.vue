<script setup lang="ts">
import { ref, computed } from 'vue'
import { Sparkles, Loader2, Search, Plus, Trash2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits(['close', 'success'])

const step = ref<'prompt' | 'loading' | 'results'>('prompt')
const promptText = ref('')
const results = ref<any>(null)
const { notify } = useAlerts()

async function generate() {
  if (!promptText.value) return notify('Aviso', 'Digite o que você precisa no orçamento.')
  
  step.value = 'loading'
  try {
    const data: any = await $fetch('/api/ai/proposal-suggest', {
      method: 'POST',
      body: { prompt: promptText.value }
    })
    results.value = data
    step.value = 'results'
  } catch (e: any) {
    notify('Erro', e.data?.statusMessage || 'Erro ao processar com IA')
    step.value = 'prompt'
  }
}

async function handleFinish() {
  if (results.value.type === 'existing') {
    emit('success', results.value.items)
    close()
  } else {
    // Save suggested items to catalog first
    try {
      const createdItems = await Promise.all(
        results.value.items.map((item: any) => 
          $fetch('/api/catalog', {
            method: 'POST',
            body: {
              type: 'service',
              name: item.name,
              description: item.description,
              price: item.price,
              unit: item.unit || 'UN'
            }
          })
        )
      )
      emit('success', createdItems)
      notify('Sucesso', 'Novos serviços criados e adicionados ao orçamento!')
      close()
    } catch (e) {
      notify('Erro', 'Erro ao salvar novos serviços no catálogo')
    }
  }
}

function close() {
  step.value = 'prompt'
  promptText.value = ''
  results.value = null
  emit('close')
}

function removeItem(idx: number) {
  results.value.items.splice(idx, 1)
  if (results.value.items.length === 0) {
    step.value = 'prompt'
  }
}
</script>

<template>
  <BaseDialog :open="open" @update:open="close" title="Criar Orçamento com IA" size="lg">
    <div class="p-6">
      <!-- STEP: PROMPT -->
      <div v-if="step === 'prompt'" class="space-y-6">
        <div class="flex items-center gap-4 p-6 bg-blue-50 rounded-3xl border border-blue-100">
          <Sparkles class="w-8 h-8 text-blue-600 shrink-0" />
          <p class="text-sm text-blue-800 font-bold leading-relaxed">
            Descreva o serviço ou projeto. A IA buscará no seu catálogo ou sugerirá novos itens com preços de mercado.
          </p>
        </div>

        <textarea
          v-model="promptText"
          rows="4"
          placeholder="Ex: Orçamento para criação de uma landing page de alta conversão com copywriting e design..."
          class="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-[2rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-gray-900 placeholder:text-gray-300 shadow-inner resize-none"
          @keydown.enter.ctrl="generate"
        ></textarea>
        
        <div class="flex justify-between items-center">
          <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ctrl + Enter para gerar</span>
          <BaseButton @click="generate" :disabled="!promptText">
            Começar Análise
            <ArrowRight class="w-4 h-4 ml-2" />
          </BaseButton>
        </div>
      </div>

      <!-- STEP: LOADING -->
      <div v-if="step === 'loading'" class="py-20 flex flex-col items-center gap-6">
        <div class="relative">
          <div class="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <Sparkles class="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div class="text-center space-y-2">
          <p class="text-lg font-black text-gray-900 uppercase tracking-tight">Analisando Catálogo...</p>
          <p class="text-xs text-gray-400 font-bold uppercase tracking-widest">A IA está buscando a melhor combinação para você</p>
        </div>
      </div>

      <!-- STEP: RESULTS -->
      <div v-if="step === 'results' && results" class="space-y-6">
        <div 
          :class="results.type === 'existing' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-orange-50 border-orange-100 text-orange-800'"
          class="p-6 rounded-3xl border flex gap-4"
        >
          <CheckCircle2 v-if="results.type === 'existing'" class="w-6 h-6 shrink-0" />
          <AlertCircle v-else class="w-6 h-6 shrink-0" />
          <div>
            <p class="font-black uppercase tracking-tight leading-none mb-1">
              {{ results.type === 'existing' ? 'Serviços Encontrados!' : 'Nenhum serviço idêntico encontrado' }}
            </p>
            <p class="text-xs font-bold opacity-80">
              {{ results.type === 'existing' 
                ? 'Encontramos itens no seu catálogo que atendem ao pedido.' 
                : 'A IA sugeriu novos serviços com base no mercado para você revisar e criar.' }}
            </p>
          </div>
        </div>

        <div class="space-y-4 max-h-[40vh] overflow-y-auto pr-2 scrollbar-hide">
          <div v-for="(item, idx) in results.items" :key="idx" class="bg-white p-6 rounded-[2rem] border-2 border-gray-100 shadow-sm space-y-4 group transition-all hover:border-blue-100">
            <div class="flex justify-between items-start gap-4">
              <div class="flex-1 space-y-2">
                <input v-model="item.name" class="w-full text-lg font-black text-gray-900 bg-transparent border-none focus:ring-0 p-0" placeholder="Nome do Serviço">
                <textarea v-model="item.description" rows="2" class="w-full text-sm font-medium text-gray-500 bg-gray-50 p-3 rounded-xl border-none focus:ring-2 focus:ring-blue-500/10 outline-none resize-none" placeholder="Descrição..."></textarea>
              </div>
              <button @click="removeItem(idx)" class="p-2 text-gray-300 hover:text-red-500 transition-colors">
                <Trash2 class="w-5 h-5" />
              </button>
            </div>
            
            <div class="flex items-center gap-6 pt-2 border-t border-gray-50">
              <div class="flex items-center gap-3">
                <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preço Sugerido R$</span>
                <input v-model.number="item.price" type="number" class="w-28 bg-gray-50 px-4 py-2 rounded-xl font-bold text-sm border-none focus:ring-2 focus:ring-blue-500/20">
              </div>
              <div class="flex items-center gap-3">
                <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Unidade</span>
                <select v-model="item.unit" class="bg-gray-50 px-4 py-2 rounded-xl font-bold text-xs border-none focus:ring-2 focus:ring-blue-500/20">
                  <option value="UN">UN</option>
                  <option value="H">H</option>
                  <option value="DIA">DIA</option>
                  <option value="MES">MES</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-4 pt-4">
          <BaseButton variant="secondary" class="flex-1" @click="step = 'prompt'">Voltar</BaseButton>
          <BaseButton class="flex-[2]" @click="handleFinish">
            {{ results.type === 'existing' ? 'Usar Serviços Selecionados' : 'Criar Serviços e Continuar' }}
            <ArrowRight class="w-4 h-4 ml-2" />
          </BaseButton>
        </div>
      </div>
    </div>
  </BaseDialog>
</template>
